# 🚀 Echoes – Production Deployment Guide

This guide details how to deploy **Echoes – Memories Never Die** as a unified single-service container. In this setup, the Python Flask backend serves both the REST API and the compiled React production bundle, with persistent volume storage for your SQLite database and audio archives.

---

## 📋 Table of Contents
1. [Overview & Recommended Stack](#overview--recommended-stack)
2. [Option 1: Deploy with Docker Compose (Any VPS / Cloud Server)](#option-1-deploy-with-docker-compose-any-vps--cloud-server)
3. [Option 2: Deploy on Render (Free / Hobby Tier)](#option-2-deploy-on-render-free--hobby-tier)
4. [Option 3: Deploy on Railway](#option-3-deploy-on-railway)
5. [Option 4: Deploy on Fly.io](#option-4-deploy-on-flyio)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Persistent Storage & Backup](#persistent-storage--backup)

---

## 🏗️ Overview & Recommended Stack

- **Container Engine**: Docker multi-stage build ([Dockerfile](Dockerfile)).
  - **Stage 1**: Compiles React 19 + TypeScript + Tailwind CSS with Vite.
  - **Stage 2**: Lightweight Python 3.11 environment with `ffmpeg` (for Whisper audio), `gunicorn`, and SQLite.
- **Web Server**: Gunicorn WSGI server running on port `5000`.
- **Database & Media**: SQLite database stored in `/app/backend/data/echoes.db` and user uploads in `/app/backend/data/uploads/`. Both are backed by a persistent Docker volume.

---

## Option 1: Deploy with Docker Compose (Any VPS / Cloud Server)

> **Best for**: DigitalOcean Droplet, Linode, AWS EC2, Hetzner, or a private home server (e.g. with NVIDIA GPU).

### 1. Prerequisites
Ensure Docker and Docker Compose are installed on your server:
```bash
docker --version
docker compose version
```

### 2. Clone Repository & Launch
```bash
git clone <your-repo-url> echoes
cd echoes

# Build and start both Echoes and the local Ollama daemon
docker compose up -d --build
```

### 3. Pull the Qwen2.5-3B-Instruct Model into Ollama
```bash
# Pull the target model into the running Ollama container
docker compose exec ollama ollama pull qwen2.5:3b-instruct
```

### 4. Verify Services
- Open `http://<your-server-ip>:5000` in your browser.
- Health check: `curl http://<your-server-ip>:5000/api/health`

### 5. (Optional) Setup HTTPS with Nginx & Certbot
Create a standard reverse proxy in `/etc/nginx/sites-available/echoes`:
```nginx
server {
    server_name echoes.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }
}
```
Obtain free SSL certificate:
```bash
sudo certbot --nginx -d echoes.yourdomain.com
```

---

## Option 2: Deploy on Render (Free / Hobby Tier)

Render can build the repository directly from GitHub using the included [`render.yaml`](render.yaml) blueprint.

### Step-by-Step:
1. Push your code to a **GitHub repository**.
2. Log into [Render.com](https://render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and configure:
   - Service Type: **Web Service** (Docker)
   - Health Check Path: `/api/health`
   - Persistent Disk: `5GB` mounted at `/app/backend/data`
6. Click **Apply**.
7. Once deployed, Render will provide a live HTTPS URL (e.g., `https://echoes-memories.onrender.com`).

---

## Option 3: Deploy on Railway

1. Push your code to GitHub.
2. Go to [Railway.app](https://railway.app/) and create a **New Project**.
3. Select **Deploy from GitHub repo** and pick your repository.
4. Railway will automatically detect the [`railway.json`](railway.json) and [`Dockerfile`](Dockerfile).
5. In the Railway dashboard under **Volumes**, add a persistent volume mounted at:
   ```
   /app/backend/data
   ```
6. Set the `PORT` environment variable to `5000`.
7. Generate a public domain under **Settings → Networking → Generate Domain**.

---

## Option 4: Deploy on Fly.io

1. Install Flyctl CLI:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex

   # macOS / Linux
   curl -L https://fly.io/install.sh | sh
   ```
2. Login and create an app:
   ```bash
   fly auth login
   fly launch --no-deploy
   ```
3. Create a persistent volume for the SQLite database:
   ```bash
   fly volumes create echoes_data --size 3
   ```
4. Deploy the application:
   ```bash
   fly deploy
   ```
5. Open your live app:
   ```bash
   fly open
   ```

---

## 🔐 Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port on which Gunicorn / Flask listens |
| `SECRET_KEY` | *(Generated random string)* | Flask session secret key |
| `JWT_SECRET_KEY` | *(Generated random string)* | Secret key for signing authentication tokens |
| `JWT_EXPIRATION_HOURS`| `720` (30 days) | JWT token lifespan |
| `OLLAMA_URL` | `http://localhost:11434` | Endpoint for Ollama daemon (`http://ollama:11434` in docker-compose) |
| `OLLAMA_MODEL` | `qwen2.5:3b-instruct` | LLM used for story weaving and memory retrieval |
| `WHISPER_MODEL` | `base` | Local Whisper model (`tiny`, `base`, `small`, `medium`) |
| `FRONTEND_DIST` | `/app/frontend/dist` | Path to compiled React assets |

---

## 💾 Persistent Storage & Backup

All personal data is stored inside a single directory:
```
backend/data/
├── echoes.db               # SQLite database (memories, stories, users, candles)
└── uploads/                # User-uploaded audio recordings and photographs
    ├── audio/
    ├── photos/
    ├── offerings/
    └── avatars/
```

### To Backup Your Data:
```bash
# Docker Compose: copy data folder to host
docker compose cp echoes:/app/backend/data ./echoes_backup_$(date +%F)
```

### To Restore Your Data:
```bash
# Docker Compose: restore backup into container
docker compose cp ./echoes_backup/* echoes:/app/backend/data/
```
