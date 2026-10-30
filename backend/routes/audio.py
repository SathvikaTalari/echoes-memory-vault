import os
import uuid
import json
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from routes.auth import require_auth
from database import get_db
from config import AUDIO_DIR
from services.whisper_service import transcribe_audio_file

audio_bp = Blueprint("audio", __name__, url_prefix="/api")

ALLOWED_AUDIO_EXTENSIONS = {"wav", "mp3", "m4a", "webm", "ogg", "flac"}

def allowed_audio(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_AUDIO_EXTENSIONS

@audio_bp.route("/loved-ones/<int:loved_one_id>/audio", methods=["GET"])
@require_auth
def list_audio_recordings(loved_one_id):
    """List all audio recordings for a loved one"""
    conn = get_db()
    cursor = conn.cursor()
    # Check ownership
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    cursor.execute("""
        SELECT a.*, 
               (SELECT COUNT(*) FROM stories s WHERE s.audio_recording_id = a.id) as story_count
        FROM audio_recordings a
        WHERE a.loved_one_id = ?
        ORDER BY a.created_at DESC
    """, (loved_one_id,))
    
    rows = cursor.fetchall()
    results = []
    for r in rows:
        item = dict(r)
        if item.get("transcript_segments"):
            try:
                item["transcript_segments"] = json.loads(item["transcript_segments"])
            except Exception:
                item["transcript_segments"] = []
        results.append(item)
        
    conn.close()
    return jsonify({"recordings": results})

@audio_bp.route("/loved-ones/<int:loved_one_id>/audio/upload", methods=["POST"])
@require_auth
def upload_audio(loved_one_id):
    """Upload an audio file and transcribe it locally with Whisper"""
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided."}), 400

    file = request.files["audio"]
    title = request.form.get("title", "").strip() or "Untitled Audio Memory"
    recorded_date = request.form.get("recorded_date", "")
    notes = request.form.get("notes", "")
    language = request.form.get("language") or None
    auto_transcribe = request.form.get("auto_transcribe", "true").lower() == "true"

    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    if not allowed_audio(file.filename):
        return jsonify({"error": f"Audio file format not supported. Allowed formats: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    profile = cursor.fetchone()
    if not profile:
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_filename = f"audio_{loved_one_id}_{uuid.uuid4().hex[:10]}.{ext}"
    save_path = os.path.join(AUDIO_DIR, unique_filename)
    file.save(save_path)

    transcript_raw = ""
    segments_json = json.dumps([])
    transcribe_result = {"success": True, "engine": "none"}

    if auto_transcribe:
        transcribe_result = transcribe_audio_file(save_path, language=language)
        if transcribe_result.get("success"):
            transcript_raw = transcribe_result.get("transcript_raw", "")
            segments_json = json.dumps(transcribe_result.get("segments", []))
        else:
            # Keep note of transcription issue but save the file
            transcript_raw = f"[Transcription Notice: {transcribe_result.get('error', 'Transcription pending or format requires WAV/FFmpeg')}]"

    cursor.execute("""
        INSERT INTO audio_recordings (
            loved_one_id, title, filename, file_path, duration_seconds,
            transcript_raw, transcript_segments, recorded_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        loved_one_id,
        title,
        unique_filename,
        save_path,
        0, # duration can be updated
        transcript_raw,
        segments_json,
        recorded_date or None,
        notes or None
    ))
    
    new_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute("SELECT * FROM audio_recordings WHERE id = ?", (new_id,))
    created = dict(cursor.fetchone())
    conn.close()

    if created.get("transcript_segments"):
        try:
            created["transcript_segments"] = json.loads(created["transcript_segments"])
        except Exception:
            created["transcript_segments"] = []

    return jsonify({
        "message": "Audio memory uploaded and processed successfully.",
        "recording": created,
        "transcription": transcribe_result
    }), 201

@audio_bp.route("/audio/<int:audio_id>/transcribe", methods=["POST"])
@require_auth
def retranscribe_audio(audio_id):
    """Trigger manual re-transcription using local Whisper"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, l.user_id 
        FROM audio_recordings a 
        JOIN loved_ones l ON a.loved_one_id = l.id
        WHERE a.id = ? AND l.user_id = ?
    """, (audio_id, request.user_id))
    
    record = cursor.fetchone()
    if not record:
        conn.close()
        return jsonify({"error": "Audio recording not found or access denied."}), 404

    data = request.get_json() or {}
    language = data.get("language")

    file_path = record["file_path"]
    if not os.path.isabs(file_path):
        file_path = os.path.join(AUDIO_DIR, record["filename"])

    transcribe_result = transcribe_audio_file(file_path, language=language)
    if not transcribe_result.get("success"):
        conn.close()
        return jsonify({"error": transcribe_result.get("error", "Transcription failed."), "details": transcribe_result}), 500

    new_raw = transcribe_result.get("transcript_raw", "")
    new_segments = json.dumps(transcribe_result.get("segments", []))

    cursor.execute("""
        UPDATE audio_recordings 
        SET transcript_raw = ?, transcript_segments = ?
        WHERE id = ?
    """, (new_raw, new_segments, audio_id))
    
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Audio transcription complete.",
        "transcript_raw": new_raw,
        "segments": transcribe_result.get("segments", [])
    })

@audio_bp.route("/audio/<int:audio_id>", methods=["PUT"])
@require_auth
def update_audio_recording(audio_id):
    """Edit title, raw transcript or notes of an audio recording"""
    data = request.get_json() or {}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id FROM audio_recordings a 
        JOIN loved_ones l ON a.loved_one_id = l.id
        WHERE a.id = ? AND l.user_id = ?
    """, (audio_id, request.user_id))
    
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Audio recording not found or access denied."}), 404

    cursor.execute("""
        UPDATE audio_recordings
        SET title = COALESCE(?, title),
            transcript_raw = COALESCE(?, transcript_raw),
            recorded_date = COALESCE(?, recorded_date),
            notes = COALESCE(?, notes)
        WHERE id = ?
    """, (
        data.get("title"),
        data.get("transcript_raw"),
        data.get("recorded_date"),
        data.get("notes"),
        audio_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Audio recording updated successfully."})

@audio_bp.route("/audio/<int:audio_id>/stream", methods=["GET"])
def stream_audio(audio_id):
    """Stream audio file for in-browser playback"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT filename, file_path FROM audio_recordings WHERE id = ?", (audio_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Audio file not found."}), 404

    target_path = row["file_path"]
    if not os.path.exists(target_path):
        target_path = os.path.join(AUDIO_DIR, row["filename"])
        
    if not os.path.exists(target_path):
        return jsonify({"error": "Audio file missing from storage."}), 404

    ext = row["filename"].rsplit(".", 1)[-1].lower()
    mimetypes = {
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "m4a": "audio/mp4",
        "webm": "audio/webm",
        "ogg": "audio/ogg",
        "flac": "audio/flac"
    }
    mimetype = mimetypes.get(ext, "audio/mpeg")

    return send_file(target_path, mimetype=mimetype)
