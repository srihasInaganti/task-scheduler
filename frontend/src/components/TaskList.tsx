import type { Task } from "../types";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onUpdated: () => void;
}

export default function TaskList({ tasks, onUpdated }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-lavender-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-lavender-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">No tasks yet</p>
        <p className="text-gray-300 text-xs mt-1">Add one above to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, i) => (
        <div key={task.id} className="stagger-item animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
          <TaskItem task={task} onUpdated={onUpdated} />
        </div>
      ))}
    </div>
  );
}
