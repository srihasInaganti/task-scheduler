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

  const selectClass =
    "w-full border border-lavender-200 rounded-lg px-3 py-2.5 text-sm bg-lavender-50/50 focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent focus:bg-white cursor-pointer transition-all";

  return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-card rounded-2xl border border-lavender-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-500 to-lavender-700 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-lavender-900 tracking-tight">Settings</h2>
            <p className="text-sm text-gray-400">Customize your scheduling preferences</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Availability */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-lavender-700 uppercase tracking-wider">Availability</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Start Hour</label>
                <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} className={selectClass}>
                  {hours.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">End Hour</label>
                <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))} className={selectClass}>
                  {hours.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectClass}>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Buffer Between Tasks</label>
              <select value={bufferMinutes} onChange={(e) => setBufferMinutes(Number(e.target.value))} className={selectClass}>
                {[0, 5, 10, 15, 30].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} minutes`}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5">Time gap between consecutive scheduled tasks.</p>
            </div>
          </div>

          {/* Focus Time */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-lavender-700 uppercase tracking-wider">Focus Time</h3>
              <button
                type="button"
                onClick={() => setFocusEnabled(!focusEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  focusEnabled ? "bg-lavender-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    focusEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Reserve a daily window for deep work. High-priority and long tasks get placed here first.
            </p>
            {focusEnabled && (
              <div className="flex gap-3 animate-slide-up">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                  <select value={focusStartHour} onChange={(e) => setFocusStartHour(Number(e.target.value))} className={selectClass}>
                    {hours.map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <select value={focusEndHour} onChange={(e) => setFocusEndHour(Number(e.target.value))} className={selectClass}>
                    {hours.map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Scheduling Mode */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-lavender-700 uppercase tracking-wider">Scheduling Mode</h3>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  schedulingMode === "normal"
                    ? "border-lavender-300 bg-lavender-50/80 shadow-sm"
                    : "border-lavender-100 hover:border-lavender-200 hover:bg-lavender-50/30"
                }`}
              >
                <input
                  type="radio"
                  name="scheduling_mode"
                  value="normal"
                  checked={schedulingMode === "normal"}
                  onChange={() => setSchedulingMode("normal")}
                  className="mt-0.5 accent-lavender-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Normal</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Greedy algorithm -- schedules by priority, fills earliest available slots
                  </p>
                </div>
              </label>
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  schedulingMode === "ai"
                    ? "border-lavender-300 bg-lavender-50/80 shadow-sm"
                    : "border-lavender-100 hover:border-lavender-200 hover:bg-lavender-50/30"
                }`}
              >
                <input
                  type="radio"
                  name="scheduling_mode"
                  value="ai"
                  checked={schedulingMode === "ai"}
                  onChange={() => setSchedulingMode("ai")}
                  className="mt-0.5 accent-lavender-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    AI-Powered
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-lavender-500 to-lavender-600 text-white font-semibold leading-none">
                      PRO
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    LLM-powered -- infers task duration/priority and optimizes placement intelligently
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-lavender-600 to-lavender-700 text-white rounded-xl px-4 py-3 font-semibold hover:from-lavender-700 hover:to-lavender-800 disabled:opacity-50 cursor-pointer btn-press shadow-sm shadow-lavender-300/30 transition-all"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </button>

          {message && (
            <div
              className={`text-sm text-center px-3 py-2.5 rounded-lg toast-enter ${
                message.includes("Failed")
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-100"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
