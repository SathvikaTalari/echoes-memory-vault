import requests
import json
import logging
import re
from config import Config

logger = logging.getLogger("echoes.ollama")

ETHICAL_SYSTEM_PROMPT = """You are Echoes Storyteller, a compassionate archival biographer and family chronicler.
Your sacred role is to honor and preserve genuine human memories, words, and wisdom for future generations.

STRICT ETHICAL & FACTUAL RULES:
1. NEVER impersonate, pretend to be, or simulate the persona/voice of deceased individuals. Never write in first person pretending to be the departed ("I am looking down from heaven...", "I miss you..."). Always write as an empathetic biographer, historian, or family keeper ("Elena often recounted...", "As recorded in the 1956 tapes...").
2. NEVER fabricate false memories, fictional events, or unverified claims. Treat their authentic spoken words and recollections with absolute fidelity and dignity.
3. Your goal is to shape raw, rambling, or colloquial spoken transcripts into eloquent, readable, lasting literary memoirs while preserving their authentic voice, exact memorable quotes, humor, and emotional truth.
"""

QA_ETHICAL_SYSTEM_PROMPT = """You are the Echoes Memory Archivist, a factual and deeply respectful keeper of personal family histories.
You answer questions about the loved one SOLELY and STRICTLY from the verified memory records provided below.

STRICT RULES:
1. FACTUAL GROUNDING: Rely ONLY on the information present in the supplied memory vault records. Do NOT invent dates, names, events, or opinions.
2. UNKNOWN DETAILS: If the provided records do not contain the answer, you MUST state gently and clearly: "That particular memory has not been recorded yet in [Name]'s vault." Never guess or fabricate answers.
3. NO ROLEPLAY: Never roleplay as the deceased. You are an archivist presenting their genuine life story.
4. CITATION: Always cite the title and era/date of the memories where you found the information.
"""

def check_ollama_health():
    """
    Check if local Ollama daemon is reachable and inspect loaded models.
    """
    ollama_url = getattr(Config, "OLLAMA_URL", "http://localhost:11434")
    model_name = getattr(Config, "OLLAMA_MODEL", "qwen2.5:3b-instruct")
    
    try:
        resp = requests.get(f"{ollama_url}/api/tags", timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            models = [m.get("name", "") for m in data.get("models", [])]
            
            # Check if desired model or any qwen model is present
            has_target = any(model_name in m or "qwen" in m.lower() for m in models)
            
            return {
                "available": True,
                "url": ollama_url,
                "target_model": model_name,
                "has_target_model": has_target,
                "installed_models": models,
                "message": f"Ollama is running with {len(models)} model(s) available."
            }
        else:
            return {
                "available": False,
                "url": ollama_url,
                "target_model": model_name,
                "has_target_model": False,
                "installed_models": [],
                "message": f"Ollama returned status code {resp.status_code}."
            }
    except Exception as e:
        return {
            "available": False,
            "url": ollama_url,
            "target_model": model_name,
            "has_target_model": False,
            "installed_models": [],
            "message": f"Ollama is offline or unreachable at {ollama_url}. To enable live local inference, run 'ollama run {model_name}'."
        }

def call_ollama_generate(prompt, system_prompt=ETHICAL_SYSTEM_PROMPT, temperature=0.6):
    """
    Invoke Ollama local generate API.
    """
    ollama_url = getattr(Config, "OLLAMA_URL", "http://localhost:11434")
    model_name = getattr(Config, "OLLAMA_MODEL", "qwen2.5:3b-instruct")
    
    payload = {
        "model": model_name,
        "prompt": prompt,
        "system": system_prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "top_p": 0.9,
            "num_predict": 1200
        }
    }
    
    try:
        resp = requests.post(f"{ollama_url}/api/generate", json=payload, timeout=60.0)
        if resp.status_code == 200:
            result = resp.json()
            return {
                "success": True,
                "response": result.get("response", "").strip(),
                "model_used": model_name,
                "is_simulation": False
            }
        else:
            logger.warning(f"Ollama returned error status: {resp.status_code}")
            return {"success": False, "error": f"Ollama error: HTTP {resp.status_code}"}
    except Exception as e:
        logger.warning(f"Ollama call failed: {e}")
        return {"success": False, "error": str(e)}

def generate_story_from_transcript(loved_one_name, transcript, style="Intimate Family Chronicle", context_notes=""):
    """
    Transform raw audio transcript into a structured, moving story chapter.
    """
    style_guidelines = {
        "Classic Biographer": "Write in an elegant, literary narrative tone. Focus on historical context, setting the scene with vivid sensory description, and weaving in direct quotations with great reverence.",
        "Intimate Family Chronicle": "Write with deep warmth, heart, and familial intimacy—as if speaking around an evening hearth or recording words into a leather-bound heirloom album for grandchildren.",
        "Life Lesson & Wisdom": "Focus on the core philosophy, virtues, challenges overcome, and the lasting advice or moral lessons embedded within the memory.",
        "Poetic Vignette": "A lyrical, poignant piece focusing intensely on the atmosphere, fleeting sensations, colors, and the sacred beauty of a single fleeting moment."
    }
    
    chosen_guideline = style_guidelines.get(style, style_guidelines["Intimate Family Chronicle"])
    
    prompt = f"""Task: Transform the following spoken memory transcript of {loved_one_name} into a beautifully structured story chapter for their digital memory vault.

Style Selected: {style}
Style Guidelines: {chosen_guideline}

Loved One Name: {loved_one_name}
Context / Background Notes: {context_notes if context_notes else 'None provided'}

Spoken Transcript:
\"\"\"{transcript}\"\"\"

Please respond in valid JSON format with the following keys:
{{
  "title": "A evocative, poetic title for this story chapter",
  "narrative": "The full polished narrative (multi-paragraph, using \\n\\n between paragraphs)",
  "era_timeframe": "Estimated era or season (e.g. 'Autumn 1956, Early Youth')",
  "location": "Setting or location mentioned in the memory",
  "key_wisdom": "A 1-2 sentence core insight, lesson, or lasting quote from this story",
  "emotional_tone": "The primary emotional atmosphere (e.g. 'Warmly Nostalgic & Triumphant')",
  "tags": ["Array", "of", "4-6", "relevant", "tags"]
}}
Only output the JSON object without markdown fences or extraneous text.
"""
    
    ollama_result = call_ollama_generate(prompt, system_prompt=ETHICAL_SYSTEM_PROMPT, temperature=0.7)
    
    if ollama_result.get("success"):
        raw_text = ollama_result.get("response", "")
        # Attempt to parse JSON
        parsed = extract_json_from_text(raw_text)
        if parsed and "title" in parsed and "narrative" in parsed:
            parsed["model_used"] = ollama_result.get("model_used")
            parsed["is_simulation"] = False
            return parsed
        else:
            # If JSON parsing was imperfect, clean up narrative
            return {
                "title": f"Memories of {loved_one_name}",
                "narrative": raw_text,
                "era_timeframe": "Preserved Memory",
                "location": "Family Archives",
                "key_wisdom": "Memories cherished are never lost to time.",
                "emotional_tone": "Reflective & Sacred",
                "tags": ["Memoir", "Voice Archives", "Echoes"],
                "model_used": ollama_result.get("model_used"),
                "is_simulation": False
            }
            
    # Fallback simulation if Ollama is offline
    return generate_fallback_story(loved_one_name, transcript, style, context_notes)

def answer_memory_qa(loved_one_name, question, memory_chunks):
    """
    Answer a user question based strictly on retrieved memories.
    """
    if not memory_chunks:
        return {
            "answer": f"I searched the preserved memory vault for {loved_one_name}, but there are currently no recorded stories, transcripts, or milestones that mention this. Would you like to record an audio memory or write a story about this?",
            "cited_sources": [],
            "model_used": "System",
            "is_simulation": False
        }
        
    context_str = ""
    for idx, chunk in enumerate(memory_chunks, 1):
        context_str += f"\n--- Memory Record #{idx}: {chunk.get('title')} ({chunk.get('date', 'Date unspecified')}) ---\n"
        context_str += f"Type: {chunk.get('type')}\n"
        if chunk.get('location'):
            context_str += f"Location: {chunk.get('location')}\n"
        context_str += f"Content: {chunk.get('content')}\n"
        
    prompt = f"""You are answering a question from a family member about {loved_one_name}.

Question: "{question}"

Verified Memory Records from {loved_one_name}'s Vault:
{context_str}

Please answer the question accurately and warmly, relying EXCLUSIVELY on the facts in the records above.
- If the records do not contain the answer, explicitly state that this memory has not been recorded yet.
- Mention which specific memories or dates you referenced.
- Keep your tone respectful, factual, and comforting.
"""
    
    ollama_result = call_ollama_generate(prompt, system_prompt=QA_ETHICAL_SYSTEM_PROMPT, temperature=0.3)
    
    if ollama_result.get("success"):
        return {
            "answer": ollama_result.get("response"),
            "cited_sources": [{"title": c.get("title"), "date": c.get("date"), "type": c.get("type")} for c in memory_chunks],
            "model_used": ollama_result.get("model_used"),
            "is_simulation": False
        }
        
    # Fallback QA generator if Ollama is not currently online
    return generate_fallback_qa(loved_one_name, question, memory_chunks)

def extract_json_from_text(text):
    """Extract JSON object from text that might contain code blocks or markdown"""
    try:
        # Check if direct JSON
        return json.loads(text.strip())
    except Exception:
        pass
        
    # Search for { ... }
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return None

def generate_fallback_story(loved_one_name, transcript, style, context_notes):
    """
    High quality local fallback story weaver when Ollama is not running.
    Gives user an authentic demonstration immediately.
    """
    clean_lines = [line.strip() for line in transcript.split(".") if len(line.strip()) > 5]
    first_thought = clean_lines[0] if clean_lines else "the moments we held closest"
    
    title = f"The Keepsake Hours: {loved_one_name}'s Recollections"
    if "rain" in transcript.lower() or "plaza" in transcript.lower():
        title = "Under the Plaza Rain: A Memory of Joy"
    elif "kitchen" in transcript.lower() or "recipe" in transcript.lower():
        title = "The Warmth of the Hearth: Culinary Heirlooms"
    elif "garden" in transcript.lower() or "flower" in transcript.lower():
        title = "Where the Marigolds Bloom: Garden Days"

    narrative = f"""Listening to the recorded voice of {loved_one_name}, one is immediately struck by the gentle cadence with which the past is summoned into the room.

"{transcript.strip()}"

These spoken words carry more than simple recollections; they carry the atmosphere of a lived life, where ordinary hours were rendered sacred by presence and devotion. As recorded in the family archives, {loved_one_name} spoke with that rare combination of humility and deep perspective that time alone bestows upon a generous spirit.

Each detail preserved here stands as a testament to what remained steadfast through seasons of change—a reminder that a person's truest legacy is not found in grand monuments, but in the echoes of their kindness and the stories they chose to pass down to those they loved."""

    return {
        "title": title,
        "narrative": narrative,
        "era_timeframe": "Family Archive Recording",
        "location": "Recorded Hearth",
        "key_wisdom": "A person's truest legacy is found in the echoes of their kindness.",
        "emotional_tone": "Warmly Reverent & Heartfelt",
        "tags": ["Voice Archives", "Echoes", "Family Chronicle", "Wisdom"],
        "model_used": "Qwen2.5-3B-Instruct (Fallback Synthesizer - Start Ollama for Live Model Inference)",
        "is_simulation": True
    }

def generate_fallback_qa(loved_one_name, question, memory_chunks):
    """
    Intelligent extractive fallback Q&A matching keywords when Ollama is offline.
    """
    # Look for keyword hits
    q_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', question.lower()))
    best_chunk = None
    best_overlap = 0
    
    for chunk in memory_chunks:
        c_text = (chunk.get("title", "") + " " + chunk.get("content", "")).lower()
        c_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', c_text))
        overlap = len(q_words.intersection(c_words))
        if overlap > best_overlap:
            best_overlap = overlap
            best_chunk = chunk
            
    if best_chunk and best_overlap > 0:
        ans = f"Based on the preserved records in {loved_one_name}'s vault, specifically from \"{best_chunk.get('title')}\" ({best_chunk.get('date', 'unspecified date')}):\n\n"
        ans += f"{best_chunk.get('content')}\n\n"
        ans += f"(Note: Local Ollama daemon is currently offline. Connect Ollama with 'ollama run qwen2.5:3b-instruct' for live neural response synthesis.)"
        return {
            "answer": ans,
            "cited_sources": [{"title": best_chunk.get("title"), "date": best_chunk.get("date"), "type": best_chunk.get("type")}],
            "model_used": "Local Memory Retriever (Ollama Offline Mode)",
            "is_simulation": True
        }
    else:
        return {
            "answer": f"According to {loved_one_name}'s preserved memory records, there is no documented mention of that topic yet. The vault currently holds memories about: " + ", ".join([f'"{c.get("title")}"' for c in memory_chunks[:3]]) + f". Would you like to record or add a new memory about \"{question}\"?",
            "cited_sources": [],
            "model_used": "Local Memory Retriever",
            "is_simulation": True
        }
