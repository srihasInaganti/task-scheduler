export type Priority = "high" | "medium" | "low";
export type SchedulingMode = "normal" | "ai";

export interface User {
  id: number;
  email: string;
  name: string;
  picture_url: string;
  available_start_hour: number;
  available_end_hour: number;
  timezone: string;
  scheduling_mode: SchedulingMode;
  focus_start_hour: number | null;
  focus_end_hour: number | null;
  buffer_minutes: number;
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
  context: string | null;
  created_at: string;
}

export interface TaskCreate {
  name: string;
  duration_minutes?: number;
  priority?: Priority;
  context?: string;
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
