import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateSettings } from "../api/auth";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [startHour, setStartHour] = useState(user?.available_start_hour ?? 9);
  const [endHour, setEndHour] = useState(user?.available_end_hour ?? 17);
  const [timezone, setTimezone] = useState(user?.timezone ?? "America/New_York");
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
