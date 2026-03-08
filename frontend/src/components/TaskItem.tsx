import { useState } from "react";
import { updateTask, deleteTask } from "../api/tasks";
import type { TaskUpdate } from "../api/tasks";
import type { Task, Priority } from "../types";

interface TaskItemProps {
  task: Task;
  onUpdated: () => void;
}

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export default function TaskItem({ task, onUpdated }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [duration, setDuration] = useState(task.duration_minutes);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [loading, setLoading] = useState(false);

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
      // revert on error
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
    setLoading(true);
    try {
      await deleteTask(task.id);
      onUpdated();
    } catch {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2 mb-2">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
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
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
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
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`w-2 h-2 rounded-full ${task.is_scheduled ? "bg-blue-500" : "bg-gray-400"}`}
        />
        <div>
          <p className="text-sm font-medium text-gray-900">{task.name}</p>
          <p className="text-xs text-gray-500">{task.duration_minutes} min</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        {task.context && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
            AI
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setEditing(true)}
          disabled={loading}
          className="px-2 py-1 text-xs text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
