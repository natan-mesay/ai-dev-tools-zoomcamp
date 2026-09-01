# Backlog: Household Chore Kiosk (Django)

## Task 1: Data Models & Core Schema
Define Django models in `chores/models.py`:
- `FamilyMember`: Name, role (Parent/Child), avatar, PIN (for parents), current XP, level, and balance/allowance total.
- `Chore`: Title, description, chore type (`ROUTINE` vs `BOUNTY`), monetary reward amount, XP reward value, frequency (daily/weekly), and assigned kid (optional).
- `ChoreSubmission`: Link to `Chore` and `FamilyMember`, photo proof image upload, status (`PENDING`, `APPROVED`, `REJECTED`), parent feedback note, and submitted/approved timestamps.
- `Badge` & `StreakTracker`: Rules and records for streaks and milestone achievements.

## Task 2: Django Admin Configuration & Seed Data
- Register `FamilyMember`, `Chore`, `ChoreSubmission`, and `Badge` in `chores/admin.py`.
- Create seed data / fixtures for quick testing (e.g., sample parent, 2 kids, routine chores, and bounty tasks).

## Task 3: Kiosk Home & Avatar Profile Switcher UI
- Create base touch-friendly template with Tailwind CSS and HTMX.
- Build the main Kiosk screen showing all family avatars with quick 1-tap switching.
- Implement Alpine.js PIN-entry modal for parent access.

## Task 4: Kid Dashboard & Chore Claiming
- Display kid's current level, XP progress bar, streak counter, and accumulated pocket money.
- Render tabs for "My Daily Routines" and "Bounty Board".
- Add HTMX action to claim available bounties.

## Task 5: Camera Capture & Photo Proof Submission
- Implement HTML5 / Alpine.js camera modal to snap or upload a photo directly on the tablet.
- Create submission endpoint handling multipart file upload, creating `ChoreSubmission` with `PENDING` status.

## Task 6: Parent Approval Queue & Reward Engine
- Build PIN-protected parent review view with HTMX to display pending photo submissions.
- Implement 1-tap Approve and Reject actions.
- Automatically calculate and credit monetary balance and XP upon approval, triggering level-up checks and updating streaks.
