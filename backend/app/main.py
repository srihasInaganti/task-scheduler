from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

from app.database import Base, engine
from app.routers import auth, calendar, schedule, tasks

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    # Add new columns to existing DBs (idempotent)
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN scheduling_mode VARCHAR DEFAULT 'normal'",
            "ALTER TABLE tasks ADD COLUMN context VARCHAR",
            "ALTER TABLE users ADD COLUMN focus_start_hour INTEGER",
            "ALTER TABLE users ADD COLUMN focus_end_hour INTEGER",
            "ALTER TABLE users ADD COLUMN buffer_minutes INTEGER DEFAULT 10",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                conn.rollback()


app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(calendar.router)
app.include_router(schedule.router)


@app.get("/health")
def health():
    return {"status": "ok"}
