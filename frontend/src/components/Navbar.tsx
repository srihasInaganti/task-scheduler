import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isSettings = location.pathname === "/settings";

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-lavender-200/50 px-6 py-3 sticky top-0 z-50 animate-slide-down">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lavender-500 to-lavender-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-lg font-bold text-lavender-900 tracking-tight">Task Placer</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-all ${
              !isSettings
                ? "bg-lavender-100 text-lavender-700"
                : "text-gray-500 hover:text-lavender-700 hover:bg-lavender-50"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/settings"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-all ${
              isSettings
                ? "bg-lavender-100 text-lavender-700"
                : "text-gray-500 hover:text-lavender-700 hover:bg-lavender-50"
            }`}
          >
            Settings
          </Link>

          <div className="w-px h-6 bg-lavender-200 mx-2" />

          <div className="flex items-center gap-2.5">
            {user.picture_url && (
              <img
                src={user.picture_url}
                alt={user.name}
                className="w-8 h-8 rounded-full ring-2 ring-lavender-200 ring-offset-1"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
          </div>

          <button
            onClick={logout}
            className="ml-1 px-3 py-1.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
