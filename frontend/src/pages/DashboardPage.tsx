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

  const scheduledCount = tasks.filter((t) => t.is_scheduled).length;
  const unscheduledCount = tasks.filter((t) => !t.is_scheduled).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-6 animate-slide-down">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-xl font-bold text-lavender-900 tracking-tight">Dashboard</h2>
          {user?.scheduling_mode === "ai" && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gradient-to-r from-lavender-500 to-lavender-600 text-white shadow-sm">
              AI Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-lg border border-lavender-100">
            <span className="w-2 h-2 rounded-full bg-lavender-500" />
            <span className="text-lavender-700 font-medium">{scheduledCount}</span>
            <span className="text-gray-400">scheduled</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-lg border border-lavender-100">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-gray-600 font-medium">{unscheduledCount}</span>
            <span className="text-gray-400">pending</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel — Tasks */}
        <div className="lg:col-span-2 space-y-4 animate-slide-up">
          <TaskForm onTaskCreated={refreshAll} />
          <ScheduleButton onScheduleChanged={refreshAll} />
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl p-4 animate-shimmer border border-lavender-100">
                  <div className="h-4 bg-lavender-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-lavender-50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <TaskList tasks={tasks} onUpdated={refreshAll} />
          )}
        </div>

        {/* Right panel — Calendar */}
        <div className="lg:col-span-3 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CalendarView refreshKey={calendarRefreshKey} onEventRescheduled={fetchTasks} />
        </div>
      </div>
    </div>
  );
}
