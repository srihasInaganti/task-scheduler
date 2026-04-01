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
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-lavender-100 shadow-sm p-5">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-3 animate-scale-in border border-red-100">
          {error}
        </div>
      )}

      <div className="mb-3">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-lavender-200 rounded-lg px-4 py-2.5 text-sm bg-lavender-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent focus:bg-white"
          required
        />
      </div>

      {isAI ? (
        <div className="mb-3">
          <textarea
            placeholder="Add details to help AI schedule better... (optional)"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full border border-lavender-200 rounded-lg px-4 py-2.5 text-sm bg-lavender-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent focus:bg-white resize-none"
            rows={2}
          />
        </div>
      ) : (
        <div className="flex gap-2 mb-3">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="flex-1 border border-lavender-200 rounded-lg px-3 py-2.5 text-sm bg-lavender-50/50 focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent focus:bg-white cursor-pointer"
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
            className="flex-1 border border-lavender-200 rounded-lg px-3 py-2.5 text-sm bg-lavender-50/50 focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent focus:bg-white cursor-pointer"
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
        className="w-full bg-gradient-to-r from-lavender-600 to-lavender-700 text-white rounded-lg py-2.5 text-sm font-semibold hover:from-lavender-700 hover:to-lavender-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-press shadow-sm shadow-lavender-300/30 transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding...
          </span>
        ) : (
          "Add Task"
        )}
      </button>
    </form>
  );
}
