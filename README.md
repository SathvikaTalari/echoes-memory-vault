# 🕯️ Echoes – Memories Never Die
### *AI-Powered Memory Preservation Platform for the Hacktoberfest 2026 "Ghost in the Machine" Challenge*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask_3.1-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_+_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Whisper](https://img.shields.io/badge/Speech--to--Text-OpenAI_Whisper-00A67E?logo=openai&logoColor=white)](https://github.com/openai/whisper)
[![Ollama](https://img.shields.io/badge/Local_LLM-Qwen2.5--3B--Instruct-FF6F00?logo=ollama&logoColor=white)](https://ollama.com/library/qwen2.5)
[![Database](https://img.shields.io/badge/Database-SQLite_Local-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_On--Device-10B981?logo=shield&logoColor=white)](#offline--privacy-guarantee)

---

## 🌟 Concept & Philosophy: "Ghost in the Machine"

In an age where human lives generate terabytes of ephemeral digital exhaust, our most precious heirlooms—the cadence of a grandmother's voice, the recipe never written on paper, the wisdom whispered before a storm—are often lost when a loved one passes.

**Echoes – Memories Never Die** reimagines the "Ghost in the Machine" challenge not as a haunting apparition or an uncanny chatbot simulator, but as a **living, sacred, and private digital archive**. Inspired by Mexican *Día de los Muertos* (Day of the Dead) tradition, Echoes offers families an eternal sanctuary where loved ones' authentic words, photographs, and life lessons are preserved with profound dignity.

### 🛡️ The Sacred Ethical AI Guarantee
Unlike unsettling apps that attempt to simulate or impersonate the deceased through creepy AI roleplay, Echoes adheres to a strict ethical manifesto:
1. **Never Impersonate**: The AI explicitly refuses to speak in first person as the departed (*"I am in heaven watching you"*). Instead, it acts with deep reverence as an empathetic **biographer, historian, and archival chronicler** (*"Elena often recalled in the 1956 recordings..."*).
2. **Never Fabricate**: The model will **never invent false memories** or extrapolate unverified facts. If a detail was never recorded in the vault, the AI gently clarifies: *"That memory has not been recorded yet in Elena's vault."*
3. **100% On-Device Privacy**: All voice tapes, photos, journals, and AI model inferences run **locally on your machine**. Sensitive personal family histories are never sent to external cloud APIs or harvested for training data.

---

## ✨ Core Features

### 1. 🎙️ Voice Recording & Local Whisper Transcription
- **Live In-Browser Recorder**: High-fidelity microphone capture with real-time Web Audio API waveform visualizer, pause/resume, and instant playback preview.
- **Historical Audio Uploads**: Supports legacy cassette digitizations, voicemails, and phone memos (`.wav`, `.mp3`, `.m4a`, `.webm`, `.ogg`).
- **Local Whisper Engine**: Uses OpenAI's `whisper` model locally to generate word-accurate transcripts with synchronized segment timestamps.
- **Interactive Audio Player**: Vintage audio player where clicking any line in the synchronized transcript instantly seeks audio to that exact moment.

### 2. 📖 AI Memory Storyteller Studio (Qwen2.5-3B-Instruct)
Transforms disjointed, spoken transcripts and casual voice memos into beautifully written literary chapters using the locally running **Qwen2.5-3B-Instruct** model via Ollama.
- **Four Distinct Narrative Styles**:
  - **Intimate Family Chronicle**: Warm, heartfelt memoir style as if recorded in a leather-bound family heirloom.
  - **Classic Biographer**: Eloquent, chronological narrative with vivid historical setting and direct quotations.
  - **Life Lesson & Wisdom**: Highlights virtues, philosophical advice, and moral guidance passed down to future generations.
  - **Poetic Vignette**: Lyrical, atmospheric piece focusing on a single sacred moment (e.g., *"Dancing in the Oaxaca Plaza Rain"*).
- Generates titles, narrative chapters, era/timeframe, location, key wisdom extracts, and emotional tone tags.

### 3. 🏺 Digital Memory Vault
- **Filterable & Searchable Grid**: Browse visual memories, life milestones, personal keepsakes, and cherished quotes.
- **Chronological Timeline Mode**: View life milestones in sequential order from early youth to present day.
- **Category Classifications**: Organize by *Family*, *Love & Marriage*, *Childhood*, *Wisdom*, *Adventures*, and *Everyday Joy*.
- **Heirloom Memory Book Exporter**: Generates a complete, offline Markdown memory book and printable album layout for physical family keepsakes.

### 4. 🕯️ Virtual Ofrenda Sanctuary (Día de los Muertos Altar)
A 3-tiered interactive altar:
- **Tier I (Cielo / Sacred Memory)**: Golden marigold arch, central framed portrait with flickering candlelight aura, and sacred offerings.
- **Tier II (Tierra / Feasts & Heirlooms)**: Traditional offerings including *Pan de Muerto*, *Café de Olla*, *Mole Poblano*, embroidered fabrics, and favorite musical instruments.
- **Tier III (Altar Hearth / Candles & Prayers)**: Interactive glowing candles of remembrance (*Cempasúchil Gold*, *Classic Beeswax*, *Eternal White*, *Violet Prayer*). Visitors can light candles with personal prayers and toggle flames.
- **Ambient Hearth & Guitar Chimes**: Synthesizes soft soothing chords and crackling warmth using the Web Audio API—completely offline!
- **Floating Cempasúchil Petals**: Gentle, organic falling marigold petals drifting across the sanctuary.

### 5. 🔍 Ask Your Memories (Factual RAG Retrieval)
- Conversational question-answering powered by local Qwen2.5-3B-Instruct over a SQLite vector-keyword context retrieval engine.
- Ask questions like:
  - *"What happened during the rainstorm in the plaza in Oaxaca?"*
  - *"What was Abuela's advice on patience when cooking traditional mole?"*
  - *"What advice did they leave about handling grief or anger?"*
- **Source Citations**: Displays exact memory titles and dates referenced for every answer.
- **Graceful Fallback**: If Ollama is offline or starting up, a local extractive retriever answers immediately without interruption.

### 6. 👥 Multi-Sanctuary Management
- Create and switch between dedicated profiles for multiple loved ones (e.g., *Abuela Elena Morales*, *Grandfather Manuel*, *Aunt Clara*).
- Each profile maintains its own isolated audio archives, story vault, altar offerings, and memory records.

---

## 🏛️ System Architecture

```
Echoes Architecture
├── Frontend (Port 5173)
│   ├── React 19 + TypeScript + Vite
│   ├── Tailwind CSS (Candlelight Amber, Obsidian, Marigold Palette)
│   ├── Lucide Icons & Web Audio API Synthesizers
│   └── Real-time Canvas Particle Shower (Cempasúchil Petals)
│
├── Backend (Port 5000)
│   ├── Python Flask REST API
│   ├── SQLite Database (data/echoes.db)
│   ├── Local File Storage (data/uploads/)
│   ├── Whisper Service (OpenAI-Whisper Python STT)
│   ├── Ollama Service (Qwen2.5-3B-Instruct LLM Client)
│   └── RAG Context Retrieval Service
│
└── Local AI Subsystems
    ├── Ollama Daemon (http://localhost:11434) -> qwen2.5:3b-instruct
    └── Local Whisper Model -> base / tiny
```

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Python 3.10+** (Python 3.14 tested & verified)
2. **Node.js 18+** & **npm**
3. *(Optional for live local LLM)* **Ollama**: [https://ollama.com/download](https://ollama.com/download)

---

### Step 1: Clone and Setup Backend

```bash
cd c:\Hacktober\backend

# Install python dependencies
pip install -r requirements.txt

# Run automated tests to verify database, auth, and AI services
python -m unittest tests/test_api.py

# Start Flask server (runs on http://127.0.0.1:5000)
python app.py
```

### Step 2: Setup Frontend

In a separate terminal:

```bash
cd c:\Hacktober\frontend

# Install dependencies (already completed)
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Open your browser to: **`http://localhost:5173`**

*(Note: Echoes includes pre-seeded demo access with Abuela Elena Morales's memorial sanctuary, audio tapes, and virtual ofrenda ready to explore on first load!)*

---

### Step 3: (Optional) Connect Local Ollama with Qwen2.5-3B-Instruct

Echoes works immediately in **Smart Simulation Mode** even without Ollama running. To enable live neural inference using the open-source Qwen model:

1. Download and install Ollama from [ollama.com](https://ollama.com).
2. In your terminal, run:
   ```bash
   ollama pull qwen2.5:3b-instruct
   ollama run qwen2.5:3b-instruct
   ```
3. Open Echoes and click the status pill in the top navbar (`Simulation Mode` / `Qwen2.5 Online`) to verify live connection.

---

## 🧪 Testing & Verification

A comprehensive automated test suite covers the complete application backend:

```bash
cd backend
python -m unittest tests/test_api.py
```

**Test Coverage Highlights:**
- `test_01_health_check`: REST system health endpoint validation.
- `test_02_system_status`: Verifies offline readiness, Ollama, and Whisper diagnostics.
- `test_03_auth_login_seeded_user`: JWT authentication & demo account login.
- `test_04_auth_signup_new_user`: User registration & secure password hashing.
- `test_05_loved_ones_sanctuary`: Memorial profile CRUD operations and memory counts.
- `test_06_story_generation_and_saving`: AI Storyteller generation across narrative styles.
- `test_07_virtual_ofrenda`: Altar offerings placement and interactive candle flame toggle.
- `test_08_ask_memories_rag`: Context retrieval & factual question-answering.
- `test_09_memory_book_export`: Complete Heirloom Memory Book markdown generation.

---

## 🔒 Offline & Privacy Guarantee

- **Zero Cloud API Dependencies**: No OpenAI API keys, no Google/Anthropic tracking, no external audio processing.
- **Local SQLite Database**: All records live in `backend/data/echoes.db`.
- **Local File Storage**: Media files reside locally in `backend/data/uploads/`.
- **Air-Gapped Ready**: Once Ollama and Whisper models are downloaded, Echoes operates completely disconnected from the internet.

---

## 📜 Hacktoberfest 2026 Submission

- **Track**: Ghost in the Machine
- **Project Name**: Echoes – Memories Never Die
- **License**: MIT
- **Dedication**: In eternal remembrance of all those who came before us, whose voices and love remain our guiding light.
