from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    picture_url: Optional[str]
    available_start_hour: int
    available_end_hour: int
    timezone: str

    class Config:
        from_attributes = True


class UserSettings(BaseModel):
    available_start_hour: int
    available_end_hour: int
    timezone: str


class TaskCreate(BaseModel):
    name: str
    duration_minutes: int
    priority: Literal["high", "medium", "low"]


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    is_scheduled: Optional[bool] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    google_event_id: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    name: str
    duration_minutes: int
    priority: str
    is_scheduled: bool
    scheduled_start: Optional[datetime]
    scheduled_end: Optional[datetime]
    google_event_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CalendarEventResponse(BaseModel):
    id: str
    title: str
    start: str
    end: str
    source: Literal["task_placer", "google_calendar"]


class ScheduleResultResponse(BaseModel):
    scheduled: list[TaskResponse]
    unscheduled: list[TaskResponse]
    message: str
