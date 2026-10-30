import sqlite3
import json
import os
from datetime import datetime
from config import DATABASE_PATH
from werkzeug.security import generate_password_hash

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Loved Ones (Memorial Sanctuaries / Profiles)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loved_ones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        birth_date TEXT,
        passing_date TEXT,
        resting_place TEXT,
        avatar_url TEXT,
        cover_url TEXT,
        epitaph TEXT,
        bio TEXT,
        favorite_things TEXT, -- JSON: { "foods": [...], "music": [...], "passions": [...] }
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 3. Audio Recordings (Voice memories & Whisper Transcripts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audio_recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loved_one_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        duration_seconds REAL DEFAULT 0,
        transcript_raw TEXT,
        transcript_segments TEXT, -- JSON array of {start, end, text}
        recorded_date TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE CASCADE
    );
    """)

    # 4. Stories (AI Memory Storyteller & Written Narratives)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loved_one_id INTEGER NOT NULL,
        audio_recording_id INTEGER,
        title TEXT NOT NULL,
        narrative TEXT NOT NULL,
        story_style TEXT DEFAULT 'Intimate Family Chronicle', -- 'Classic Biographer', 'Intimate Family Chronicle', 'Life Lesson & Wisdom', 'Poetic Vignette'
        era_timeframe TEXT,
        location TEXT,
        key_wisdom TEXT,
        emotional_tone TEXT,
        tags TEXT, -- JSON array of strings
        is_favorite INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE CASCADE,
        FOREIGN KEY (audio_recording_id) REFERENCES audio_recordings(id) ON DELETE SET NULL
    );
    """)

    # 5. Vault Items (Photos, Milestones, Keepsakes, Artifacts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vault_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loved_one_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'photo', 'story', 'milestone', 'quote', 'artifact'
        title TEXT NOT NULL,
        description TEXT,
        media_url TEXT,
        memory_date TEXT,
        location TEXT,
        people_tagged TEXT, -- JSON array
        category TEXT DEFAULT 'Family', -- 'Family', 'Love & Marriage', 'Childhood', 'Wisdom', 'Adventures', 'Everyday Joy'
        is_highlight INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE CASCADE
    );
    """)

    # 6. Virtual Ofrenda Offerings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ofrenda_offerings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loved_one_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        item_type TEXT NOT NULL, -- 'marigold', 'pan_de_muerto', 'food', 'beverage', 'keepsake', 'calavera', 'music', 'photo'
        icon_name TEXT DEFAULT 'flower',
        custom_image_url TEXT,
        tier INTEGER DEFAULT 2, -- 1 = Upper/Heaven, 2 = Middle/Earth, 3 = Lower/Candles
        dedication_note TEXT,
        placed_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE CASCADE
    );
    """)

    # 7. Virtual Ofrenda Candles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ofrenda_candles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loved_one_id INTEGER NOT NULL,
        lit_by TEXT NOT NULL,
        message TEXT,
        candle_type TEXT DEFAULT 'cempasuchil_gold', -- 'cempasuchil_gold', 'classic_amber', 'eternal_white', 'violet_prayer'
        is_lit INTEGER DEFAULT 1,
        lit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE CASCADE
    );
    """)

    # 8. Ask Your Memories Q&A Log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS qa_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loved_one_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        cited_sources TEXT, -- JSON array of {title, date, excerpt}
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    seed_sample_data_if_needed(conn)
    conn.close()

def seed_sample_data_if_needed(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] > 0:
        return # Already seeded or has users

    # Create default demo user
    cursor.execute("""
        INSERT INTO users (username, email, password_hash, display_name)
        VALUES (?, ?, ?, ?)
    """, (
        "demo",
        "demo@echoes.local",
        generate_password_hash("echoes2026"),
        "Elena's Grandchild"
    ))
    user_id = cursor.lastrowid

    # Create demo Loved One: Abuela Elena Morales
    favorite_things = json.dumps({
        "foods": ["Abuela's Mole Poblano", "Sweet Conchas", "Tamales de Dulce"],
        "music": ["Agustín Lara boleros", "Mariachi Vargas", "Lucha Reyes"],
        "passions": ["Embroidery & Quilting", "Garden of Heirloom Marigolds", "Storytelling around the kitchen table"]
    })

    cursor.execute("""
        INSERT INTO loved_ones (
            user_id, name, relationship, birth_date, passing_date, resting_place,
            avatar_url, cover_url, epitaph, bio, favorite_things
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        "Abuela Elena Morales",
        "Grandmother",
        "1934-04-18",
        "2023-11-02",
        "Oaxaca de Juárez, Mexico",
        "/sample_photos/abuela_portrait.jpg",
        "/sample_photos/oaxaca_garden.jpg",
        "Her laughter was the warm hearth of our family; her recipes, our eternal heirloom.",
        "Elena Morales was born in a mountain village outside Oaxaca in the spring of 1934. She taught three generations that food made with patience can heal any grief, and that songs sung softly before dawn always reach the stars. She kept handwritten journals for 60 years and greeted every neighbor like an old friend.",
        favorite_things
    ))
    loved_one_id = cursor.lastrowid

    # Create sample Audio Recording with Transcript
    transcript_segments = json.dumps([
        {"start": 0.0, "end": 6.5, "text": "I remember the morning your grandfather and I first danced in the plaza in Oaxaca."},
        {"start": 6.8, "end": 14.2, "text": "It was raining so hard the musicians took shelter under the arches, but Manuel took my hand right out into the cobblestones."},
        {"start": 14.5, "end": 21.0, "text": "He said, 'Elena, why wait for the storm to pass when the music is playing right now?'"},
        {"start": 21.5, "end": 29.0, "text": "We were soaked through, laughing until our stomachs hurt. That was the day I knew we would build a life together."}
    ])

    cursor.execute("""
        INSERT INTO audio_recordings (
            loved_one_id, title, filename, file_path, duration_seconds,
            transcript_raw, transcript_segments, recorded_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        loved_one_id,
        "The Rainstorm Dance in the Plaza (1956)",
        "sample_rainstorm_dance.wav",
        "sample_audio/rainstorm_dance.wav",
        29.0,
        "I remember the morning your grandfather and I first danced in the plaza in Oaxaca. It was raining so hard the musicians took shelter under the arches, but Manuel took my hand right out into the cobblestones. He said, 'Elena, why wait for the storm to pass when the music is playing right now?' We were soaked through, laughing until our stomachs hurt. That was the day I knew we would build a life together.",
        transcript_segments,
        "1998-10-14",
        "Recorded on a Sony cassette recorder on Abuela's 64th birthday."
    ))
    audio_id = cursor.lastrowid

    # Sample Stories
    cursor.execute("""
        INSERT INTO stories (
            loved_one_id, audio_recording_id, title, narrative, story_style,
            era_timeframe, location, key_wisdom, emotional_tone, tags, is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        loved_one_id,
        audio_id,
        "Dancing Through the Summer Downpour",
        "In the autumn of 1956, the cobblestone streets of the Oaxaca Zócalo were washed clean by an unrelenting afternoon storm. Most people ran for cover under the colonial stone arches, but young Manuel, seeing Elena sheltering beneath a shop canvas, stepped boldly into the torrential downpour and extended his hand.\n\n'Elena,' he insisted with an unmistakable grin, 'why wait for the storm to pass when the music is playing right now?'\n\nIgnoring her sister's protests, Elena stepped into the rain. For twenty minutes, as water pooled around their ankles, they waltzed alone in the empty square while the marimba quartet cheered from the portales. Elena would recount this moment sixty years later with the exact same sparkle in her dark eyes, reminding her children that true joy is not the absence of trouble, but the courage to dance right through the storm.",
        "Intimate Family Chronicle",
        "October 1956, Early Courting",
        "Zócalo de Oaxaca, Mexico",
        "Joy is not the absence of trouble, but the courage to step into the rain and dance while the music still plays.",
        "Heartwarming, Poetic & Romantic",
        json.dumps(["Courting", "Grandfather Manuel", "Love", "Rain", "Courage"]),
        1
    ))

    cursor.execute("""
        INSERT INTO stories (
            loved_one_id, audio_recording_id, title, narrative, story_style,
            era_timeframe, location, key_wisdom, emotional_tone, tags, is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        loved_one_id,
        None,
        "The Secret of the 24-Ingredient Mole",
        "Every November, Elena's kitchen smelled of toasted chiles, roasted cloves, cinnamon bark, and bitter Mexican chocolate. Neighbors would claim they could navigate to her door just by following the aromatic smoke curling into the chilly morning air.\n\nWhen asked for the written recipe, Elena would merely tap her wooden spoon against the clay cazuela and smile: 'A recipe on paper tells you the weights, but it cannot tell you the patience. If you toast the mulato chiles one second too long, they will be bitter; if you rush the simmering, the flavors will fight each other instead of embracing.'\n\nHer mole was never just food—it was an alchemy of endurance, gentle heat, and love that bound our entire neighborhood together through every celebration and sorrow.",
        "Classic Biographer",
        "Autumn 1970 - 2020",
        "Elena's Clay Kitchen, Oaxaca",
        "Patience cannot be rushed by fire; true warmth requires slow, steadfast simmering.",
        "Sensory, Wise & Reverent",
        json.dumps(["Tradition", "Recipes", "Patience", "Family Feasts"]),
        1
    ))

    # Sample Vault Items (Photos, Milestones, Keepsakes)
    vault_items_data = [
        (
            loved_one_id, "photo", "Elena and Manuel on their Wedding Morning",
            "October 22, 1958. Taken on the steps of Santo Domingo church. Abuela wore a hand-stitched lace veil she spent seven months embroidering.",
            "/sample_photos/wedding_1958.jpg", "1958-10-22", "Santo Domingo Church, Oaxaca",
            json.dumps(["Elena", "Manuel Morales", "Padre Ignacio"]), "Love & Marriage", 1
        ),
        (
            loved_one_id, "photo", "Harvesting Heirloom Marigolds in the Courtyard",
            "Every October, Abuela planted orange cempasúchil seeds in terracotta pots for Día de los Muertos, telling us their scent guides souls back home.",
            "/sample_photos/marigold_garden.jpg", "1982-10-28", "Courtyard Garden, Oaxaca",
            json.dumps(["Elena", "Little Sofia"]), "Family", 1
        ),
        (
            loved_one_id, "milestone", "Arrival of the First Grandchild",
            "On June 14, 1979, Elena welcomed her first granddaughter, singing lullabies in Zapotec and Spanish for three hours straight without pause.",
            None, "1979-06-14", "Hospital Civil, Oaxaca",
            json.dumps(["Elena", "Maria Elena"]), "Family", 0
        ),
        (
            loved_one_id, "quote", "Abuela's Guiding Words on Forgiveness",
            "'Holding anger in your chest is like drinking poison and expecting someone else to perish. Lay it on the earth; the soil knows how to turn bitter roots into sweet flowers.'",
            None, "1994-08-12", "Veranda at Sunset",
            json.dumps(["Elena"]), "Wisdom", 1
        )
    ]

    for item in vault_items_data:
        cursor.execute("""
            INSERT INTO vault_items (
                loved_one_id, type, title, description, media_url,
                memory_date, location, people_tagged, category, is_highlight
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, item)

    # Sample Ofrenda Offerings
    offerings_data = [
        (loved_one_id, "Fresh Cempasúchil Marigolds", "marigold", "flower", "/sample_offerings/cempasuchil.png", 1, "Guiding your gentle spirit back with golden blooms.", "Sofia & Carlos"),
        (loved_one_id, "Traditional Pan de Muerto", "pan_de_muerto", "bread", "/sample_offerings/pan_de_muerto.png", 2, "Sprinkled with sugar, baked exactly as you taught us.", "Your Grandchildren"),
        (loved_one_id, "Clay Cup of Café de Olla with Cinnamon", "beverage", "coffee", "/sample_offerings/cafe_olla.png", 2, "Always sweet, always steaming before dawn.", "Mateo"),
        (loved_one_id, "Hand-Embroidered Huipil Fabric", "keepsake", "sparkles", "/sample_offerings/huipil.png", 2, "The turquoise flowers you stitched with so much grace.", "Isabella"),
        (loved_one_id, "Carved Guitar & Boleros Notes", "music", "music", "/sample_offerings/guitar.png", 3, "Still playing 'Sabor a Mí' under the evening stars.", "Javier")
    ]

    for off in offerings_data:
        cursor.execute("""
            INSERT INTO ofrenda_offerings (
                loved_one_id, title, item_type, icon_name, custom_image_url,
                tier, dedication_note, placed_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, off)

    # Sample Ofrenda Candles
    candles_data = [
        (loved_one_id, "Granddaughter Sofia", "Abuelita, I still make your hot chocolate whenever the first rain arrives. Your love is my sanctuary.", "cempasuchil_gold"),
        (loved_one_id, "Son Carlos", "Thank you for teaching me how to be a father with gentle hands and a listening heart.", "classic_amber"),
        (loved_one_id, "Sister Beatriz", "Until we meet again by the fountains of our childhood. You are never forgotten, hermanita.", "eternal_white"),
        (loved_one_id, "Great-Grandson Leo", "I listen to your cassette recordings every Sunday, Abuela. Your laugh makes me smile.", "violet_prayer")
    ]

    for c in candles_data:
        cursor.execute("""
            INSERT INTO ofrenda_candles (loved_one_id, lit_by, message, candle_type, is_lit)
            VALUES (?, ?, ?, ?, 1)
        """, c)

    conn.commit()
