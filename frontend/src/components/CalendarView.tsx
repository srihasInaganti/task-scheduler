import { useCallback, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type EventDropArg, type EventResizeDoneArg } from "@fullcalendar/interaction";
import { getCalendarEvents } from "../api/calendar";
import { rescheduleTask } from "../api/schedule";
import type { CalendarEvent } from "../types";
import { useAuth } from "../context/AuthContext";

interface CalendarViewProps {
  refreshKey?: number;
  onEventRescheduled?: () => void;
}

export default function CalendarView({ refreshKey, onEventRescheduled }: CalendarViewProps) {
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
    editable: e.source === "task_placer",
    extendedProps: { source: e.source },
  }));

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const { event } = info;
      const source = event.extendedProps?.source;

      if (source !== "task_placer") {
        info.revert();
        return;
      }

      const taskId = parseInt(event.id, 10);
      const start = event.start?.toISOString();
      const end = event.end?.toISOString();

      if (!start || !end || isNaN(taskId)) {
        info.revert();
        return;
      }

      try {
        await rescheduleTask(taskId, start, end);
        // Update local state so the event stays in its new position
        setEvents((prev) =>
          prev.map((e) =>
            e.id === String(taskId) ? { ...e, start, end } : e
          )
        );
        onEventRescheduled?.();
      } catch {
        info.revert();
      }
    },
    [onEventRescheduled]
  );

  const handleEventResize = useCallback(
    async (info: EventResizeDoneArg) => {
      const { event } = info;
      const source = event.extendedProps?.source;

      if (source !== "task_placer") {
        info.revert();
        return;
      }

      const taskId = parseInt(event.id, 10);
      const start = event.start?.toISOString();
      const end = event.end?.toISOString();

      if (!start || !end || isNaN(taskId)) {
        info.revert();
        return;
      }

      try {
        await rescheduleTask(taskId, start, end);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === String(taskId) ? { ...e, start, end } : e
          )
        );
        onEventRescheduled?.();
      } catch {
        info.revert();
      }
    },
    [onEventRescheduled]
  );

  const startHour = user?.available_start_hour ?? 9;
  const endHour = user?.available_end_hour ?? 17;
  const focusStart = user?.focus_start_hour;
  const focusEnd = user?.focus_end_hour;
  const hasFocus = focusStart != null && focusEnd != null && focusStart < focusEnd;

  // Generate background events for focus time blocks across visible days
  const focusBackgroundEvents = hasFocus
    ? Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 7 + i);
        const dateStr = date.toISOString().split("T")[0];
        return {
          id: `focus-${dateStr}`,
          start: `${dateStr}T${String(focusStart).padStart(2, "0")}:00:00`,
          end: `${dateStr}T${String(focusEnd).padStart(2, "0")}:00:00`,
          display: "background" as const,
          backgroundColor: "#eef2ff",
          borderColor: "transparent",
        };
      })
    : [];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {loading && (
        <p className="text-gray-400 text-sm text-center py-2">Loading calendar...</p>
      )}
      {hasFocus && (
        <div className="flex items-center gap-2 mb-2 text-xs text-indigo-600">
          <span className="inline-block w-3 h-3 rounded bg-indigo-50 border border-indigo-200" />
          Focus Time ({String(focusStart).padStart(2, "0")}:00 – {String(focusEnd).padStart(2, "0")}:00)
        </div>
      )}
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        slotMinTime={`${String(startHour).padStart(2, "0")}:00:00`}
        slotMaxTime={`${String(endHour).padStart(2, "0")}:00:00`}
        nowIndicator={true}
        events={[...calendarEvents, ...focusBackgroundEvents]}
        height="auto"
        allDaySlot={false}
        editable={true}
        droppable={false}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventDurationEditable={true}
      />
    </div>
  );
}
