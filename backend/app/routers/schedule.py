import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Task, User
from app.schemas import ScheduleResultResponse, TaskResponse
from app.services.google_calendar import create_event, delete_event, fetch_events
from app.services.google_oauth import get_valid_credentials
from app.services.scheduler import find_free_slots, run_greedy_schedule

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.post("/run", response_model=ScheduleResultResponse)
def run_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get unscheduled tasks
    unscheduled_tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.is_scheduled == False)
        .all()
    )

    if not unscheduled_tasks:
        return ScheduleResultResponse(scheduled=[], unscheduled=[], message="No unscheduled tasks to schedule.")

    # Fetch Google Calendar events for the next 7 days
    now = datetime.utcnow()
    time_max = now + timedelta(days=7)

    busy_events = []
    credentials = None
    try:
        credentials = get_valid_credentials(current_user, db)
        raw_events = fetch_events(credentials, now, time_max)
        for ev in raw_events:
            start = ev.get("start", {})
            end = ev.get("end", {})
            busy_events.append({
                "start": start.get("dateTime") or start.get("date", ""),
                "end": end.get("dateTime") or end.get("date", ""),
            })
    except Exception as e:
        logger.warning("Failed to fetch calendar events for scheduling: %s", e)

    # Include already-scheduled Task Placer tasks as busy slots
    already_scheduled = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.is_scheduled == True,
            Task.scheduled_start != None,
            Task.scheduled_end != None,
        )
        .all()
    )
    for st in already_scheduled:
        busy_events.append({
            "start": st.scheduled_start.isoformat(),
            "end": st.scheduled_end.isoformat(),
        })

    # Prepare task dicts
    task_dicts = [
        {
            "id": t.id,
            "name": t.name,
            "duration_minutes": t.duration_minutes,
            "priority": t.priority,
            "context": t.context,
            "created_at": t.created_at.isoformat(),
        }
        for t in unscheduled_tasks
    ]

    scheduled_dicts = []
    unscheduled_dicts = []

    if current_user.scheduling_mode == "ai":
        try:
            from app.services.ai import ai_schedule_tasks

            ai_result = ai_schedule_tasks(
                tasks=task_dicts,
                calendar_events=busy_events,
                user_settings={
                    "start_hour": current_user.available_start_hour,
                    "end_hour": current_user.available_end_hour,
                    "timezone": current_user.timezone,
                },
            )

            if ai_result:
                # Map AI results back to tasks
                ai_map = {item["task_id"]: item for item in ai_result}
                for td in task_dicts:
                    if td["id"] in ai_map:
                        td["scheduled_start"] = ai_map[td["id"]]["start"]
                        td["scheduled_end"] = ai_map[td["id"]]["end"]
                        scheduled_dicts.append(td)
                    else:
                        unscheduled_dicts.append(td)
            else:
                raise ValueError("AI returned empty result, falling back to greedy")
        except Exception as e:
            logger.warning("AI scheduling failed, falling back to greedy: %s", e)
            scheduled_dicts = []
            unscheduled_dicts = []

    # Use greedy scheduler if normal mode or AI fallback
    if not scheduled_dicts and current_user.scheduling_mode != "ai" or (
        current_user.scheduling_mode == "ai" and not scheduled_dicts and not unscheduled_dicts
    ):
        timezone = current_user.timezone or "America/New_York"
        free_slots = find_free_slots(
            events=busy_events,
            day_start_hour=current_user.available_start_hour,
            day_end_hour=current_user.available_end_hour,
            start_date=now,
            end_date=time_max,
            timezone=timezone,
        )
        scheduled_dicts, unscheduled_dicts = run_greedy_schedule(task_dicts, free_slots)

    # Update DB and create Google Calendar events
    task_map = {t.id: t for t in unscheduled_tasks}
    scheduled_tasks = []
    unscheduled_task_models = []

    for td in scheduled_dicts:
        task = task_map[td["id"]]
        task.is_scheduled = True
        task.scheduled_start = datetime.fromisoformat(td["scheduled_start"].replace("Z", "+00:00"))
        task.scheduled_end = datetime.fromisoformat(td["scheduled_end"].replace("Z", "+00:00"))

        # Create Google Calendar event
        if credentials:
            try:
                event_id = create_event(
                    credentials, task.name, task.scheduled_start, task.scheduled_end
                )
                task.google_event_id = event_id
            except Exception as e:
                logger.warning("Failed to create calendar event for task %s: %s", task.id, e)

        scheduled_tasks.append(task)

    for td in unscheduled_dicts:
        unscheduled_task_models.append(task_map[td["id"]])

    db.commit()
    for t in scheduled_tasks:
        db.refresh(t)

    mode_label = "AI" if current_user.scheduling_mode == "ai" else "Normal"
    message = f"{mode_label} scheduling complete: {len(scheduled_tasks)} scheduled, {len(unscheduled_task_models)} could not be scheduled."

    return ScheduleResultResponse(
        scheduled=[TaskResponse.model_validate(t) for t in scheduled_tasks],
        unscheduled=[TaskResponse.model_validate(t) for t in unscheduled_task_models],
        message=message,
    )


@router.delete("/clear")
def clear_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scheduled_tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.is_scheduled == True)
        .all()
    )

    credentials = None
    try:
        credentials = get_valid_credentials(current_user, db)
    except Exception:
        pass

    for task in scheduled_tasks:
        if task.google_event_id and credentials:
            try:
                delete_event(credentials, task.google_event_id)
            except Exception as e:
                logger.warning("Failed to delete calendar event %s: %s", task.google_event_id, e)

        task.is_scheduled = False
        task.scheduled_start = None
        task.scheduled_end = None
        task.google_event_id = None

    db.commit()
    return {"message": f"Cleared schedule for {len(scheduled_tasks)} tasks."}
