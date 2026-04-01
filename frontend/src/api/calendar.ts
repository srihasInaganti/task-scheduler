import client from "./client";
import type { CalendarEvent } from "../types";

export async function getCalendarEvents(start?: string, end?: string): Promise<CalendarEvent[]> {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  const response = await client.get("/calendar/events", { params });
  return response.data;
}
