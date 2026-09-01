# Project Specification: Household Chore Kiosk for Families

## 1. Overview & Audience
A centralized, touch-friendly home tablet kiosk designed for families with kids to manage household chores, build daily habits, and track allowances through gamification.

## 2. Key Features (Question 2)
1. **Gamified Allowance Engine:** Combines monetary pocket money earnings ($) with RPG progression (XP, levels, daily streaks, and achievement badges).
2. **Hybrid Chore Management:** 
   - **Mandatory Daily Routines:** Core recurring responsibilities required to maintain daily streaks.
   - **Bounty Board:** Open pool of optional, claimable chores kids can complete for bonus cash and XP.
3. **Photo Proof & Parent Approval Queue:** Kids capture completion photos directly using the tablet camera; parents unlock an approval queue with a secure PIN to verify before XP and money are awarded.
4. **Touch-First Shared Kiosk Interface:** Fast avatar-based profile switching on a central kitchen/living room tablet display without needing individual kid logins.

## 3. Technology Stack
- **Backend:** Python / Django (SQLite database, Django Admin, built-in ORM & auth)
- **Frontend:** Django Templates + HTMX (interactive updates) + Alpine.js (kiosk modals, PIN pad, camera capture) + Tailwind CSS (responsive touch UI)
- **Logic:** Pure deterministic business logic (no AI dependencies)
