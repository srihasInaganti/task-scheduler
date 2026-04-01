import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type EventDropArg, type EventResizeDoneArg } from "@fullcalendar/interaction";
import type { DatesSetArg } from "@fullcalendar/core";
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

  // Track which event IDs existed before refresh so we can animate only new ones
  const prevEventIdsRef = useRef<Set<string>>(new Set());
  const newEventIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const popIndexRef = useRef(0);

  // Track the current visible date range
  const visibleRangeRef = useRef<{ start: string; end: string } | null>(null);
  const prevRefreshKeyRef = useRef(refreshKey);

  const fetchEvents = useCallback(async (start?: string, end?: string) => {
    try {
      setLoading(true);
      const data = await getCalendarEvents(start, end);

      // Determine which events are newly added (not on initial load)
      if (!isInitialLoadRef.current) {
        const prevIds = prevEventIdsRef.current;
        const newIds = new Set<string>();
        for (const ev of data) {
          if (!prevIds.has(ev.id)) {
            newIds.add(ev.id);
          }
        }
        newEventIdsRef.current = newIds;
        popIndexRef.current = 0;
      } else {
        newEventIdsRef.current = new Set();
        isInitialLoadRef.current = false;
      }

      // Update prev IDs for next comparison
      prevEventIdsRef.current = new Set(data.map((e) => e.id));
      setEvents(data);
    } catch {
      // handled by axios interceptor for 401
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when refreshKey changes (e.g. after scheduling) — skip the initial mount
  useEffect(() => {
    if (prevRefreshKeyRef.current !== refreshKey) {
      prevRefreshKeyRef.current = refreshKey;
      const range = visibleRangeRef.current;
      fetchEvents(range?.start, range?.end);
    }
  }, [fetchEvents, refreshKey]);

  // Called by FullCalendar when the visible date range changes (initial mount + prev/next week)
  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const start = arg.start.toISOString();
      const end = arg.end.toISOString();
      visibleRangeRef.current = { start, end };
      fetchEvents(start, end);
    },
    [fetchEvents]
  );

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.source === "task_placer" ? "#8b5cf6" : "#d1d5db",
    borderColor: e.source === "task_placer" ? "#7c3aed" : "#9ca3af",
    textColor: e.source === "task_placer" ? "#ffffff" : "#374151",
    editable: e.source === "task_placer",
    extendedProps: { source: e.source },
  }));

  // Animate newly added events when they mount in the DOM
  const handleEventDidMount = useCallback((info: { event: { id: string }; el: HTMLElement }) => {
    if (newEventIdsRef.current.has(info.event.id)) {
      const idx = popIndexRef.current++;
      info.el.classList.add("fc-event-pop-in");
      info.el.setAttribute("data-pop-delay", String(Math.min(idx, 9)));

      // Clean up classes after animation completes
      const cleanup = () => {
        info.el.classList.remove("fc-event-pop-in");
        info.el.removeAttribute("data-pop-delay");
      };
      info.el.addEventListener("animationend", cleanup, { once: true });
      // Fallback cleanup
      setTimeout(cleanup, 2500);
    }
  }, []);

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
          backgroundColor: "rgba(139, 92, 246, 0.06)",
          borderColor: "transparent",
        };
      })
    : [];

  return (
    <div className="bg-card rounded-xl border border-lavender-100 shadow-sm p-5">
      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-lavender-400 text-sm animate-pulse-soft">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading calendar...
        </div>
      )}
      {hasFocus && (
        <div className="flex items-center gap-2 mb-3 text-xs text-lavender-500 font-medium">
          <span className="inline-block w-3 h-3 rounded bg-lavender-100 border border-lavender-200" />
          Focus Time ({String(focusStart).padStart(2, "0")}:00 - {String(focusEnd).padStart(2, "0")}:00)
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
        eventDidMount={handleEventDidMount}
        datesSet={handleDatesSet}
      />
    </div>
  );
}
