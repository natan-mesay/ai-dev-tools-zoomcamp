# MaitreQ - FastAPI & SQLAlchemy Backend

FastAPI backend service for **MaitreQ** (Restaurant Waitlist Manager MVP) adhering strictly to `openapi.yaml`.

---

## 🏗️ Architecture & Database-Agnostic Design

- **ORM:** SQLAlchemy 2.0 (`AsyncSession`, mapped declarative models).
- **Default Database:** SQLite (`sqlite+aiosqlite:///./maitreq.db`) for zero-friction local execution.
- **Production-Ready:** Set `DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/maitreq` to switch seamlessly to PostgreSQL with zero code changes.
- **Real-Time:** Server-Sent Events (SSE) broadcaster at `/api/v1/events`.

---

## 🚀 Getting Started with `uv`

### 1. Install dependencies
```bash
cd backend
uv sync
```

### 2. Run the test suite (13 automated tests)
```bash
uv run pytest
```

### 3. Start the FastAPI development server
```bash
uv run uvicorn app.main:app --reload --port 8000
```

* **Interactive OpenAPI Docs:** http://localhost:8000/docs
* **ReDoc:** http://localhost:8000/redoc
* **SSE Realtime Stream:** http://localhost:8000/api/v1/events
