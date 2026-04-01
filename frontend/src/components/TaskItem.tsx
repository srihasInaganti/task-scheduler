import { useRef, useState } from "react";
import { updateTask, deleteTask } from "../api/tasks";
import type { TaskUpdate } from "../api/tasks";
import type { Task, Priority } from "../types";

interface TaskItemProps {
  task: Task;
  onUpdated: () => void;
}

const priorityStyles: Record<Priority, { badge: string; dot: string }> = {
  high: { badge: "bg-red-50 text-red-600 border border-red-100", dot: "bg-red-400" },
  medium: { badge: "bg-amber-50 text-amber-600 border border-amber-100", dot: "bg-amber-400" },
  low: { badge: "bg-emerald-50 text-emerald-600 border border-emerald-100", dot: "bg-emerald-400" },
};

export default function TaskItem({ task, onUpdated }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [duration, setDuration] = useState(task.duration_minutes);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates: TaskUpdate = {};
      if (name !== task.name) updates.name = name;
      if (duration !== task.duration_minutes) updates.duration_minutes = duration;
      if (priority !== task.priority) updates.priority = priority;

      if (Object.keys(updates).length > 0) {
        await updateTask(task.id, updates);
      }
      setEditing(false);
      onUpdated();
    } catch {
      setName(task.name);
      setDuration(task.duration_minutes);
      setPriority(task.priority);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;

    // Play pop-out animation first
    setDeleting(true);

    // Wait for animation, then do the actual delete
    setTimeout(async () => {
      setLoading(true);
      try {
        await deleteTask(task.id);
        onUpdated();
      } catch {
        setDeleting(false);
        setLoading(false);
      }
    }, 350);
  };

  if (editing) {
    return (
      <div className="bg-card border border-lavender-200 rounded-xl p-4 animate-scale-in">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-lavender-200 rounded-lg px-3 py-2 text-sm mb-3 bg-lavender-50/50 focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent"
        />
        <div className="flex gap-2 mb-3">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="flex-1 border border-lavender-200 rounded-lg px-3 py-2 text-sm bg-lavender-50/50 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer"
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
            className="flex-1 border border-lavender-200 rounded-lg px-3 py-2 text-sm bg-lavender-50/50 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-1.5 text-sm bg-gradient-to-r from-lavender-600 to-lavender-700 text-white rounded-lg font-medium hover:from-lavender-700 hover:to-lavender-800 disabled:opacity-50 btn-press cursor-pointer transition-all"
          >
            Save
          </button>
          <button
            onClick={() => {
              setName(task.name);
              setDuration(task.duration_minutes);
              setPriority(task.priority);
              setEditing(false);
            }}
            className="px-4 py-1.5 text-sm bg-lavender-100 text-lavender-700 rounded-lg font-medium hover:bg-lavender-200 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={itemRef}
      className={`bg-card border border-lavender-100 rounded-xl p-4 flex items-center justify-between card-hover group ${
        deleting ? "task-pop-out" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <span
            className={`block w-2.5 h-2.5 rounded-full transition-all ${
              task.is_scheduled ? "bg-lavender-500 shadow-sm shadow-lavender-300" : "bg-gray-300"
            }`}
          />
          {task.is_scheduled && (
            <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-lavender-500 animate-ping opacity-20" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{task.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{task.duration_minutes} min</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${priorityStyles[task.priority].badge}`}>
            {task.priority}
          </span>
          {task.context && (
            <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-lavender-100 text-lavender-600 border border-lavender-200">
              AI
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          disabled={loading || deleting}
          className="p-1.5 text-gray-400 hover:text-lavender-600 hover:bg-lavender-50 rounded-lg cursor-pointer transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || deleting}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
