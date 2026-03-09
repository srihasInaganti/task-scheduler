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
    scheduling_mode: str
    focus_start_hour: Optional[int]
    focus_end_hour: Optional[int]
    buffer_minutes: int

    class Config:
        from_attributes = True


class UserSettings(BaseModel):
    available_start_hour: int
    available_end_hour: int
    timezone: str
    scheduling_mode: Optional[Literal["normal", "ai"]] = None
    focus_start_hour: Optional[int] = None
    focus_end_hour: Optional[int] = None
    buffer_minutes: Optional[int] = None


class TaskCreate(BaseModel):
    name: str
    duration_minutes: Optional[int] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    context: Optional[str] = None


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
    context: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class RescheduleRequest(BaseModel):
    start: datetime
    end: datetime


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
