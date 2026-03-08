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
    <div className="mb-4">
      <div className="flex gap-2">
        <button
          onClick={handleSchedule}
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Working..." : "Schedule Tasks"}
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          className="px-4 bg-red-100 text-red-700 rounded-md py-2 text-sm font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
      {message && (
        <p
          className={`text-sm mt-2 ${
            message.includes("Failed") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
