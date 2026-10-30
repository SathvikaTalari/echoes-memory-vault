import sqlite3
import json
import re
import math
from database import get_db

def tokenize(text):
    if not text:
        return []
    return re.findall(r'\b[a-zA-Z0-9]{3,}\b', text.lower())

def retrieve_relevant_memories(loved_one_id, query, top_k=5):
    """
    Retrieves the most relevant memory records for a loved one.
    Searches across:
    1. Audio recording transcripts
    2. Stories (narratives, wisdom, tags)
    3. Vault items (photos, milestones, quotes)
    4. Loved one profile bio and favorite things
    """
    conn = get_db()
    cursor = conn.cursor()
    
    chunks = []
    
    # 1. Fetch Profile Bio & Favorites
    cursor.execute("SELECT name, relationship, bio, favorite_things, resting_place, epitaph FROM loved_ones WHERE id = ?", (loved_one_id,))
    profile = cursor.fetchone()
    if profile:
        fav_str = ""
        if profile["favorite_things"]:
            try:
                favs = json.loads(profile["favorite_things"])
                fav_parts = []
                for k, v in favs.items():
                    if isinstance(v, list):
                        fav_parts.append(f"{k}: {', '.join(v)}")
                    else:
                        fav_parts.append(f"{k}: {v}")
                fav_str = "; ".join(fav_parts)
            except Exception:
                pass
                
        chunks.append({
            "id": f"profile_{loved_one_id}",
            "type": "Profile Biography",
            "title": f"Life Overview of {profile['name']}",
            "date": "Biographical Record",
            "location": profile["resting_place"] or "",
            "content": f"{profile['bio'] or ''} Epitaph: {profile['epitaph'] or ''} Cherished preferences: {fav_str}".strip()
        })
        
    # 2. Fetch Audio Recordings
    cursor.execute("""
        SELECT id, title, transcript_raw, recorded_date, notes
        FROM audio_recordings
        WHERE loved_one_id = ? AND transcript_raw IS NOT NULL AND length(transcript_raw) > 5
    """, (loved_one_id,))
    for row in cursor.fetchall():
        chunks.append({
            "id": f"audio_{row['id']}",
            "type": "Voice Transcript",
            "title": row["title"],
            "date": row["recorded_date"] or "Audio Archive",
            "location": "",
            "content": f"{row['transcript_raw']}. Notes: {row['notes'] or ''}".strip()
        })
        
    # 3. Fetch Stories
    cursor.execute("""
        SELECT id, title, narrative, era_timeframe, location, key_wisdom, emotional_tone, tags
        FROM stories
        WHERE loved_one_id = ?
    """, (loved_one_id,))
    for row in cursor.fetchall():
        tags_str = ""
        if row["tags"]:
            try:
                tags_list = json.loads(row["tags"])
                tags_str = f"Tags: {', '.join(tags_list)}"
            except Exception:
                pass
                
        content = f"{row['narrative']}\nKey Wisdom: {row['key_wisdom'] or ''}\n{tags_str}".strip()
        chunks.append({
            "id": f"story_{row['id']}",
            "type": "Story Chapter",
            "title": row["title"],
            "date": row["era_timeframe"] or "Historical Story",
            "location": row["location"] or "",
            "content": content
        })
        
    # 4. Fetch Vault Items
    cursor.execute("""
        SELECT id, type, title, description, memory_date, location, people_tagged, category
        FROM vault_items
        WHERE loved_one_id = ?
    """, (loved_one_id,))
    for row in cursor.fetchall():
        people_str = ""
        if row["people_tagged"]:
            try:
                p_list = json.loads(row["people_tagged"])
                people_str = f"People involved: {', '.join(p_list)}"
            except Exception:
                pass
                
        content = f"{row['description'] or ''} {people_str} Category: {row['category']}".strip()
        chunks.append({
            "id": f"vault_{row['id']}",
            "type": f"Vault {row['type'].capitalize()}",
            "title": row["title"],
            "date": row["memory_date"] or "Vault Archive",
            "location": row["location"] or "",
            "content": content
        })
        
    conn.close()
    
    if not chunks:
        return []
        
    # Score chunks against query
    query_tokens = tokenize(query)
    if not query_tokens:
        return chunks[:top_k]
        
    scored_chunks = []
    for chunk in chunks:
        doc_text = f"{chunk['title']} {chunk['date']} {chunk['location']} {chunk['content']}"
        doc_tokens = tokenize(doc_text)
        
        # Calculate term overlap score
        score = 0.0
        doc_token_counts = {}
        for t in doc_tokens:
            doc_token_counts[t] = doc_token_counts.get(t, 0) + 1
            
        for qt in query_tokens:
            if qt in doc_token_counts:
                # TF weighting
                tf = doc_token_counts[qt]
                score += (1.0 + math.log(tf))
                # Boost if in title
                if qt in chunk['title'].lower():
                    score += 2.5
                    
        scored_chunks.append((score, chunk))
        
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    
    # Filter to chunks with score > 0, or if none matched, return top 2 recent
    relevant = [c for s, c in scored_chunks if s > 0]
    if not relevant:
        relevant = [c for _, c in scored_chunks[:2]]
        
    return relevant[:top_k]
