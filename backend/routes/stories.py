import json
from flask import Blueprint, request, jsonify
from routes.auth import require_auth
from database import get_db
from services.ollama_service import generate_story_from_transcript

stories_bp = Blueprint("stories", __name__, url_prefix="/api")

@stories_bp.route("/loved-ones/<int:loved_one_id>/stories/generate", methods=["POST"])
@require_auth
def generate_story(loved_one_id):
    """
    Generate an AI narrative from transcript using Qwen2.5-3B-Instruct via Ollama.
    """
    data = request.get_json() or {}
    transcript = data.get("transcript", "").strip()
    style = data.get("style", "Intimate Family Chronicle")
    context_notes = data.get("context_notes", "")
    audio_recording_id = data.get("audio_recording_id")

    if not transcript:
        # If audio_recording_id provided, fetch transcript from DB
        if audio_recording_id:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT transcript_raw, title FROM audio_recordings WHERE id = ? AND loved_one_id = ?", (audio_recording_id, loved_one_id))
            rec = cursor.fetchone()
            conn.close()
            if rec and rec["transcript_raw"]:
                transcript = rec["transcript_raw"]
                if not context_notes:
                    context_notes = f"Audio Recording Title: {rec['title']}"

    if not transcript:
        return jsonify({"error": "A transcript or spoken memory text is required to weave a story."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT name, relationship, bio FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    profile = cursor.fetchone()
    conn.close()

    if not profile:
        return jsonify({"error": "Profile not found or access denied."}), 404

    story_data = generate_story_from_transcript(
        loved_one_name=profile["name"],
        transcript=transcript,
        style=style,
        context_notes=context_notes
    )

    story_data["audio_recording_id"] = audio_recording_id
    story_data["style_requested"] = style

    return jsonify({
        "message": "Story woven successfully by Echoes Storyteller.",
        "generated_story": story_data
    })

@stories_bp.route("/loved-ones/<int:loved_one_id>/stories", methods=["GET"])
@require_auth
def list_stories(loved_one_id):
    """List all stories for a loved one"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    cursor.execute("""
        SELECT s.*, a.title as audio_title
        FROM stories s
        LEFT JOIN audio_recordings a ON s.audio_recording_id = a.id
        WHERE s.loved_one_id = ?
        ORDER BY s.is_favorite DESC, s.created_at DESC
    """, (loved_one_id,))
    
    rows = cursor.fetchall()
    results = []
    for r in rows:
        item = dict(r)
        if item.get("tags"):
            try:
                item["tags"] = json.loads(item["tags"])
            except Exception:
                item["tags"] = []
        results.append(item)
        
    conn.close()
    return jsonify({"stories": results})

@stories_bp.route("/loved-ones/<int:loved_one_id>/stories", methods=["POST"])
@require_auth
def create_story(loved_one_id):
    """Save a written or AI-generated story to the memory vault"""
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    narrative = data.get("narrative", "").strip()

    if not title or not narrative:
        return jsonify({"error": "Title and narrative content are required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    tags = data.get("tags")
    tags_json = json.dumps(tags) if isinstance(tags, list) else json.dumps([])

    cursor.execute("""
        INSERT INTO stories (
            loved_one_id, audio_recording_id, title, narrative, story_style,
            era_timeframe, location, key_wisdom, emotional_tone, tags, is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        loved_one_id,
        data.get("audio_recording_id"),
        title,
        narrative,
        data.get("story_style", "Intimate Family Chronicle"),
        data.get("era_timeframe"),
        data.get("location"),
        data.get("key_wisdom"),
        data.get("emotional_tone"),
        tags_json,
        1 if data.get("is_favorite") else 0
    ))
    new_id = cursor.lastrowid
    
    # Also add as a story item in the Digital Memory Vault
    cursor.execute("""
        INSERT INTO vault_items (
            loved_one_id, type, title, description, memory_date, location, people_tagged, category, is_highlight
        ) VALUES (?, 'story', ?, ?, ?, ?, ?, 'Wisdom', ?)
    """, (
        loved_one_id,
        title,
        data.get("key_wisdom") or narrative[:200] + "...",
        data.get("era_timeframe"),
        data.get("location"),
        tags_json,
        1 if data.get("is_favorite") else 0
    ))
    
    conn.commit()
    cursor.execute("SELECT * FROM stories WHERE id = ?", (new_id,))
    created = dict(cursor.fetchone())
    conn.close()

    if created.get("tags"):
        try:
            created["tags"] = json.loads(created["tags"])
        except Exception:
            created["tags"] = []

    return jsonify({"message": "Story preserved in memory vault.", "story": created}), 201

@stories_bp.route("/stories/<int:story_id>", methods=["GET"])
@require_auth
def get_story(story_id):
    """Get single story details"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, l.name as loved_one_name, a.title as audio_title
        FROM stories s
        JOIN loved_ones l ON s.loved_one_id = l.id
        LEFT JOIN audio_recordings a ON s.audio_recording_id = a.id
        WHERE s.id = ? AND l.user_id = ?
    """, (story_id, request.user_id))
    
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Story not found or access denied."}), 404

    item = dict(row)
    if item.get("tags"):
        try:
            item["tags"] = json.loads(item["tags"])
        except Exception:
            item["tags"] = []

    return jsonify({"story": item})

@stories_bp.route("/stories/<int:story_id>", methods=["PUT"])
@require_auth
def update_story(story_id):
    """Update story narrative, metadata, or toggle favorite"""
    data = request.get_json() or {}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.id FROM stories s
        JOIN loved_ones l ON s.loved_one_id = l.id
        WHERE s.id = ? AND l.user_id = ?
    """, (story_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Story not found or access denied."}), 404

    tags_json = None
    if "tags" in data:
        tags_json = json.dumps(data["tags"]) if isinstance(data["tags"], list) else data["tags"]

    cursor.execute("""
        UPDATE stories
        SET title = COALESCE(?, title),
            narrative = COALESCE(?, narrative),
            story_style = COALESCE(?, story_style),
            era_timeframe = COALESCE(?, era_timeframe),
            location = COALESCE(?, location),
            key_wisdom = COALESCE(?, key_wisdom),
            emotional_tone = COALESCE(?, emotional_tone),
            tags = COALESCE(?, tags),
            is_favorite = COALESCE(?, is_favorite)
        WHERE id = ?
    """, (
        data.get("title"),
        data.get("narrative"),
        data.get("story_style"),
        data.get("era_timeframe"),
        data.get("location"),
        data.get("key_wisdom"),
        data.get("emotional_tone"),
        tags_json,
        data.get("is_favorite"),
        story_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Story updated successfully."})

@stories_bp.route("/stories/<int:story_id>", methods=["DELETE"])
@require_auth
def delete_story(story_id):
    """Delete a story from the vault"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM stories 
        WHERE id = ? AND loved_one_id IN (SELECT id FROM loved_ones WHERE user_id = ?)
    """, (story_id, request.user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected == 0:
        return jsonify({"error": "Story not found or access denied."}), 404

    return jsonify({"message": "Story deleted from vault."})
