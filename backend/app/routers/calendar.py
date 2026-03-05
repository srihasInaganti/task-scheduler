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
    days: int = Query(default=7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    time_min = now
    time_max = now + timedelta(days=days)

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

        start = ge.get("start", {})
        end = ge.get("end", {})
        start_str = start.get("dateTime") or start.get("date", "")
        end_str = end.get("dateTime") or end.get("date", "")

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
