import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function Login() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/";

  async function handleLogin() {
    await loginWithGoogle();
    navigate(from, { replace: true });
  }

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Sign in</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Use Google to sync your data across devices.
      </p>

      <button
        onClick={handleLogin}
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #111",
          background: "#111",
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
          width: "100%",
          marginTop: 12,
        }}
      >
        Continue with Google
      </button>

      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
        Your transactions will be stored privately in your Firebase account.
      </div>
    </div>
  );
}
