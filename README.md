# Task Placer

A smart task scheduling app that integrates with Google Calendar. Add tasks, and Task Placer finds open slots in your calendar to schedule them — either with a greedy algorithm or an AI-powered scheduler.

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

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials and the Google Calendar API enabled
- (Optional) A [Groq API key](https://console.groq.com/) for AI scheduling mode

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/task-placer.git
cd task-placer
```

### 2. Google Cloud credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Enable the **Google Calendar API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add `http://localhost:8000/auth/callback` as an **Authorized redirect URI**
7. Add `http://localhost:5173` as an **Authorized JavaScript origin**
8. Copy the **Client ID** and **Client Secret**

### 3. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET_KEY=your-random-secret-key
GROQ_API_KEY=your-groq-api-key          # optional, needed for AI mode
```

> Generate a JWT secret with: `python -c "import secrets; print(secrets.token_hex(32))"`

Start the backend:

```bash
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

### 4. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Usage

1. Open `http://localhost:5173` and sign in with Google
2. Go to **Settings** to configure your available hours, timezone, and scheduling mode
3. Add tasks from the dashboard
4. Click **Schedule Tasks** to auto-place them into free calendar slots
5. Drag and drop events in the calendar to manually adjust
6. Click **Clear Schedule** to remove all scheduled tasks and their Google Calendar events

## Project Structure

```
task-placer/
├── backend/
│   ├── requirements.txt
│   ├── .env
│   └── app/
│       ├── main.py              # FastAPI app, startup, CORS
│       ├── config.py            # Environment settings
│       ├── database.py          # SQLAlchemy engine + session
│       ├── models.py            # User, Task models
│       ├── schemas.py           # Pydantic request/response models
│       ├── dependencies.py      # Auth dependency (JWT)
│       ├── routers/             # auth, tasks, calendar, schedule
│       └── services/            # google_oauth, google_calendar, scheduler, ai
└── frontend/
    ├── package.json
    ├── .env
    └── src/
        ├── App.tsx
        ├── api/                 # Axios client + API modules
        ├── context/             # AuthContext
        ├── components/          # Navbar, TaskForm, TaskList, CalendarView, etc.
        └── pages/               # Login, Dashboard, Settings, AuthCallback
```
