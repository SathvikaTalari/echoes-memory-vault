import os
import json
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from routes.auth import require_auth
from database import get_db
from config import AVATARS_DIR, PHOTOS_DIR

loved_ones_bp = Blueprint("loved_ones", __name__, url_prefix="/api/loved-ones")

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

@loved_ones_bp.route("", methods=["GET"])
@require_auth
def list_loved_ones():
    """List all loved ones created by current user"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            l.*,
            (SELECT COUNT(*) FROM audio_recordings a WHERE a.loved_one_id = l.id) as audio_count,
            (SELECT COUNT(*) FROM stories s WHERE s.loved_one_id = l.id) as story_count,
            (SELECT COUNT(*) FROM vault_items v WHERE v.loved_one_id = l.id) as vault_count,
            (SELECT COUNT(*) FROM ofrenda_offerings o WHERE o.loved_one_id = l.id) as offering_count,
            (SELECT COUNT(*) FROM ofrenda_candles c WHERE c.loved_one_id = l.id AND c.is_lit = 1) as lit_candle_count
        FROM loved_ones l
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC
    """, (request.user_id,))
    
    rows = cursor.fetchall()
    results = []
    for r in rows:
        item = dict(r)
        if item.get("favorite_things"):
            try:
                item["favorite_things"] = json.loads(item["favorite_things"])
            except Exception:
                item["favorite_things"] = {}
        results.append(item)
        
    conn.close()
    return jsonify({"loved_ones": results})

@loved_ones_bp.route("", methods=["POST"])
@require_auth
def create_loved_one():
    """Create a new loved one memorial profile"""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    relationship = data.get("relationship", "").strip()

    if not name:
        return jsonify({"error": "Name is required."}), 400
    if not relationship:
        return jsonify({"error": "Relationship is required."}), 400

    favorite_things = data.get("favorite_things")
    if isinstance(favorite_things, dict):
        fav_json = json.dumps(favorite_things)
    else:
        fav_json = json.dumps({"foods": [], "music": [], "passions": []})

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO loved_ones (
            user_id, name, relationship, birth_date, passing_date, resting_place,
            avatar_url, cover_url, epitaph, bio, favorite_things
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        request.user_id,
        name,
        relationship,
        data.get("birth_date") or None,
        data.get("passing_date") or None,
        data.get("resting_place") or None,
        data.get("avatar_url") or None,
        data.get("cover_url") or None,
        data.get("epitaph") or None,
        data.get("bio") or None,
        fav_json
    ))
    new_id = cursor.lastrowid
    
    # Automatically add a starter candle and marigold offering
    cursor.execute("""
        INSERT INTO ofrenda_candles (loved_one_id, lit_by, message, candle_type, is_lit)
        VALUES (?, ?, ?, 'cempasuchil_gold', 1)
    """, (new_id, request.username, f"A flame lit in eternal remembrance of {name}."))
    
    cursor.execute("""
        INSERT INTO ofrenda_offerings (loved_one_id, title, item_type, icon_name, tier, dedication_note, placed_by)
        VALUES (?, 'Sacred Cempasúchil Blooms', 'marigold', 'flower', 1, 'May these golden petals guide your path home.', ?)
    """, (new_id, request.username))
    
    conn.commit()
    
    cursor.execute("SELECT * FROM loved_ones WHERE id = ?", (new_id,))
    created = dict(cursor.fetchone())
    conn.close()

    if created.get("favorite_things"):
        try:
            created["favorite_things"] = json.loads(created["favorite_things"])
        except Exception:
            pass

    return jsonify({"message": "Memorial profile created successfully.", "loved_one": created}), 201

@loved_ones_bp.route("/<int:id>", methods=["GET"])
@require_auth
def get_loved_one(id):
    """Get single loved one profile details"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            l.*,
            (SELECT COUNT(*) FROM audio_recordings a WHERE a.loved_one_id = l.id) as audio_count,
            (SELECT COUNT(*) FROM stories s WHERE s.loved_one_id = l.id) as story_count,
            (SELECT COUNT(*) FROM vault_items v WHERE v.loved_one_id = l.id) as vault_count,
            (SELECT COUNT(*) FROM ofrenda_offerings o WHERE o.loved_one_id = l.id) as offering_count,
            (SELECT COUNT(*) FROM ofrenda_candles c WHERE c.loved_one_id = l.id AND c.is_lit = 1) as lit_candle_count
        FROM loved_ones l
        WHERE l.id = ? AND l.user_id = ?
    """, (id, request.user_id))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return jsonify({"error": "Profile not found or access denied."}), 404
        
    item = dict(row)
    if item.get("favorite_things"):
        try:
            item["favorite_things"] = json.loads(item["favorite_things"])
        except Exception:
            pass
            
    return jsonify({"loved_one": item})

@loved_ones_bp.route("/<int:id>", methods=["PUT"])
@require_auth
def update_loved_one(id):
    """Update profile information"""
    data = request.get_json() or {}
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    fav_json = None
    if "favorite_things" in data:
        fav_json = json.dumps(data["favorite_things"]) if isinstance(data["favorite_things"], dict) else data["favorite_things"]

    cursor.execute("""
        UPDATE loved_ones
        SET name = COALESCE(?, name),
            relationship = COALESCE(?, relationship),
            birth_date = COALESCE(?, birth_date),
            passing_date = COALESCE(?, passing_date),
            resting_place = COALESCE(?, resting_place),
            avatar_url = COALESCE(?, avatar_url),
            cover_url = COALESCE(?, cover_url),
            epitaph = COALESCE(?, epitaph),
            bio = COALESCE(?, bio),
            favorite_things = COALESCE(?, favorite_things)
        WHERE id = ?
    """, (
        data.get("name"),
        data.get("relationship"),
        data.get("birth_date"),
        data.get("passing_date"),
        data.get("resting_place"),
        data.get("avatar_url"),
        data.get("cover_url"),
        data.get("epitaph"),
        data.get("bio"),
        fav_json,
        id
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Profile updated successfully."})

@loved_ones_bp.route("/<int:id>", methods=["DELETE"])
@require_auth
def delete_loved_one(id):
    """Delete a profile and all its associated memories"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM loved_ones WHERE id = ? AND user_id = ?", (id, request.user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected == 0:
        return jsonify({"error": "Profile not found or access denied."}), 404

    return jsonify({"message": "Memorial sanctuary deleted."})

@loved_ones_bp.route("/<int:id>/upload-photo", methods=["POST"])
@require_auth
def upload_profile_photo(id):
    """Upload avatar or cover photo for a loved one"""
    if "photo" not in request.files:
        return jsonify({"error": "No photo file provided."}), 400
        
    file = request.files["photo"]
    photo_type = request.form.get("type", "avatar") # 'avatar' or 'cover'
    
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400
        
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit(".", 1)[1].lower()
        unique_name = f"{photo_type}_{id}_{uuid.uuid4().hex[:8]}.{ext}"
        save_path = os.path.join(AVATARS_DIR, unique_name)
        file.save(save_path)
        
        url_path = f"/api/uploads/avatars/{unique_name}"
        
        conn = get_db()
        cursor = conn.cursor()
        if photo_type == "cover":
            cursor.execute("UPDATE loved_ones SET cover_url = ? WHERE id = ? AND user_id = ?", (url_path, id, request.user_id))
        else:
            cursor.execute("UPDATE loved_ones SET avatar_url = ? WHERE id = ? AND user_id = ?", (url_path, id, request.user_id))
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Photo uploaded successfully.", "url": url_path})
        
    return jsonify({"error": "File extension not allowed."}), 400
