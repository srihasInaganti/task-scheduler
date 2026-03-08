import json
import logging

from app.config import settings

logger = logging.getLogger(__name__)


def infer_task_details(task_name: str, context: str | None) -> dict:
    """Use Groq LLM to infer duration and priority from task name + context."""
    try:
        from groq import Groq

        client = Groq(api_key=settings.GROQ_API_KEY)

        prompt = f"Task: {task_name}"
        if context:
            prompt += f"\nContext: {context}"

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a task planning assistant. Given a task name and optional context, "
                        "infer the most appropriate duration and priority.\n"
                        "Duration must be one of: 15, 30, 45, 60, 90, 120 (minutes).\n"
                        "Priority must be one of: high, medium, low.\n"
                        "Respond with ONLY a JSON object: {\"duration_minutes\": <int>, \"priority\": \"<str>\"}"
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=100,
        )

        result = json.loads(response.choices[0].message.content)
        duration = result.get("duration_minutes", 30)
        priority = result.get("priority", "medium")

        if duration not in (15, 30, 45, 60, 90, 120):
            duration = 30
        if priority not in ("high", "medium", "low"):
            priority = "medium"

        return {"duration_minutes": duration, "priority": priority}
    except Exception as e:
        logger.warning("AI inference failed, using defaults: %s", e)
        return {"duration_minutes": 30, "priority": "medium"}


def ai_schedule_tasks(
    tasks: list[dict], calendar_events: list[dict], user_settings: dict
) -> list[dict]:
    """Use Groq LLM to intelligently schedule tasks around existing events."""
    try:
        from groq import Groq

        client = Groq(api_key=settings.GROQ_API_KEY)

        tasks_desc = json.dumps(tasks, indent=2)
        events_desc = json.dumps(calendar_events, indent=2)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an intelligent task scheduler. Given a list of tasks and existing "
                        "calendar events (busy slots), schedule the tasks into available time slots.\n\n"
                        f"User's available hours: {user_settings['start_hour']}:00 to {user_settings['end_hour']}:00\n"
                        f"User's timezone: {user_settings['timezone']}\n"
                        f"Schedule tasks within the next 7 days starting from today.\n\n"
                        "Consider:\n"
                        "- Task priority (high priority tasks should get better time slots)\n"
                        "- Task context/description for optimal time-of-day placement\n"
                        "- Don't overlap with existing calendar events (the busy slots list includes ALL existing events)\n"
                        "- Leave a 10-minute buffer between each scheduled task and between tasks and existing events\n"
                        "- Only schedule within the user's available hours\n\n"
                        "Respond with ONLY a JSON object: {\"scheduled\": [{\"task_id\": <int>, "
                        "\"start\": \"<ISO8601>\", \"end\": \"<ISO8601>\"}]}\n"
                        "If a task cannot be scheduled, omit it from the list."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Tasks to schedule:\n{tasks_desc}\n\nExisting busy events:\n{events_desc}",
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=2000,
        )

        result = json.loads(response.choices[0].message.content)
        return result.get("scheduled", [])
    except Exception as e:
        logger.warning("AI scheduling failed: %s", e)
        return []
