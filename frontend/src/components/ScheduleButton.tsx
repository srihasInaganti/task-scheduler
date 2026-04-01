import { useState } from "react";
import { runSchedule, clearSchedule } from "../api/schedule";

interface ScheduleButtonProps {
  onScheduleChanged: () => void;
}

export default function ScheduleButton({ onScheduleChanged }: ScheduleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSchedule = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await runSchedule();
      setMessage(result.message);
      onScheduleChanged();
    } catch {
      setMessage("Failed to schedule tasks.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    setMessage("");
    try {
      await clearSchedule();
      setMessage("Schedule cleared.");
      onScheduleChanged();
    } catch {
      setMessage("Failed to clear schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={handleSchedule}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-lavender-600 to-lavender-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:from-lavender-700 hover:to-lavender-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-press shadow-sm shadow-lavender-300/30 transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Working...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Tasks
            </span>
          )}
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          className="px-4 bg-red-50 text-red-500 border border-red-100 rounded-xl py-2.5 text-sm font-medium hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-press transition-all"
        >
          Clear
        </button>
      </div>
      {message && (
        <div
          className={`text-sm mt-2 px-3 py-2 rounded-lg toast-enter ${
            message.includes("Failed")
              ? "bg-red-50 text-red-600 border border-red-100"
              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
