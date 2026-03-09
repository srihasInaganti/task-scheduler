from datetime import datetime

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def fetch_events(
    credentials: Credentials, time_min: datetime, time_max: datetime
) -> list[dict]:
    service = build("calendar", "v3", credentials=credentials)
    events_result = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=time_min.isoformat() + "Z",
            timeMax=time_max.isoformat() + "Z",
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    return events_result.get("items", [])


def create_event(
    credentials: Credentials, summary: str, start: datetime, end: datetime
) -> str:
    service = build("calendar", "v3", credentials=credentials)
    event_body = {
        "summary": f"[Task Placer] {summary}",
        "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
    }
    event = service.events().insert(calendarId="primary", body=event_body).execute()
    return event["id"]


def update_event(
    credentials: Credentials, event_id: str, start: datetime, end: datetime
) -> None:
    service = build("calendar", "v3", credentials=credentials)
    event_body = {
        "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
    }
    service.events().patch(
        calendarId="primary", eventId=event_id, body=event_body
    ).execute()


def delete_event(credentials: Credentials, event_id: str) -> None:
    service = build("calendar", "v3", credentials=credentials)
    try:
        service.events().delete(calendarId="primary", eventId=event_id).execute()
    except HttpError as e:
        if e.resp.status != 404:
            raise
