# Task Placer

A smart task scheduling app that integrates with Google Calendar. Add tasks, and Task Placer finds open slots in your calendar to schedule them — either with a greedy algorithm or an AI-powered scheduler.

https://task-scheduler-pearl.vercel.app/

## Features

- **Google OAuth** — Sign in with Google, sync with your calendar
- **Task Management** — Create, edit, and delete tasks with priority levels
- **Dual Scheduling Modes**
  - **Normal** — Greedy algorithm that fills earliest available slots by priority
  - **AI-Powered** — Uses Groq LLM to infer task duration/priority and optimize placement
- **Calendar View** — Weekly view with drag-and-drop rescheduling via FullCalendar
- **Google Calendar Sync** — Scheduled tasks appear as events in your Google Calendar
- **Configurable Settings** — Available hours, timezone, buffer time, and scheduling mode

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, FullCalendar
- **Backend:** FastAPI, SQLAlchemy, SQLite
- **APIs:** Google Calendar API, Groq API (for AI mode)

## Google Sign in Requires user to be added as a test user if interested reach out and I can add you.
