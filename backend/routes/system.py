from flask import Blueprint, request, jsonify
from config import Config, DATABASE_PATH, UPLOADS_DIR
from services.ollama_service import check_ollama_health
from services.whisper_service import get_whisper_model
from database import get_db

system_bp = Blueprint("system", __name__, url_prefix="/api/system")

@system_bp.route("/status", methods=["GET"])
def get_system_status():
    """
    Returns the comprehensive offline and AI subsystem health status.
    """
    ollama_info = check_ollama_health()
    
    # Whisper check
    whisper_available = False
    try:
        import whisper
        whisper_available = True
    except ImportError:
        pass

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users")
    user_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM loved_ones")
    loved_ones_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM audio_recordings")
    audio_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM stories")
    story_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM vault_items")
    vault_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM ofrenda_candles WHERE is_lit = 1")
    lit_candles_count = cursor.fetchone()["count"]
    conn.close()

    return jsonify({
        "status": "healthy",
        "app_name": "Echoes – Memories Never Die",
        "version": "1.0.0 (Hacktoberfest 2026)",
        "offline_ready": True,
        "local_storage": {
            "database": DATABASE_PATH,
            "uploads_folder": UPLOADS_DIR
        },
        "stats": {
            "users": user_count,
            "loved_ones": loved_ones_count,
            "audio_recordings": audio_count,
            "stories": story_count,
            "vault_items": vault_count,
            "lit_candles": lit_candles_count
        },
        "ai_subsystems": {
            "ollama": ollama_info,
            "whisper": {
                "installed": whisper_available,
                "model": getattr(Config, "WHISPER_MODEL", "base"),
                "status": "Ready for local transcription" if whisper_available else "Whisper module not found"
            }
        }
    })

@system_bp.route("/check-ollama", methods=["POST"])
def recheck_ollama():
    """Manual re-check of the Ollama service"""
    return jsonify(check_ollama_health())

@system_bp.route("/set-model", methods=["POST"])
def set_model():
    """Dynamically switch the active Ollama model"""
    data = request.get_json() or {}
    model_name = data.get("model_name", "").strip()
    if not model_name:
        return jsonify({"error": "model_name is required"}), 400

    Config.OLLAMA_MODEL = model_name
    return jsonify({"message": f"Active AI model set to '{model_name}'.", "model": model_name})
