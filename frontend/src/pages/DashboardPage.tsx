import { useCallback, useEffect, useState } from "react";
import { getTasks } from "../api/tasks";
import { useAuth } from "../context/AuthContext";
import type { Task } from "../types";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import CalendarView from "../components/CalendarView";
import ScheduleButton from "../components/ScheduleButton";

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch {
      // handled by axios interceptor for 401
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await fetchTasks();
    setCalendarRefreshKey((k) => k + 1);
  }, [fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel — Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
            {user?.scheduling_mode === "ai" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                AI Mode
              </span>
            )}
          </div>
          <TaskForm onTaskCreated={refreshAll} />
          <ScheduleButton onScheduleChanged={refreshAll} />
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">Loading tasks...</p>
          ) : (
            <TaskList tasks={tasks} onUpdated={refreshAll} />
          )}
        </div>

        {/* Right panel — Calendar */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar</h2>
          <CalendarView refreshKey={calendarRefreshKey} />
        </div>
      </div>
    </div>
  );
}
