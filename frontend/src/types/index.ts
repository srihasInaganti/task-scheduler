export type Priority = "high" | "medium" | "low";

export interface User {
  id: number;
  email: string;
  name: string;
  picture_url: string;
  available_start_hour: number;
  available_end_hour: number;
  timezone: string;
}

export interface Task {
  id: number;
  name: string;
  duration_minutes: number;
  priority: Priority;
  is_scheduled: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  google_event_id: string | null;
  created_at: string;
}

export interface TaskCreate {
  name: string;
  duration_minutes: number;
  priority: Priority;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source: "task_placer" | "google_calendar";
}

export interface ScheduleResult {
  scheduled: Task[];
  unscheduled: Task[];
  message: string;
}
