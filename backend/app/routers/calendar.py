import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Task, User
from app.schemas import CalendarEventResponse
from app.services.google_calendar import fetch_events
from app.services.google_oauth import get_valid_credentials

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/events", response_model=list[CalendarEventResponse])
def get_calendar_events(
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Parse start/end or default to current week (Sun-Sat)
    now = datetime.utcnow()
    if start:
        try:
            time_min = datetime.fromisoformat(start.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            time_min = now
    else:
        # Default: start of current week (Sunday)
        days_since_sunday = now.weekday() + 1 if now.weekday() != 6 else 0
        time_min = (now - timedelta(days=days_since_sunday)).replace(hour=0, minute=0, second=0, microsecond=0)

    if end:
        try:
            time_max = datetime.fromisoformat(end.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            time_max = now + timedelta(days=7)
    else:
        # Default: end of current week (Saturday night)
        days_until_saturday = 5 - now.weekday() if now.weekday() != 6 else 6
        time_max = (now + timedelta(days=days_until_saturday + 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    # Fetch Google Calendar events (gracefully handle API errors)
    google_events: list[dict] = []
    try:
        credentials = get_valid_credentials(current_user, db)
        google_events = fetch_events(credentials, time_min, time_max)
    except Exception as e:
        logger.warning("Failed to fetch Google Calendar events: %s", e)

    # Build set of google_event_ids from scheduled tasks for deduplication
    scheduled_tasks = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.is_scheduled == True,
            Task.scheduled_start != None,
            Task.scheduled_end != None,
            Task.scheduled_start < time_max,
            Task.scheduled_end > time_min,
        )
        .all()
    )

    task_event_ids = {t.google_event_id for t in scheduled_tasks if t.google_event_id}

    events: list[CalendarEventResponse] = []

    # Add Google Calendar events (skip ones that are our own scheduled tasks)
    for ge in google_events:
        event_id = ge.get("id", "")
        if event_id in task_event_ids:
            continue  # will be added as task_placer source below

        start_val = ge.get("start", {})
        end_val = ge.get("end", {})
        start_str = start_val.get("dateTime") or start_val.get("date", "")
        end_str = end_val.get("dateTime") or end_val.get("date", "")

        events.append(
            CalendarEventResponse(
                id=event_id,
                title=ge.get("summary", "(No title)"),
                start=start_str,
                end=end_str,
                source="google_calendar",
            )
        )

    # Add scheduled tasks
    for task in scheduled_tasks:
        events.append(
            CalendarEventResponse(
                id=str(task.id),
                title=task.name,
                start=task.scheduled_start.isoformat() if task.scheduled_start else "",
                end=task.scheduled_end.isoformat() if task.scheduled_end else "",
                source="task_placer",
            )
        )

    return events
