import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleCallback(token);
    }
  }, [searchParams, handleCallback]);

  useEffect(() => {
    if (!searchParams.get("token")) return;
    // Small delay to let localStorage and state settle before navigating
    const timeout = setTimeout(() => navigate("/", { replace: true }), 100);
    return () => clearTimeout(timeout);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  );
}
