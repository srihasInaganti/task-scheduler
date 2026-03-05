import type { Task } from "../types";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onUpdated: () => void;
}

export default function TaskList({ tasks, onUpdated }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No tasks yet. Add one above!
      </div>
    );
  }

  return (
    <div>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onUpdated={onUpdated} />
      ))}
    </div>
  );
}
