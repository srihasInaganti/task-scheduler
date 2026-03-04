import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setError("Could not reach backend"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Task Placer</h1>
      <h2>Backend health check</h2>
      {status && <p style={{ color: "green" }}>Backend status: {status}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!status && !error && <p>Checking...</p>}
    </div>
  );
}

export default App;
