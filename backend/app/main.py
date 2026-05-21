from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

from app.config import settings
from app.database import Base, engine
from app.routers import auth, calendar, schedule, tasks

app = FastAPI()

allowed_origins = {"http://localhost:5173", settings.FRONTEND_URL}
if settings.EXTRA_CORS_ORIGINS:
    allowed_origins.update(o.strip() for o in settings.EXTRA_CORS_ORIGINS.split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    # Allow Vercel preview deployments (e.g. https://task-placer-git-feature-foo.vercel.app)
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    # Add new columns to existing DBs (idempotent on both SQLite and Postgres).
    # Postgres needs each statement in its own transaction since a failed
    # statement poisons the current one.
    statements = [
        "ALTER TABLE users ADD COLUMN scheduling_mode VARCHAR DEFAULT 'normal'",
        "ALTER TABLE tasks ADD COLUMN context VARCHAR",
        "ALTER TABLE users ADD COLUMN focus_start_hour INTEGER",
        "ALTER TABLE users ADD COLUMN focus_end_hour INTEGER",
        "ALTER TABLE users ADD COLUMN buffer_minutes INTEGER DEFAULT 10",
    ]
    for stmt in statements:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
        except Exception:
            pass


app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(calendar.router)
app.include_router(schedule.router)


@app.get("/health")
def health():
    return {"status": "ok"}
