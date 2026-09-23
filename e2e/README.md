# End-to-End (E2E) Multi-Client Playwright Test Suite

This test suite runs against the live [`docker-compose.yaml`](../week_3/docker-compose.yaml) application stack using [Playwright](https://playwright.dev/).

---

## 🎭 Tested Scenarios (6-Step Multi-Session Flow)

This test validates real-time multi-session collaboration across two isolated browser contexts:

1. **Step 1 — Host / Interviewer (Session 1):** Connects to the application at `/?view=host`, confirming the Host Dashboard, Dining Floor, and Waitlist queue are rendered.
2. **Step 2 — Create Session:** Host registers a new party/session with a unique candidate name and phone number via the "Add Party" modal.
3. **Step 3 — Share Join Link:** Host opens the Guest Tracking modal and copies the unique join URL (`/?view=guest&token=...`).
4. **Step 4 — Join as Candidate (Session 2):** In an isolated browser context, the candidate navigates to the shared join link and views their live status and queue position.
5. **Step 5 — Candidate State Change (Session 2):** Candidate updates state (initiating self-cancellation via the portal).
6. **Step 6 — Real-Time Verification (Session 1):** Host in Session 1 observes the real-time Server-Sent Event (SSE) toast notification and queue update without any manual page reload.

---

## 🚀 Running the E2E Tests

### 1. Ensure the Docker Compose stack is running
```bash
cd /home/natan/Desktop/zoomcamp/ai/week_3
docker compose up -d
```

### 2. Run the Playwright test
```bash
cd /home/natan/Desktop/zoomcamp/ai/e2e

# Run headless (default)
npm test

# Run headed (watch the browsers interact in real-time)
npm run test:headed

# Run with Playwright interactive UI
npx playwright test --ui
```
