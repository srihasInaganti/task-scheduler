import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900 no-underline">
          Task Placer
        </Link>

        <div className="flex items-center gap-4">
          {user.picture_url && (
            <img
              src={user.picture_url}
              alt={user.name}
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-sm text-gray-700">{user.name}</span>
          <Link
            to="/settings"
            className="text-sm text-gray-500 hover:text-gray-700 no-underline"
          >
            Settings
          </Link>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
