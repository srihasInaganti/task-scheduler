import client from "./client";
import type { User, SchedulingMode } from "../types";

interface UserSettings {
  available_start_hour: number;
  available_end_hour: number;
  timezone: string;
  scheduling_mode?: SchedulingMode;
}

export async function getLoginUrl(): Promise<string> {
  const { data } = await client.get<{ url: string }>("/auth/login");
  return data.url;
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>("/auth/me");
  return data;
}

export async function updateSettings(settings: UserSettings): Promise<User> {
  const { data } = await client.put<User>("/auth/settings", settings);
  return data;
}
