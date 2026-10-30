import json
from flask import Blueprint, request, jsonify
from routes.auth import require_auth
from database import get_db
from services.rag_service import retrieve_relevant_memories
from services.ollama_service import answer_memory_qa

qa_bp = Blueprint("qa", __name__, url_prefix="/api")

SUGGESTED_QUESTIONS = [
    "What was their happiest recorded memory?",
    "How did they meet their spouse or partner?",
    "What core advice did they give about handling difficult times?",
    "Tell me about their favorite meals or kitchen traditions.",
    "What did they say about their childhood or where they grew up?",
    "What passions and hobbies brought them the most peace?"
]

@qa_bp.route("/loved-ones/<int:loved_one_id>/ask", methods=["POST"])
@require_auth
def ask_memories(loved_one_id):
    """
    Ask a question retrieved strictly from preserved memories without hallucination.
    """
    data = request.get_json() or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Please provide a question to ask the memory vault."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, relationship FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    profile = cursor.fetchone()
    if not profile:
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    # 1. Retrieve factual memory chunks
    chunks = retrieve_relevant_memories(loved_one_id, question, top_k=5)

    # 2. Query Qwen2.5-3B-Instruct via Ollama with strict factual guardrails
    qa_result = answer_memory_qa(
        loved_one_name=profile["name"],
        question=question,
        memory_chunks=chunks
    )

    answer_text = qa_result.get("answer", "")
    cited_sources = qa_result.get("cited_sources", [])

    # 3. Log query to history
    cursor.execute("""
        INSERT INTO qa_logs (loved_one_id, question, answer, cited_sources)
        VALUES (?, ?, ?, ?)
    """, (
        loved_one_id,
        question,
        answer_text,
        json.dumps(cited_sources)
    ))
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "question": question,
        "answer": answer_text,
        "cited_sources": cited_sources,
        "model_used": qa_result.get("model_used"),
        "is_simulation": qa_result.get("is_simulation", False),
        "log_id": log_id,
        "suggested_questions": SUGGESTED_QUESTIONS
    })

@qa_bp.route("/loved-ones/<int:loved_one_id>/ask/history", methods=["GET"])
@require_auth
def get_qa_history(loved_one_id):
    """Retrieve previous questions asked to the memory vault"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM loved_ones WHERE id = ? AND user_id = ?", (loved_one_id, request.user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Profile not found or access denied."}), 404

    cursor.execute("""
        SELECT * FROM qa_logs 
        WHERE loved_one_id = ?
        ORDER BY created_at DESC
        LIMIT 30
    """, (loved_one_id,))
    
    rows = cursor.fetchall()
    history = []
    for r in rows:
        item = dict(r)
        if item.get("cited_sources"):
            try:
                item["cited_sources"] = json.loads(item["cited_sources"])
            except Exception:
                item["cited_sources"] = []
        history.append(item)

    conn.close()
    return jsonify({
        "history": history,
        "suggested_questions": SUGGESTED_QUESTIONS
    })
