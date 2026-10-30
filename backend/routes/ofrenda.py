from flask import Blueprint, request, jsonify
from routes.auth import require_auth
from database import get_db

ofrenda_bp = Blueprint("ofrenda", __name__, url_prefix="/api")

@ofrenda_bp.route("/loved-ones/<int:loved_one_id>/ofrenda", methods=["GET"])
@require_auth
def get_ofrenda(loved_one_id):
    """
    Get the complete altar state: portrait, offerings grouped by tier, and lit candles.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    profile = cursor.fetchone()
    if not profile:
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    profile_dict = dict(profile)

    # Fetch offerings
    cursor.execute("""
        SELECT * FROM ofrenda_offerings 
        WHERE loved_one_id = ?
        ORDER BY tier ASC, created_at DESC
    """, (loved_one_id,))
    offerings = [dict(r) for r in cursor.fetchall()]

    # Group offerings by tier
    tiers = {1: [], 2: [], 3: []}
    for item in offerings:
        tier_num = item.get("tier", 2)
        if tier_num not in tiers:
            tier_num = 2
        tiers[tier_num].append(item)

    # Fetch candles
    cursor.execute("""
        SELECT * FROM ofrenda_candles 
        WHERE loved_one_id = ?
        ORDER BY is_lit DESC, lit_at DESC
    """, (loved_one_id,))
    candles = [dict(c) for c in cursor.fetchall()]

    active_candles_count = sum(1 for c in candles if c.get("is_lit") == 1)

    conn.close()
    return jsonify({
        "loved_one": profile_dict,
        "offerings_by_tier": tiers,
        "offerings_total": len(offerings),
        "candles": candles,
        "active_candles_count": active_candles_count
    })

@ofrenda_bp.route("/loved-ones/<int:loved_one_id>/ofrenda/offerings", methods=["POST"])
@require_auth
def add_offering(loved_one_id):
    """Place an offering on the virtual altar"""
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    item_type = data.get("item_type", "food") # 'marigold', 'pan_de_muerto', 'food', 'beverage', 'keepsake', 'calavera', 'music', 'photo'
    tier = int(data.get("tier", 2))
    dedication_note = data.get("dedication_note", "")
    placed_by = data.get("placed_by", "").strip() or request.username

    if not title:
        return jsonify({"error": "Offering title is required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    icon_mapping = {
        "marigold": "flower",
        "pan_de_muerto": "bread",
        "food": "utensils",
        "beverage": "coffee",
        "keepsake": "heart",
        "calavera": "smile",
        "music": "music",
        "photo": "image"
    }
    icon_name = data.get("icon_name") or icon_mapping.get(item_type, "sparkles")

    cursor.execute("""
        INSERT INTO ofrenda_offerings (
            loved_one_id, title, item_type, icon_name, custom_image_url,
            tier, dedication_note, placed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        loved_one_id,
        title,
        item_type,
        icon_name,
        data.get("custom_image_url"),
        tier,
        dedication_note,
        placed_by
    ))
    new_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM ofrenda_offerings WHERE id = ?", (new_id,))
    created = dict(cursor.fetchone())
    conn.close()

    return jsonify({"message": f"Offering '{title}' placed upon the altar.", "offering": created}), 201

@ofrenda_bp.route("/ofrenda/offerings/<int:offering_id>", methods=["DELETE"])
@require_auth
def remove_offering(offering_id):
    """Remove an offering from the altar"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM ofrenda_offerings
        WHERE id = ? AND loved_one_id IN (SELECT id FROM loved_ones WHERE user_id = ?)
    """, (offering_id, request.user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected == 0:
        return jsonify({"error": "Offering not found or access denied."}), 404

    return jsonify({"message": "Offering removed from altar."})

@ofrenda_bp.route("/loved-ones/<int:loved_one_id>/ofrenda/candles", methods=["POST"])
@require_auth
def light_candle(loved_one_id):
    """Light a new memorial candle with prayer or remembrance message"""
    data = request.get_json() or {}
    lit_by = data.get("lit_by", "").strip() or request.username
    message = data.get("message", "").strip()
    candle_type = data.get("candle_type", "cempasuchil_gold")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    profile = cursor.fetchone()
    if not profile:
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    cursor.execute("""
        INSERT INTO ofrenda_candles (loved_one_id, lit_by, message, candle_type, is_lit)
        VALUES (?, ?, ?, ?, 1)
    """, (loved_one_id, lit_by, message or None, candle_type))
    new_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM ofrenda_candles WHERE id = ?", (new_id,))
    candle = dict(cursor.fetchone())
    conn.close()

    return jsonify({"message": f"A candle has been lit in remembrance of {profile['name']}.", "candle": candle}), 201

@ofrenda_bp.route("/ofrenda/candles/<int:candle_id>/toggle", methods=["PUT"])
@require_auth
def toggle_candle(candle_id):
    """Toggle candle flame (light or extinguish)"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.* FROM ofrenda_candles c
        JOIN loved_ones l ON c.loved_one_id = l.id
        WHERE c.id = ? AND l.user_id = ?
    """, (candle_id, request.user_id))
    candle = cursor.fetchone()
    if not candle:
        conn.close()
        return jsonify({"error": "Candle not found or access denied."}), 404

    new_state = 0 if candle["is_lit"] == 1 else 1
    cursor.execute("UPDATE ofrenda_candles SET is_lit = ? WHERE id = ?", (new_state, candle_id))
    conn.commit()
    conn.close()

    status_str = "lit" if new_state == 1 else "extinguished"
    return jsonify({"message": f"Candle {status_str}.", "is_lit": new_state})
