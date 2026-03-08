import { useState } from "react";
import { createTask } from "../api/tasks";
import { useAuth } from "../context/AuthContext";
import type { Priority } from "../types";

interface TaskFormProps {
  onTaskCreated: () => void;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const { user } = useAuth();
  const isAI = user?.scheduling_mode === "ai";

  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [priority, setPriority] = useState<Priority>("medium");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    try {
      if (isAI) {
        await createTask({
          name: name.trim(),
          context: context.trim() || undefined,
        });
      } else {
        await createTask({
          name: name.trim(),
          duration_minutes: duration,
          priority,
        });
      }
      setName("");
      setDuration(30);
      setPriority("medium");
      setContext("");
      onTaskCreated();
    } catch {
      setError("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-4">
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      {isAI ? (
        <div className="mb-3">
          <textarea
            placeholder="Add details to help AI schedule better... (optional)"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={2}
          />
        </div>
      ) : (
        <div className="flex gap-3 mb-3">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
            <option value={120}>120 min</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}
