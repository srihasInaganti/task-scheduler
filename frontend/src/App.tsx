import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

interface User {
  name: string;
  email: string;
  picture_url: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth callback: /auth/callback?token=...
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", "/");
    }

    const stored = localStorage.getItem("token");
    if (!stored) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleLogin() {
    fetch(`${API_URL}/auth/login`)
      .then((res) => res.json())
      .then((data) => {
        window.location.href = data.url;
      });
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Task Placer</h1>
      {user ? (
        <div>
          <p>Hi, {user.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Sign in with Google</button>
      )}
    </div>
  );
}

export default App;
