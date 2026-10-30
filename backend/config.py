import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
AUDIO_DIR = os.path.join(UPLOADS_DIR, "audio")
PHOTOS_DIR = os.path.join(UPLOADS_DIR, "photos")
OFFERINGS_DIR = os.path.join(UPLOADS_DIR, "offerings")
AVATARS_DIR = os.path.join(UPLOADS_DIR, "avatars")

# Ensure required directories exist
for folder in [DATA_DIR, UPLOADS_DIR, AUDIO_DIR, PHOTOS_DIR, OFFERINGS_DIR, AVATARS_DIR]:
    os.makedirs(folder, exist_ok=True)

DATABASE_PATH = os.path.join(DATA_DIR, "echoes.db")

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "echoes-memories-never-die-hacktober-2026-sacred-vault-secret-key-64bytes-long-super-secure")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "echoes-jwt-sacred-key-2026-hacktoberfest-secure-token-vault-64bytes")
    JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", "720")) # 30 days for offline local app
    
    # SQLite Database
    DATABASE = DATABASE_PATH
    
    # Upload limits
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100 MB max file upload
    UPLOAD_FOLDER = UPLOADS_DIR
    
    # Ollama Local AI Engine
    OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:3b-instruct")
    
    # Local Whisper Speech-To-Text
    WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")
    
    # CORS Origin
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]
