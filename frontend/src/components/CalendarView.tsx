import { useCallback, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getCalendarEvents } from "../api/calendar";
import type { CalendarEvent } from "../types";
import { useAuth } from "../context/AuthContext";

interface CalendarViewProps {
  refreshKey?: number;
}

export default function CalendarView({ refreshKey }: CalendarViewProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCalendarEvents(7);
      setEvents(data);
    } catch {
      // handled by axios interceptor for 401
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.source === "task_placer" ? "#4f46e5" : "#9ca3af",
    borderColor: e.source === "task_placer" ? "#4338ca" : "#6b7280",
  }));

  const startHour = user?.available_start_hour ?? 9;
  const endHour = user?.available_end_hour ?? 17;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {loading && (
        <p className="text-gray-400 text-sm text-center py-2">Loading calendar...</p>
      )}
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        slotMinTime={`${String(startHour).padStart(2, "0")}:00:00`}
        slotMaxTime={`${String(endHour).padStart(2, "0")}:00:00`}
        nowIndicator={true}
        events={calendarEvents}
        height="auto"
        allDaySlot={false}
      />
    </div>
  );
}
