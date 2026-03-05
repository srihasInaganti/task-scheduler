# Task Placer — Implementation Guide

**Tech stack:** React/TypeScript + Tailwind (Vite) frontend, FastAPI + SQLite (SQLAlchemy) backend.

## Project Structure
```
task-placer/
├── CLAUDE.md
├── .gitignore
├── backend/
│   ├── requirements.txt
│   ├── .env / .env.example
│   └── app/
│       ├── __init__.py
│       ├── config.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── dependencies.py
│       ├── main.py
│       ├── services/
│       │   ├── __init__.py
│       │   ├── google_oauth.py
│       │   ├── google_calendar.py
│       │   └── scheduler.py
│       └── routers/
│           ├── __init__.py
│           ├── auth.py
│           ├── tasks.py
│           ├── calendar.py
│           └── schedule.py
├── frontend/
│   ├── .env / .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── types/index.ts
│       ├── api/
│       │   ├── client.ts
│       │   ├── auth.ts
│       │   ├── tasks.ts
│       │   ├── calendar.ts
│       │   └── schedule.ts
│       ├── context/AuthContext.tsx
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── ProtectedRoute.tsx
│       │   ├── TaskForm.tsx
│       │   ├── TaskItem.tsx
│       │   ├── TaskList.tsx
│       │   ├── CalendarView.tsx
│       │   └── ScheduleButton.tsx
│       └── pages/
│           ├── LoginPage.tsx
│           ├── AuthCallbackPage.tsx
│           ├── DashboardPage.tsx
│           └── SettingsPage.tsx
```

---

## Phase 1: Backend Foundation

Create the core backend scaffolding.

**Files to create:**
- `backend/requirements.txt` — fastapi, uvicorn, sqlalchemy, pydantic-settings, python-jose[cryptography], google-auth-oauthlib, google-api-python-client, python-dotenv
- `backend/app/__init__.py` — empty
- `backend/app/config.py` — `Settings` class using pydantic-settings, reading from `.env`:
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET_KEY, DATABASE_URL (default: `sqlite:///./taskplacer.db`), FRONTEND_URL (default: `http://localhost:5173`), REDIRECT_URI (default: `http://localhost:8000/auth/callback`)
- `backend/app/database.py` — SQLAlchemy engine with `check_same_thread=False` for SQLite, `SessionLocal` sessionmaker, `Base = declarative_base()`
- `backend/app/models.py`:
  - `User`: id, google_id (unique), email, name, picture_url, access_token, refresh_token, token_expiry (DateTime), available_start_hour (default 9), available_end_hour (default 17), timezone (default "America/New_York"), created_at, updated_at
  - `Task`: id, user_id (FK → users.id), name, duration_minutes, priority (string enum: "high"/"medium"/"low"), is_scheduled (default False), scheduled_start (DateTime, nullable), scheduled_end (DateTime, nullable), google_event_id (nullable), created_at, updated_at
- `backend/app/schemas.py` — Pydantic models:
  - UserResponse, UserSettings (available_start_hour, available_end_hour, timezone)
  - TaskCreate (name, duration_minutes, priority), TaskUpdate (all optional), TaskResponse
  - CalendarEventResponse (id, title, start, end, source: "task_placer" | "google_calendar")
  - ScheduleResultResponse (scheduled: list[TaskResponse], unscheduled: list[TaskResponse], message: str)
- `backend/app/dependencies.py`:
  - `get_db()` — yields SessionLocal
  - `get_current_user(token: str = Depends(oauth2_scheme))` — decodes JWT (python-jose), returns User from DB; raises 401 if invalid
- `backend/app/main.py`:
  - FastAPI app instance
  - CORS middleware allowing `http://localhost:5173` (all methods, all headers, credentials=True)
  - `@app.on_event("startup")` → `Base.metadata.create_all(bind=engine)`
  - Include all routers

**Verify:** `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload` starts without errors, SQLite DB file is created.

---

## Phase 2: Google OAuth

Implement the full OAuth login flow.

**Files to create:**
- `backend/.env.example`:
  ```
  GOOGLE_CLIENT_ID=your-client-id
  GOOGLE_CLIENT_SECRET=your-client-secret
  JWT_SECRET_KEY=your-secret-key
  ```
- `backend/.env` — actual values (gitignored)
- `backend/app/services/__init__.py` — empty
- `backend/app/services/google_oauth.py`:
  - `SCOPES = ["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/calendar"]`
  - `create_oauth_flow(redirect_uri)` — returns google_auth_oauthlib Flow configured with client ID/secret and scopes
  - `get_valid_credentials(user)` — builds google.oauth2.credentials.Credentials from user's stored tokens, refreshes if expired, updates DB, returns credentials
- `backend/app/routers/__init__.py` — empty
- `backend/app/routers/auth.py`:
  - `GET /auth/login` → creates OAuth flow, generates authorization URL with `access_type=offline`, `prompt=consent`, returns `{ url: "https://accounts.google.com/..." }`
  - `GET /auth/callback` → exchanges authorization code for tokens, fetches user info from Google, upserts User in DB (store access_token, refresh_token, token_expiry), creates JWT containing `{ sub: user.id }`, redirects (HTTP 307) to `{FRONTEND_URL}/auth/callback?token={jwt}`
  - `GET /auth/me` → requires auth, returns current user as UserResponse
  - `PUT /auth/settings` → requires auth, accepts UserSettings body, updates user's available_start_hour, available_end_hour, timezone

**Verify:** Visit `http://localhost:8000/auth/login` in browser, complete Google OAuth, get redirected to frontend with JWT token in URL.

---

## Phase 3: Frontend Foundation + Auth

Scaffold the React app and implement login.

**Setup commands:**
```bash
cd task-placer
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install axios react-router-dom
```

**Tailwind setup:**
- Add `@tailwindcss/vite` plugin to `vite.config.ts`
- In `src/index.css`: `@import "tailwindcss";`

**Files to create:**
- `frontend/.env` — `VITE_API_URL=http://localhost:8000`
- `frontend/.env.example` — same with placeholder
- `src/types/index.ts`:
  ```typescript
  export type Priority = "high" | "medium" | "low";
  export interface User { id: number; email: string; name: string; picture_url: string; available_start_hour: number; available_end_hour: number; timezone: string; }
  export interface Task { id: number; name: string; duration_minutes: number; priority: Priority; is_scheduled: boolean; scheduled_start: string | null; scheduled_end: string | null; google_event_id: string | null; created_at: string; }
  export interface CalendarEvent { id: string; title: string; start: string; end: string; source: "task_placer" | "google_calendar"; }
  export interface ScheduleResult { scheduled: Task[]; unscheduled: Task[]; message: string; }
  ```
- `src/api/client.ts` — Axios instance: baseURL from `VITE_API_URL`, request interceptor adds `Authorization: Bearer <token>` from localStorage, response interceptor catches 401 → clears token → redirects to `/login`
- `src/api/auth.ts` — `getLoginUrl()` → GET /auth/login, `getMe()` → GET /auth/me, `updateSettings(data)` → PUT /auth/settings
- `src/context/AuthContext.tsx`:
  - State: user, token, loading
  - On mount: read token from localStorage, call `/auth/me` to hydrate user; if fails clear token
  - Provides: user, token, login(), logout(), setUser()
  - `login()` calls getLoginUrl() then `window.location.href = url`
  - `logout()` clears localStorage + state, redirects to /login
- `src/pages/LoginPage.tsx` — centered card with app title "Task Placer" and "Sign in with Google" button (calls login from context)
- `src/pages/AuthCallbackPage.tsx` — reads `token` from URL search params, stores in localStorage, redirects to `/`
- `src/components/Navbar.tsx` — app name on left; right side: user avatar (img), user name, Settings link, Logout button
- `src/components/ProtectedRoute.tsx` — if loading show spinner, if no user redirect to `/login`, else render `<Outlet />`
- `src/App.tsx`:
  ```
  Routes:
    /login → LoginPage
    /auth/callback → AuthCallbackPage
    / → ProtectedRoute wrapper
      / → DashboardPage
      /settings → SettingsPage
  ```
- `src/main.tsx` — renders App wrapped in BrowserRouter and AuthProvider

**Verify:** `cd frontend && npm run dev` → visit localhost:5173 → click Sign in with Google → complete OAuth → redirected back to dashboard with user info in Navbar.

---

## Phase 4: Tasks CRUD

Build task management UI and API.

**Backend:**
- `backend/app/routers/tasks.py`:
  - `GET /tasks/` — list all tasks for current user, ordered by created_at desc
  - `POST /tasks/` — create task (name, duration_minutes, priority) for current user
  - `PUT /tasks/{id}` — update task fields; verify task belongs to current user
  - `DELETE /tasks/{id}` — delete task; if task has google_event_id, also delete the Google Calendar event; verify ownership

**Frontend:**
- `src/api/tasks.ts` — getTasks(), createTask(data), updateTask(id, data), deleteTask(id)
- `src/components/TaskForm.tsx`:
  - Fields: name (text input), duration (select: 15/30/45/60/90/120 minutes), priority (select: high/medium/low)
  - Submit button "Add Task"
  - Calls createTask(), triggers parent refetch
- `src/components/TaskItem.tsx`:
  - Displays: task name, duration, priority badge (red for high, yellow for medium, green for low)
  - Status indicator: scheduled (blue dot) or unscheduled (gray dot)
  - Edit button (inline editing or modal) and Delete button with confirmation
- `src/components/TaskList.tsx`:
  - Takes tasks array as prop
  - Renders list of TaskItem components
  - Shows "No tasks yet" empty state
- `src/pages/DashboardPage.tsx`:
  - Fetches tasks on mount
  - Two-panel layout: left panel (TaskForm + TaskList), right panel (CalendarView placeholder — just a bordered div with "Calendar coming soon")
  - Responsive: stack vertically on mobile

**Verify:** Create, edit, delete tasks through UI. Verify they persist via page refresh.

---

## Phase 5: Google Calendar Integration

Display existing calendar events alongside tasks.

**Backend:**
- `backend/app/services/google_calendar.py`:
  - `fetch_events(credentials, time_min, time_max)` — calls Google Calendar API `events().list()` on primary calendar, returns list of events
  - `create_event(credentials, summary, start, end)` — creates event with summary prefixed "[Task Placer] ", returns event_id
  - `delete_event(credentials, event_id)` — deletes event from Google Calendar, handles 404 gracefully
- `backend/app/routers/calendar.py`:
  - `GET /calendar/events?days=7` — fetches Google Calendar events for next N days + scheduled tasks from DB, merges into unified CalendarEvent list with `source` field, deduplicates (tasks with google_event_id that also appear in Google results)

**Frontend:**
- `npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid` (in frontend/)
- `src/api/calendar.ts` — `getCalendarEvents(days?)` → GET /calendar/events
- `src/components/CalendarView.tsx`:
  - Uses FullCalendar with `timeGridWeek` plugin
  - Events colored by source: blue/indigo for task_placer, gray for google_calendar
  - slotMinTime / slotMaxTime set from user's available hours
  - nowIndicator enabled
  - Responsive height

Update `DashboardPage.tsx` to replace the placeholder with actual CalendarView.

**Verify:** Existing Google Calendar events appear in the weekly view alongside any scheduled tasks.

---

## Phase 6: Scheduling Algorithm

The core feature — greedy task placement into free calendar slots.

**Backend:**
- `backend/app/services/scheduler.py`:
  - `find_free_slots(events, day_start_hour, day_end_hour, start_date, end_date, timezone)`:
    - For each day in range, create availability window (day_start_hour to day_end_hour)
    - Subtract all busy events (from Google Calendar)
    - Return list of `(start_datetime, end_datetime)` free gaps
  - `run_greedy_schedule(tasks, free_slots)`:
    - Sort tasks by priority (high=0, medium=1, low=2), then by created_at (oldest first)
    - For each task, find first free slot where task fits (duration_minutes <= slot duration)
    - Place task at start of that slot, split remaining slot time
    - Return (scheduled_tasks_with_times, unscheduled_tasks)
- `backend/app/routers/schedule.py`:
  - `POST /schedule/run`:
    - Fetch unscheduled tasks for current user
    - Fetch Google Calendar events for next 7 days
    - Run scheduling algorithm
    - For each scheduled task: create Google Calendar event, update task in DB (is_scheduled=True, scheduled_start, scheduled_end, google_event_id)
    - Return ScheduleResultResponse
  - `DELETE /schedule/clear`:
    - For all scheduled tasks of current user: delete Google Calendar event, reset task (is_scheduled=False, scheduled_start=None, scheduled_end=None, google_event_id=None)
    - Return success message

**Frontend:**
- `src/api/schedule.ts` — `runSchedule()` → POST /schedule/run, `clearSchedule()` → DELETE /schedule/clear
- `src/components/ScheduleButton.tsx`:
  - Two buttons: "Schedule Tasks" (primary) and "Clear Schedule" (secondary/danger)
  - Loading spinner while running
  - On success: shows result message (e.g., "3 tasks scheduled, 1 could not fit"), triggers parent refetch of tasks and calendar events
  - On error: shows error message

Update `DashboardPage.tsx` to include ScheduleButton and refetch both tasks and calendar events after scheduling.

**Verify:** Create tasks, click Schedule, verify events appear in CalendarView (blue) and in Google Calendar (prefixed "[Task Placer]"). Click Clear Schedule, verify events removed.

---

## Phase 7: Settings + Polish

- `src/pages/SettingsPage.tsx`:
  - Form with: available start hour (dropdown 0-23), available end hour (dropdown 0-23), timezone (common timezone select)
  - Save button calls updateSettings(), shows success toast/message
  - Pre-fills with current user settings
- Update Navbar to include Settings link (gear icon or text)
- Root `.gitignore`:
  ```
  .env
  __pycache__/
  *.pyc
  node_modules/
  *.db
  dist/
  venv/
  ```
- Add loading spinners for all async operations (task CRUD, calendar fetch, scheduling)
- Add error handling: try/catch around all API calls, display user-friendly error messages
- Add toast/notification system for success/error feedback

---

## End-to-End Verification

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173`, click "Sign in with Google"
4. Complete OAuth, verify redirect back to dashboard
5. Go to Settings, set available hours (e.g., 9-17)
6. Create 3-4 tasks with different priorities and durations
7. Click "Schedule Tasks"
8. Verify: tasks appear on CalendarView in blue, highest priority tasks get earliest slots
9. Check Google Calendar — events prefixed "[Task Placer]" are present
10. Click "Clear Schedule", verify events removed from both UI and Google Calendar

---

## Development Commands

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Key Implementation Notes

- All backend routes requiring auth use `current_user: User = Depends(get_current_user)`
- JWT tokens contain `{ "sub": user_id }` and expire in 7 days
- Google OAuth tokens (access_token, refresh_token) are stored per-user in the DB, refreshed automatically via `get_valid_credentials()`
- The scheduler looks 7 days ahead by default
- Calendar events created by the app are prefixed with "[Task Placer] " for easy identification
- SQLite is used for simplicity — no migrations needed, tables auto-created on startup
- CORS is configured for localhost:5173 only
