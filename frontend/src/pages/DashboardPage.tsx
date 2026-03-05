export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel — Tasks */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
          <p className="text-gray-500">Task management coming in Phase 4.</p>
        </div>

        {/* Right panel — Calendar */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400">
            Calendar coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
