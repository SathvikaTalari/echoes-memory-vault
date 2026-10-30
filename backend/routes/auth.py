from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from config import Config
from database import get_db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

def create_jwt_token(user_id, username):
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing Authorization header"}), 401
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format"}), 401
            
        token = parts[1]
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
            request.user_id = payload["user_id"]
            request.username = payload["username"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    display_name = data.get("display_name", "").strip() or username

    if not username or len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters long."}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    conn = get_db()
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)", (username, email))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "A user with that username or email already exists."}), 409

    pwd_hash = generate_password_hash(password)
    cursor.execute("""
        INSERT INTO users (username, email, password_hash, display_name)
        VALUES (?, ?, ?, ?)
    """, (username, email or None, pwd_hash, display_name))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    token = create_jwt_token(user_id, username)
    return jsonify({
        "message": "Account created successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "username": username,
            "display_name": display_name,
            "email": email
        }
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, password_hash, display_name FROM users WHERE username = ? OR email = ?", (username, username))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password."}), 401

    token = create_jwt_token(user["id"], user["username"])
    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "display_name": user["display_name"],
            "email": user["email"]
        }
    })

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, display_name, created_at FROM users WHERE id = ?", (request.user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "user": {
            "id": user["id"],
            "username": user["username"],
            "display_name": user["display_name"],
            "email": user["email"],
            "created_at": user["created_at"]
        }
    })
