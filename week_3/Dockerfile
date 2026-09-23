# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build the React frontend with Node.js
# ==============================================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies using package-lock for reproducible builds
COPY frontent/package*.json ./
RUN npm ci

# Copy frontend source files
COPY frontent/ ./

# Build production bundle with relative API URL for unified serving
ENV VITE_API_URL=/api/v1
RUN npm run build

# ==============================================================================
# Stage 2: Build the Python backend image and package frontend static files
# ==============================================================================
FROM python:3.13-slim AS runner

# Install uv for fast, reliable dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Environment configuration
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_LINK_MODE=copy \
    STATIC_DIR=/app/static \
    HOST=0.0.0.0 \
    PORT=8000

WORKDIR /app

# Create non-root application user
RUN useradd -m -u 1000 appuser

# Install Python backend dependencies using uv lockfile
COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy application source code
COPY backend/app ./app
RUN uv sync --frozen --no-dev

# Copy compiled frontend assets from Stage 1 into the static directory
COPY --from=frontend-builder /app/frontend/dist /app/static

# Set permissions for non-root user
RUN chown -R appuser:appuser /app

# Expose backend port
EXPOSE 8000

# Switch to non-root user
USER appuser

# Include virtualenv binaries in PATH
ENV PATH="/app/.venv/bin:$PATH"

# Run FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
