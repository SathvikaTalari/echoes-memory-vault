import os
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from config import Config, UPLOADS_DIR, AUDIO_DIR, PHOTOS_DIR, OFFERINGS_DIR, AVATARS_DIR, BASE_DIR
from database import init_db

# Blueprints
from routes.auth import auth_bp
from routes.loved_ones import loved_ones_bp
from routes.audio import audio_bp
from routes.stories import stories_bp
from routes.vault import vault_bp
from routes.ofrenda import ofrenda_bp
from routes.qa import qa_bp
from routes.system import system_bp

def create_app():
    # Detect frontend build location
    dist_dir = os.environ.get("FRONTEND_DIST", os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist")))
    public_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "public"))

    app = Flask(__name__, static_folder=dist_dir if os.path.exists(dist_dir) else None)
    app.config.from_object(Config)

    # Initialize DB if not present
    init_db()

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(loved_ones_bp)
    app.register_blueprint(audio_bp)
    app.register_blueprint(stories_bp)
    app.register_blueprint(vault_bp)
    app.register_blueprint(ofrenda_bp)
    app.register_blueprint(qa_bp)
    app.register_blueprint(system_bp)

    # Serve user uploads
    @app.route("/api/uploads/<folder>/<filename>")
    def serve_upload(folder, filename):
        safe_folders = {
            "audio": AUDIO_DIR,
            "photos": PHOTOS_DIR,
            "offerings": OFFERINGS_DIR,
            "avatars": AVATARS_DIR
        }
        target_dir = safe_folders.get(folder)
        if not target_dir or not os.path.exists(os.path.join(target_dir, filename)):
            return jsonify({"error": "File not found"}), 404
        return send_from_directory(target_dir, filename)

    # Serve sample photos and offerings from frontend/public or dist
    @app.route("/sample_photos/<path:filename>")
    def serve_sample_photos(filename):
        for candidate in [
            os.path.join(dist_dir, "sample_photos"),
            os.path.join(public_dir, "sample_photos")
        ]:
            if os.path.exists(os.path.join(candidate, filename)):
                return send_from_directory(candidate, filename)
        return jsonify({"error": "Sample photo not found"}), 404

    @app.route("/sample_offerings/<path:filename>")
    def serve_sample_offerings(filename):
        for candidate in [
            os.path.join(dist_dir, "sample_offerings"),
            os.path.join(public_dir, "sample_offerings")
        ]:
            if os.path.exists(os.path.join(candidate, filename)):
                return send_from_directory(candidate, filename)
        return jsonify({"error": "Sample offering not found"}), 404

    # Health check root
    @app.route("/api/health")
    def health_check():
        return jsonify({
            "status": "online",
            "project": "Echoes – Memories Never Die",
            "challenge": "Hacktoberfest 2026 Ghost in the Machine"
        })

    # Serve production frontend SPA if built
    if os.path.exists(dist_dir):
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_spa(path):
            if path.startswith("api/"):
                return jsonify({"error": "API route not found"}), 404
            file_path = os.path.join(dist_dir, path)
            if path and os.path.exists(file_path) and not os.path.isdir(file_path):
                return send_from_directory(dist_dir, path)
            return send_from_directory(dist_dir, "index.html")

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith("/api/"):
            return jsonify({"error": "API endpoint not found"}), 404
        if os.path.exists(dist_dir):
            return send_from_directory(dist_dir, "index.html")
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error occurred."}), 500

    return app

if __name__ == "__main__":
    print("=" * 60)
    print("[*] ECHOES - MEMORIES NEVER DIE (Hacktoberfest 2026)")
    print("Initializing SQLite Database & Seed Data...")
    init_db()
    print("Database verified at:", Config.DATABASE)
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Flask Backend on http://127.0.0.1:{port}...")
    print("=" * 60)
    
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=False)
