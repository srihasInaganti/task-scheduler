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


def _split_slots_by_focus(
    free_slots: list[tuple[datetime, datetime]],
    focus_start_hour: int,
    focus_end_hour: int,
) -> tuple[list[tuple[datetime, datetime]], list[tuple[datetime, datetime]]]:
    """Split free slots into focus-time slots and regular slots.

    A single free slot may span both focus and non-focus time, so it gets
    split at the focus boundaries.
    """
    focus_slots = []
    regular_slots = []

    for slot_start, slot_end in free_slots:
        tz = slot_start.tzinfo
        day = slot_start.date()
        focus_begin = slot_start.replace(hour=focus_start_hour, minute=0, second=0, microsecond=0)
        focus_finish = slot_start.replace(hour=focus_end_hour, minute=0, second=0, microsecond=0)

        # If the slot spans midnight this is unusual but handle gracefully
        # by using the slot's own date for focus boundaries
        if slot_end.date() != day:
            # Just treat the whole slot simply — classify by start time
            if focus_start_hour <= slot_start.hour < focus_end_hour:
                focus_slots.append((slot_start, slot_end))
            else:
                regular_slots.append((slot_start, slot_end))
            continue

        # No overlap with focus window
        if slot_end <= focus_begin or slot_start >= focus_finish:
            regular_slots.append((slot_start, slot_end))
            continue

        # Part before focus window
        if slot_start < focus_begin:
            regular_slots.append((slot_start, focus_begin))

        # Focus portion
        f_start = max(slot_start, focus_begin)
        f_end = min(slot_end, focus_finish)
        if f_start < f_end:
            focus_slots.append((f_start, f_end))

        # Part after focus window
        if slot_end > focus_finish:
            regular_slots.append((focus_finish, slot_end))

    return focus_slots, regular_slots


DEFAULT_BUFFER_MINUTES = 10


def _place_tasks_in_slots(
    tasks: list[dict],
    slots: list[tuple[datetime, datetime]],
    buffer: timedelta,
) -> tuple[list[dict], list[dict]]:
    """Try to place tasks into the given slots. Returns (placed, remaining)."""
    slots = list(slots)  # mutable copy
    placed = []
    remaining = []

    for task in tasks:
        duration = timedelta(minutes=task["duration_minutes"])
        task_placed = False

        for i, (slot_start, slot_end) in enumerate(slots):
            if slot_end - slot_start >= duration:
                task_start = slot_start
                task_end = slot_start + duration

                task["scheduled_start"] = task_start.isoformat()
                task["scheduled_end"] = task_end.isoformat()
                placed.append(task)

                remaining_start = task_end + buffer
                if remaining_start < slot_end:
                    slots[i] = (remaining_start, slot_end)
                else:
                    slots.pop(i)

                task_placed = True
                break

        if not task_placed:
            remaining.append(task)

    return placed, remaining


def run_greedy_schedule(
    tasks: list[dict],
    free_slots: list[tuple[datetime, datetime]],
    focus_start_hour: int | None = None,
    focus_end_hour: int | None = None,
    buffer_minutes: int | None = None,
) -> tuple[list[dict], list[dict]]:
    """Greedy scheduler: assign tasks to the earliest free slot that fits.

    When focus time is configured, high-priority and long (>=60 min) tasks
    are placed in focus-time slots first, then remaining tasks fill regular slots.
    """
    priority_order = {"high": 0, "medium": 1, "low": 2}
    buffer = timedelta(minutes=buffer_minutes if buffer_minutes is not None else DEFAULT_BUFFER_MINUTES)
    sorted_tasks = sorted(
        tasks,
        key=lambda t: (priority_order.get(t["priority"], 1), t["created_at"]),
    )

    has_focus = (
        focus_start_hour is not None
        and focus_end_hour is not None
        and focus_start_hour < focus_end_hour
    )

    if not has_focus:
        # Original behavior — no focus time distinction
        return _place_tasks_in_slots(sorted_tasks, free_slots, buffer)

    # Split slots into focus and regular
    focus_slots, regular_slots = _split_slots_by_focus(
        free_slots, focus_start_hour, focus_end_hour
    )

    # Separate tasks: "focus-worthy" = high priority OR long duration (>=60 min)
    focus_tasks = []
    regular_tasks = []
    for t in sorted_tasks:
        if t["priority"] == "high" or t["duration_minutes"] >= 60:
            focus_tasks.append(t)
        else:
            regular_tasks.append(t)

    # Phase 1: Place focus-worthy tasks in focus slots first
    placed_focus, overflow_focus = _place_tasks_in_slots(focus_tasks, focus_slots, buffer)

    # Phase 2: Place regular tasks in regular slots
    placed_regular, overflow_regular = _place_tasks_in_slots(regular_tasks, regular_slots, buffer)

    # Phase 3: Overflow focus tasks go to regular slots (leftover after phase 2)
    # We need the remaining regular slots after phase 2
    # Re-run with overflow from both phases into all remaining slots
    all_remaining_tasks = overflow_focus + overflow_regular

    # Collect leftover slots from both pools
    # Recalculate by running placement on combined remaining
    # Since _place_tasks_in_slots modifies the slots list via pop/replace,
    # the regular_slots list was already mutated in phase 2.
    # focus_slots was mutated in phase 1.
    # Use whatever is left in both.
    leftover_slots = sorted(focus_slots + regular_slots, key=lambda s: s[0])
    placed_overflow, unscheduled = _place_tasks_in_slots(
        sorted(all_remaining_tasks, key=lambda t: (priority_order.get(t["priority"], 1), t["created_at"])),
        leftover_slots,
        buffer,
    )

    return placed_focus + placed_regular + placed_overflow, unscheduled
