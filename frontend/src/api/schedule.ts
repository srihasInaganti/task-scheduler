import client from "./client";
import type { ScheduleResult } from "../types";

export async function runSchedule(): Promise<ScheduleResult> {
  const { data } = await client.post<ScheduleResult>("/schedule/run");
  return data;
}

export async function clearSchedule(): Promise<void> {
  await client.delete("/schedule/clear");
}
