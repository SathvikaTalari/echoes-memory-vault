import os
import uuid
import json
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from routes.auth import require_auth
from database import get_db
from config import PHOTOS_DIR

vault_bp = Blueprint("vault", __name__, url_prefix="/api")

ALLOWED_PHOTO_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

def allowed_photo(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_PHOTO_EXTENSIONS

@vault_bp.route("/loved-ones/<int:loved_one_id>/vault", methods=["GET"])
@require_auth
def list_vault_items(loved_one_id):
    """List all memory vault items for a loved one with search & category filters"""
    category = request.args.get("category")
    item_type = request.args.get("type")
    search_query = request.args.get("q", "").strip().lower()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    sql = "SELECT * FROM vault_items WHERE loved_one_id = ?"
    params = [loved_one_id]

    if category and category != "all":
        sql += " AND category = ?"
        params.append(category)

    if item_type and item_type != "all":
        sql += " AND type = ?"
        params.append(item_type)

    if search_query:
        sql += " AND (lower(title) LIKE ? OR lower(description) LIKE ? OR lower(location) LIKE ?)"
        params.extend([f"%{search_query}%", f"%{search_query}%", f"%{search_query}%"])

    sql += " ORDER BY is_highlight DESC, memory_date DESC, created_at DESC"
    cursor.execute(sql, params)
    
    rows = cursor.fetchall()
    results = []
    for r in rows:
        item = dict(r)
        if item.get("people_tagged"):
            try:
                item["people_tagged"] = json.loads(item["people_tagged"])
            except Exception:
                item["people_tagged"] = []
        results.append(item)

    conn.close()
    return jsonify({"vault_items": results})

@vault_bp.route("/loved-ones/<int:loved_one_id>/vault", methods=["POST"])
@require_auth
def create_vault_item(loved_one_id):
    """Add a new memory, milestone, photograph entry, or quote to the vault"""
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    item_type = data.get("type", "photo") # 'photo', 'milestone', 'quote', 'artifact', 'story'

    if not title:
        return jsonify({"error": "Title is required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    people_tagged = data.get("people_tagged")
    people_json = json.dumps(people_tagged) if isinstance(people_tagged, list) else json.dumps([])

    cursor.execute("""
        INSERT INTO vault_items (
            loved_one_id, type, title, description, media_url,
            memory_date, location, people_tagged, category, is_highlight
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        loved_one_id,
        item_type,
        title,
        data.get("description", ""),
        data.get("media_url"),
        data.get("memory_date"),
        data.get("location"),
        people_json,
        data.get("category", "Family"),
        1 if data.get("is_highlight") else 0
    ))
    new_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM vault_items WHERE id = ?", (new_id,))
    created = dict(cursor.fetchone())
    conn.close()

    if created.get("people_tagged"):
        try:
            created["people_tagged"] = json.loads(created["people_tagged"])
        except Exception:
            created["people_tagged"] = []

    return jsonify({"message": "Memory preserved in vault.", "vault_item": created}), 201

@vault_bp.route("/loved-ones/<int:loved_one_id>/vault/upload", methods=["POST"])
@require_auth
def upload_vault_photo(loved_one_id):
    """Upload a photograph file for a vault entry"""
    if "photo" not in request.files:
        return jsonify({"error": "No photograph provided."}), 400

    file = request.files["photo"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    if not allowed_photo(file.filename):
        return jsonify({"error": "File format not supported. Please upload PNG, JPG, WEBP, or GIF."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404
    conn.close()

    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_filename = f"vault_{loved_one_id}_{uuid.uuid4().hex[:10]}.{ext}"
    save_path = os.path.join(PHOTOS_DIR, unique_filename)
    file.save(save_path)

    media_url = f"/api/uploads/photos/{unique_filename}"
    return jsonify({"message": "Photograph uploaded successfully.", "media_url": media_url})

@vault_bp.route("/vault/<int:item_id>", methods=["DELETE"])
@require_auth
def delete_vault_item(item_id):
    """Delete an item from the vault"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM vault_items
        WHERE id = ? AND loved_one_id IN (SELECT id FROM loved_ones WHERE user_id = ?)
    """, (item_id, request.user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected == 0:
        return jsonify({"error": "Item not found or access denied."}), 404

    return jsonify({"message": "Memory item removed from vault."})

@vault_bp.route("/loved-ones/<int:loved_one_id>/export", methods=["GET"])
@require_auth
def export_memory_book(loved_one_id):
    """
    Export complete memory book as structured Markdown / Heirloom family archive document.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    profile = cursor.fetchone()
    if not profile:
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    profile_dict = dict(profile)
    
    # Fetch stories
    cursor.execute("SELECT * FROM stories WHERE loved_one_id = ? ORDER BY is_favorite DESC, created_at ASC", (loved_one_id,))
    stories = [dict(s) for s in cursor.fetchall()]

    # Fetch vault items
    cursor.execute("SELECT * FROM vault_items WHERE loved_one_id = ? ORDER BY memory_date ASC, created_at ASC", (loved_one_id,))
    vault_items = [dict(v) for v in cursor.fetchall()]

    # Fetch audio recordings
    cursor.execute("SELECT * FROM audio_recordings WHERE loved_one_id = ? ORDER BY recorded_date ASC", (loved_one_id,))
    audio_records = [dict(a) for a in cursor.fetchall()]

    # Fetch candles & messages
    cursor.execute("SELECT * FROM ofrenda_candles WHERE loved_one_id = ? ORDER BY lit_at DESC", (loved_one_id,))
    candles = [dict(c) for c in cursor.fetchall()]

    conn.close()

    # Generate Markdown Memory Book
    md = f"""# ECHOES: THE HEIRLOOM MEMORY BOOK
## Dedicated to the Eternal Life & Wisdom of {profile_dict['name']}

**Relationship:** {profile_dict['relationship']}  
**Lifespan:** {profile_dict['birth_date'] or 'Unknown'} — {profile_dict['passing_date'] or 'Present'}  
**Resting Place / Hometown:** {profile_dict['resting_place'] or 'Cherished in our hearts'}  

> *"{profile_dict['epitaph'] or 'Whose memories never die.'}"*

---

### I. Biographical Portrait
{profile_dict['bio'] or 'No biographical introduction recorded yet.'}

---

### II. Cherished Stories & Life Lessons
"""
    for idx, story in enumerate(stories, 1):
        md += f"""
#### Chapter {idx}: {story['title']}
*Era: {story['era_timeframe'] or 'Timeless'} | Location: {story['location'] or 'Family Hearth'} | Style: {story['story_style']}*

{story['narrative']}

**Core Wisdom Preserved:**  
> "{story['key_wisdom'] or 'A truth to carry forward.'}"

---
"""

    md += """
### III. Timeline Milestones & Photographs
"""
    for v in vault_items:
        md += f"- **[{v['type'].upper()}] {v['title']}** ({v['memory_date'] or 'Undated'})  \n"
        md += f"  *{v['category']} | {v['location'] or 'Archives'}*  \n"
        if v['description']:
            md += f"  {v['description']}  \n"

    md += """
---

### IV. Spoken Voice Transcripts
"""
    for a in audio_records:
        md += f"#### Voice Recording: {a['title']} ({a['recorded_date'] or 'Audio Tape'})\n"
        md += f"\"{a['transcript_raw'] or 'Raw audio archived.'}\"\n\n"

    md += """
---

### V. Whispers of Remembrance (Candle Prayers)
"""
    for c in candles:
        md += f"- *\"{c['message'] or 'In loving memory'}\"* — Lit by **{c['lit_by']}** on {c['lit_at']}\n"

    md += "\n\n*Preserved with reverence on Echoes – Memories Never Die.*"

    return jsonify({
        "loved_one_name": profile_dict["name"],
        "markdown_content": md,
        "raw_data": {
            "profile": profile_dict,
            "stories": stories,
            "vault_items": vault_items,
            "audio_recordings": audio_records,
            "candles": candles
        }
    })
