# MaitreQ - Restaurant Waitlist Manager (MVP)

**MaitreQ** is a modern, real-time waitlist and table management application designed for restaurant hosts and waiting guests.

---

## 🌟 Key Features
 
- **Host Dashboard:**
  - **Visual Dining Floor Plan:** Square restaurant tables with top availability badges (`Available`, `Occupied`, `Reserved`), seat capacity indicators, and occupant details.
  - **Drag-and-Drop Seating:** Drag waiting parties directly from the queue onto available tables to instantly seat guests and occupy tables.
  - **Live Waitlist Queue:** Real-time waiting list on the right panel with status badges, waiting timers, reordering, and instant notifications.
  - **Fast Party Registration:** Name, party size, phone, and special dining notes.
  - **Table Operations:** 1-click table clean/freeing, instant reservation locking, and table creation.
- **Guest Status Portal:**
  - Mobile-optimized tracking page accessible via unique public token links (`/status/:token`).
  - Real-time queue position and estimated wait time without page reloads.
  - Prominent "Table Ready" alert state with call-to-action.
  - Self-service cancellation flow.
- **Real-Time Synchronization:**
  - Server-Sent Events (SSE) broadcasting queue and table state changes across all connected devices in real time.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend:** FastAPI (Python 3.13), Pydantic v2, Uvicorn, Server-Sent Events (SSE).
- **Database & ORM:** SQLAlchemy 2.0 (Async with SQLite / `aiosqlite`), timezone-aware UTC types, atomic seating transactions.
- **Testing:** Automated test suite using `pytest` and `pytest-asyncio`.

---

## 📐 Project Documentation

- **[Specification Doc](file:///_docs/specs.md):** Complete functional requirements, non-functional requirements, data models, and API endpoints.
- **[Implementation Plan](file:///plan.md):** Milestone breakdown, task checklist, and architectural guidelines.
- **[AI Agent Guidelines](file:///AGENTS.md):** Architecture conventions, coding standards, and operational guidelines for autonomous agents.
- **[OpenAPI Contract](file:///openapi.yaml):** REST API endpoints and schema specifications.

---

## 🚀 Getting Started (Development)

### 1. Backend Setup & Run
```bash
cd backend

# Run automated tests
uv run pytest

# Start the FastAPI server (http://localhost:8000)
uv run uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup & Run
```bash
cd frontent

# Install dependencies (if needed)
npm install

# Start Vite dev server (http://localhost:5173)
npm run dev
```

---

## 📁 Repository Structure

```
├── _docs/
│   └── specs.md          # Functional and technical specifications
├── AGENTS.md             # AI Agent instructions & conventions
├── plan.md               # Step-by-step implementation plan & checklist
├── openapi.yaml          # OpenAPI 3.1.0 specification
├── backend/              # FastAPI + SQLAlchemy async backend
│   ├── app/
│   │   ├── db/           # SQLAlchemy models, session, seed data
│   │   ├── routers/      # REST API route handlers
│   │   ├── services/     # Business logic layer
│   │   ├── events.py     # SSE event broadcaster
│   │   └── main.py       # FastAPI application entrypoint
│   └── tests/            # Pytest automated test suite
├── frontent/             # React 19 + Tailwind CSS frontend
│   └── src/
│       ├── components/   # Host dashboard & Guest portal components
│       └── services/     # API & SSE client layer
└── README.md             # Project overview & documentation
```

