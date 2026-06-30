#Project Title: Pulse — AI-Powered Productivity Companion

1. Problem Statement Selected
Students, professionals, and entrepreneurs frequently miss deadlines, assignments, meetings, and important commitments. Existing productivity tools rely on passive reminders — notifications that are easy to dismiss and do nothing to help users actually follow through. The gap isn't awareness of tasks; it's the absence of any system that holds users accountable to completing them.
2. Solution Overview
Pulse is an AI companion that closes the gap between planning a task and actually finishing it. Rather than another to-do list with notifications, Pulse meets users in however they naturally think — typed notes, voice, or a photo of a handwritten list — and uses Gemini to convert that into a structured, confirmed daily plan. It then enforces real accountability: tasks can't be marked complete without AI-verified proof of effort, and a nightly journaling loop feeds directly back into the next day's plan, so the app actually remembers what you struggled with and calls it out before you repeat it.
3. Key Features
Frictionless Task Capture
Users enter their day in plain, unstructured language — typed or photographed (e.g. a handwritten to-do list) — and Gemini parses it into discrete tasks, asking for user confirmation before anything is finalized.
Personalized Onboarding & Calibration
First-time users go through a short calibration: preferred name, ideal day-planning time, and average daily task capacity. This personalizes pacing and tone from session one, rather than applying one-size-fits-all scheduling.
Journaling Loop (Core USP)
Each night, users journal what went well and what didn't. Gemini reads this and carries it forward: when the user plans the next day, Pulse references what they actually said — "you mentioned wanting to fix your gym consistency yesterday" — turning reflection into accountability instead of a forgotten diary entry. This is what separates Pulse from passive reminder apps: the system has memory of the user's own stated intentions and holds them to it.
AI-Verified Proof of Completion
Tasks cannot be marked done without submitting proof — a photo or short reflection. Gemini evaluates whether the submission is genuinely relevant to the task before allowing completion, preventing the "checkbox theater" most to-do apps allow.
Behavioral Pattern Analysis
Pulse analyzes completion patterns over time (e.g. repeated missed tasks in a category) and surfaces this during planning, rather than burying it in a separate analytics tab.
Insight Dashboard
A daily rating of task completion and journaling engagement, giving users a quick read on how the day actually went versus how it was planned.
Google Calendar Sync
Confirmed tasks sync directly to the user's Google Calendar for authenticated users.
Time-Aware UI & Constellation Visualization
The interface shifts between a morning mode (planning-focused) and a night mode (journaling-focused) based on time of day. Completed tasks accumulate as stars in a personal constellation, giving long-term progress a visual, persistent form.
Guest Mode for Evaluation
Since hackathon judges' accounts can't be pre-registered for Google OAuth testing, Pulse offers a no-signup guest mode with local on-device storage, so evaluators can experience the full app immediately. Google Sign-In remains available for persistent, cross-device use.
4. Technologies Used

Frontend: React 19 (functional components, custom Hooks), TypeScript
Build Tooling: Vite (frontend); esbuild + tsx (backend compiled to optimized dist/server.cjs for fast Cloud Run cold starts)
Styling/UI: Tailwind CSS v4, Motion (Framer Motion) for transitions, Lucide React for iconography
Backend: Express (REST API, Gemini communication routes)
Database & Auth: Firebase — Firestore (real-time storage for tasks/journals), Firebase Auth (OAuth + guest identity)
AI: @google/genai SDK (Gemini)
Data Visualization: Recharts (dashboard trend graphs)
Deployment: Google Cloud Run, published via Google AI Studio

5. Google Technologies Utilized

Gemini API — task extraction from text/photo input, proof-of-completion verification, journal and behavioral pattern analysis, personalized planning suggestions
Firebase Auth — Google OAuth sign-in and guest identity handling
Firestore — real-time storage for tasks, journals, and user state
Cloud Run — production deployment via Google AI Studio
Google Calendar API — task-to-event sync for authenticated users