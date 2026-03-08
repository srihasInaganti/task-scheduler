from datetime import datetime, timedelta

import pytz


def find_free_slots(
    events: list[dict],
    day_start_hour: int,
    day_end_hour: int,
    start_date: datetime,
    end_date: datetime,
    timezone: str,
) -> list[tuple[datetime, datetime]]:
    """Find free time slots between busy events within available hours."""
    tz = pytz.timezone(timezone)
    free_slots = []

    current_day = start_date.date()
    end_day = end_date.date()

    while current_day <= end_day:
        day_start = tz.localize(datetime.combine(current_day, datetime.min.time().replace(hour=day_start_hour)))
        day_end = tz.localize(datetime.combine(current_day, datetime.min.time().replace(hour=day_end_hour)))

        # Skip if day_end is in the past
        now = datetime.now(tz)
        if day_end <= now:
            current_day += timedelta(days=1)
            continue

        # Adjust start to now if it's today
        if day_start < now:
            day_start = now

        # Collect busy intervals for this day
        busy = []
        for event in events:
            start_str = event.get("start", "")
            end_str = event.get("end", "")
            if not start_str or not end_str:
                continue
            try:
                ev_start = datetime.fromisoformat(start_str.replace("Z", "+00:00")).astimezone(tz)
                ev_end = datetime.fromisoformat(end_str.replace("Z", "+00:00")).astimezone(tz)
            except (ValueError, TypeError):
                continue

            # Only include if it overlaps this day's window
            if ev_end > day_start and ev_start < day_end:
                busy.append((max(ev_start, day_start), min(ev_end, day_end)))

        busy.sort(key=lambda x: x[0])

        # Find gaps
        cursor = day_start
        for busy_start, busy_end in busy:
            if cursor < busy_start:
                free_slots.append((cursor, busy_start))
            cursor = max(cursor, busy_end)

        if cursor < day_end:
            free_slots.append((cursor, day_end))

        current_day += timedelta(days=1)

    return free_slots


BUFFER_MINUTES = 10


def run_greedy_schedule(
    tasks: list[dict], free_slots: list[tuple[datetime, datetime]]
) -> tuple[list[dict], list[dict]]:
    """Greedy scheduler: assign tasks to the earliest free slot that fits."""
    priority_order = {"high": 0, "medium": 1, "low": 2}
    buffer = timedelta(minutes=BUFFER_MINUTES)
    sorted_tasks = sorted(
        tasks,
        key=lambda t: (priority_order.get(t["priority"], 1), t["created_at"]),
    )

    # Make a mutable copy of free slots
    slots = list(free_slots)
    scheduled = []
    unscheduled = []

    for task in sorted_tasks:
        duration = timedelta(minutes=task["duration_minutes"])
        placed = False

        for i, (slot_start, slot_end) in enumerate(slots):
            slot_duration = slot_end - slot_start
            if slot_duration >= duration:
                task_start = slot_start
                task_end = slot_start + duration

                task["scheduled_start"] = task_start.isoformat()
                task["scheduled_end"] = task_end.isoformat()
                scheduled.append(task)

                # Split remaining slot, consuming a buffer after the task
                remaining_start = task_end + buffer
                if remaining_start < slot_end:
                    slots[i] = (remaining_start, slot_end)
                else:
                    slots.pop(i)

                placed = True
                break

        if not placed:
            unscheduled.append(task)

    return scheduled, unscheduled
