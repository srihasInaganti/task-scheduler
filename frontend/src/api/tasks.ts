import client from "./client";
import type { Task, TaskCreate } from "../types";

export interface TaskUpdate {
  name?: string;
  duration_minutes?: number;
  priority?: "high" | "medium" | "low";
}

export async function getTasks(): Promise<Task[]> {
  const response = await client.get("/tasks/");
  return response.data;
}

export async function createTask(data: TaskCreate): Promise<Task> {
  const response = await client.post("/tasks/", data);
  return response.data;
}

export async function updateTask(id: number, data: TaskUpdate): Promise<Task> {
  const response = await client.put(`/tasks/${id}`, data);
  return response.data;
}

export async function deleteTask(id: number): Promise<void> {
  await client.delete(`/tasks/${id}`);
}
