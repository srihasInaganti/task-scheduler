import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateSettings } from "../api/auth";
import type { SchedulingMode } from "../types";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [startHour, setStartHour] = useState(user?.available_start_hour ?? 9);
  const [endHour, setEndHour] = useState(user?.available_end_hour ?? 17);
  const [timezone, setTimezone] = useState(user?.timezone ?? "America/New_York");
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>(
    user?.scheduling_mode ?? "normal"
  );
  const [bufferMinutes, setBufferMinutes] = useState(user?.buffer_minutes ?? 10);
  const [focusEnabled, setFocusEnabled] = useState(
    user?.focus_start_hour != null && user?.focus_end_hour != null
  );
  const [focusStartHour, setFocusStartHour] = useState(user?.focus_start_hour ?? 9);
  const [focusEndHour, setFocusEndHour] = useState(user?.focus_end_hour ?? 12);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateSettings({
        available_start_hour: startHour,
        available_end_hour: endHour,
        timezone,
        scheduling_mode: schedulingMode,
        focus_start_hour: focusEnabled ? focusStartHour : null,
        focus_end_hour: focusEnabled ? focusEndHour : null,
        buffer_minutes: bufferMinutes,
      });
      setUser(updated);
      setMessage("Settings saved!");
    } catch {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "Pacific/Honolulu",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney",
    "UTC",
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Start Hour
          </label>
          <select
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available End Hour
          </label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buffer Between Tasks
          </label>
          <select
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {[0, 5, 10, 15, 30].map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "No buffer" : `${m} minutes`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Time gap between consecutive scheduled tasks.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Focus Time
            </label>
            <button
              type="button"
              onClick={() => setFocusEnabled(!focusEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                focusEnabled ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  focusEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Reserve a daily window for deep work. High-priority and long tasks get placed here first.
          </p>
          {focusEnabled && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start</label>
                <select
                  value={focusStartHour}
                  onChange={(e) => setFocusStartHour(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End</label>
                <select
                  value={focusEndHour}
                  onChange={(e) => setFocusEndHour(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Scheduling Mode
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="scheduling_mode"
                value="normal"
                checked={schedulingMode === "normal"}
                onChange={() => setSchedulingMode("normal")}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Normal</p>
                <p className="text-xs text-gray-500">
                  Greedy algorithm — schedules by priority, fills earliest available slots
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="scheduling_mode"
                value="ai"
                checked={schedulingMode === "ai"}
                onChange={() => setSchedulingMode("ai")}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">AI-Powered</p>
                <p className="text-xs text-gray-500">
                  LLM-powered — infers task duration/priority and optimizes placement intelligently
                </p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {message && (
          <p
            className={`text-sm text-center ${
              message.includes("Failed") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
