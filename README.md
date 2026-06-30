# Pulse — AI-Powered Productivity Companion

Pulse is an AI companion that closes the gap between *planning* a task and *actually finishing* it. Instead of another to-do list with notifications, Pulse meets users in however they naturally think — typed notes, voice, or a photo of a handwritten list — and uses Gemini to convert that into a structured, confirmed daily plan. It then enforces real accountability: tasks can't be marked complete without AI-verified proof of effort, and a nightly journaling loop feeds directly back into the next day's plan.

---

## Problem Statement

Students, professionals, and entrepreneurs frequently miss deadlines, assignments, meetings, and important commitments. Existing productivity tools rely on passive reminders — notifications that are easy to dismiss and do nothing to help users actually follow through. The gap isn't awareness of tasks; it's the absence of any system that holds users accountable to completing them.

## Solution Overview

Pulse meets users where they already are — messy notes, voice, or a photo of a handwritten list — and uses Gemini to turn that into a confirmed, structured plan. Beyond planning, Pulse enforces follow-through with AI-verified proof of completion, and closes the loop every night with a journaling feature that feeds directly into the next day's planning.

---

## Key Features

### Frictionless Task Capture
Users enter their day in plain, unstructured language — typed or photographed (e.g. a handwritten to-do list) — and Gemini parses it into discrete tasks, asking for user confirmation before anything is finalized.

### Personalized Onboarding & Calibration
First-time users go through a short calibration: preferred name, ideal day-planning time, and average daily task capacity, personalizing pacing and tone from session one.

### Journaling Loop (Core USP)
Each night, users journal what went well and what didn't. Gemini reads this and carries it forward: when the user plans the next day, Pulse references what they actually said — e.g. "you mentioned wanting to fix your gym consistency yesterday" — turning reflection into accountability instead of a forgotten diary entry.

### AI-Verified Proof of Completion
Tasks cannot be marked done without submitting proof — a photo or short reflection. Gemini evaluates whether the submission is genuinely relevant to the task before allowing completion.

### Behavioral Pattern Analysis
Pulse analyzes completion patterns over time (e.g. repeated missed tasks in a category) and surfaces this during planning.

### Insight Dashboard
A daily rating of task completion and journaling engagement.

### Google Calendar Sync
Confirmed tasks sync directly to the user's Google Calendar for authenticated users.

### Time-Aware UI & Constellation Visualization
The interface shifts between a morning mode (planning-focused) and a night mode (journaling-focused) based on time of day. Completed tasks accumulate as stars in a personal constellation, giving long-term progress a visual, persistent form.

### Guest Mode for Evaluation
Since judges' accounts can't be pre-registered for Google OAuth testing, Pulse offers a no-signup guest mode with local on-device storage, so evaluators can experience the full app immediately. Google Sign-In remains available for persistent, cross-device use.

---

## Tech Stack

**Frontend**
- React 19 (functional components, custom Hooks)
- TypeScript
- Vite
- Tailwind CSS v4
- Motion (Framer Motion)
- Lucide React

**Backend**
- Express (REST API, Gemini communication routes)
- esbuild + tsx (compiled to optimized `dist/server.cjs` for fast Cloud Run cold starts)

**Database & Auth**
- Firebase Firestore (real-time storage for tasks/journals)
- Firebase Auth (Google OAuth + guest identity)

**AI**
- `@google/genai` SDK (Gemini API)

**Data Visualization**
- Recharts

**Deployment**
- Google Cloud Run, published via Google AI Studio

---

## Google Technologies Utilized

- **Gemini API** — task extraction from text/photo input, proof-of-completion verification, journal and behavioral pattern analysis, personalized planning suggestions
- **Firebase Auth** — Google OAuth sign-in and guest identity handling
- **Firestore** — real-time storage for tasks, journals, and user state
- **Cloud Run** — production deployment via Google AI Studio
- **Google Calendar API** — task-to-event sync for authenticated users

---

## Live Demo

[Pulse — Live App](https://pulse-145786147428.asia-east1.run.app/)

> **Note:** Use **Guest Mode** to try Pulse instantly without Google sign-in. Guest data is stored locally on-device and won't persist across machines. Sign in with Google for persistent, cross-device storage and Calendar sync.

---

## Built For

Google AI Hackathon — Challenge: *Build an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed.*