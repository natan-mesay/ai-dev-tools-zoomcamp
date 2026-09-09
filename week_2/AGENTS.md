# AGENTS.md - Agent Working Guidelines

This repository contains the **MaitreQ** (Restaurant Waitlist Manager MVP). All autonomous AI agents operating within this codebase must strictly adhere to the following principles, architectural guidelines, and workflows.

---

## 1. Project Context & Objectives
- **Scope:** Building a lean, reliable MVP for restaurant waitlist tracking with a Host Dashboard and a Guest Status Portal.
- **Core Documentation:**
  - Specifications: [`_docs/specs.md`](file:///_docs/specs.md)
  - Implementation Plan & Checklist: [`plan.md`](file:///plan.md)
  - Project Overview: [`README.md`](file:///README.md)

---

## 2. Agent Principles & Workflow Rules

### 2.1. Plan First, Execute Incrementally
1. Always review [`plan.md`](file:///plan.md) and [`_docs/specs.md`](file:///_docs/specs.md) before starting any new task.
2. Update the checklist in [`plan.md`](file:///plan.md) as tasks and milestones are completed.
3. Keep code changes modular, well-typed, and clean.

### 2.2. Code Quality & Standards
- **TypeScript / Type Safety:** Ensure strict types across all database schemas, API contracts, and React components. Avoid `any`.
- **Data Validation:** Use validation schemas (e.g., Zod) on both client forms and API route handlers.
- **Error Handling:** Return structured API error responses (`{ error: string, code: string, details?: any }`) with appropriate HTTP status codes.
- **Database Consistency:** When updating party status to `SEATED`, ensure table occupancy transitions are handled atomically within transactions where appropriate.
- **Component Design:** Follow mobile-first design for guest views and tablet/desktop friendly responsive design for the host view.

### 2.3. Testing & Verification
- Verify all endpoints and user flows using automated unit/integration tests or end-to-end smoke verification.
- Always ensure the local build compiles cleanly without TypeScript or linting errors before finalizing steps.

---

## 3. Communication & Documentation Integrity
- Never delete or overwrite documentation without explicit rationale.
- If changes to the data model or API are made during implementation, update [`_docs/specs.md`](file:///_docs/specs.md) immediately.
