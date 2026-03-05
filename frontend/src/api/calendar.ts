import client from "./client";
import type { CalendarEvent } from "../types";

export async function getCalendarEvents(days: number = 7): Promise<CalendarEvent[]> {
  const response = await client.get("/calendar/events", { params: { days } });
  return response.data;
}
