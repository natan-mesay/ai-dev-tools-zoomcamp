# MaitreQ - Restaurant Waitlist Manager (MVP)

**MaitreQ** is a modern, real-time waitlist and table management application designed for restaurant hosts and waiting guests.

---

## 🌟 Key Features

- **Host Dashboard:**
  - Fast walk-in party registration (Name, Party Size, Phone, Special Notes).
  - Live queue view sorted by arrival time and current wait duration.
  - One-click status management (`Waiting`, `Notified`, `Seated`, `Cancelled`, `No-Show`).
  - Table capacity overview and fast table seating.
- **Guest Status Portal:**
  - Mobile-optimized tracking page accessible via unique token link.
  - Live queue position and estimated wait time.
  - Instant visual notification when the table is ready.
  - Self-service cancellation option.

---

## 📐 Project Documentation

- **[Specification Doc](file:///_docs/specs.md):** Complete functional requirements, non-functional requirements, data models, and API endpoints.
- **[Implementation Plan](file:///plan.md):** Milestone breakdown, task checklist, and architectural guidelines.
- **[AI Agent Guidelines](file:///AGENTS.md):** Architecture conventions, coding standards, and operational guidelines for autonomous agents.

---

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js (v18+) or Python (v3.10+) depending on chosen backend layer
- Docker & Docker Compose (for PostgreSQL database)

### Quickstart Setup
```bash
# 1. Clone & enter repository
cd week_2

# 2. Start PostgreSQL via Docker Compose
docker compose up -d

# 3. Install dependencies
npm install

# 4. Run database migrations and seed data
npm run db:migrate
npm run db:seed

# 5. Start the development server
npm run dev
```

---

## 📁 Repository Structure

```
├── _docs/
│   └── specs.md          # Functional and technical specifications
├── AGENTS.md             # AI Agent instructions & conventions
├── plan.md               # Step-by-step implementation plan
├── .gitignore            # Git ignore rules
└── README.md             # Project overview & documentation
```
