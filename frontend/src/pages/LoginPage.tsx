import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="animate-scale-in bg-card rounded-2xl shadow-lg shadow-lavender-200/50 p-10 max-w-sm w-full text-center border border-lavender-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-500 to-lavender-700 flex items-center justify-center mx-auto mb-5 shadow-md shadow-lavender-300/40">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-lavender-900 mb-1.5 tracking-tight">Task Placer</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Automatically schedule your tasks around your calendar.
        </p>
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-card border border-lavender-200 rounded-xl px-4 py-3.5 text-gray-700 font-medium hover:bg-lavender-50 hover:border-lavender-300 hover:shadow-md transition-all cursor-pointer btn-press"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
