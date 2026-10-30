# ========================================================
# Multi-stage Dockerfile for Echoes – Memories Never Die
# Stage 1: Build React + Vite + Tailwind CSS Frontend
# Stage 2: Python Flask + Gunicorn Production Server
# ========================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Python Server ---
FROM python:3.11-slim AS production

# Install system dependencies: ffmpeg for Whisper audio decoding, curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1 into the container
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY frontend/public/ ./frontend/public/

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=5000 \
    FRONTEND_DIST=/app/frontend/dist

# Ensure data directories exist for SQLite and media storage
RUN mkdir -p /app/backend/data/uploads/audio \
             /app/backend/data/uploads/photos \
             /app/backend/data/uploads/offerings \
             /app/backend/data/uploads/avatars

# Declare persistent volume mount point for database & user uploads
VOLUME ["/app/backend/data"]

EXPOSE 5000

WORKDIR /app/backend

# Run with Gunicorn production WSGI server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "app:create_app()"]
