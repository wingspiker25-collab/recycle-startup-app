import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: err } = await api<{ token: string; user: { id: string; name: string; phone: string; email: string | null; username: string; role: string } }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      }
    );
    setLoading(false);
    if (err || !data) {
      setError(err || "Login failed");
      return;
    }
    login(data.token, data.user as any);
    if (data.user.role === "admin" || data.user.role === "driver") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>♻ Recycle Pickup</h1>
        <p className="section-hint" style={{ marginBottom: "1.5rem" }}>Log in to your account</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          Don't have an account? <a href="/signup" className="link">Sign up</a>
        </p>
      </div>
    </div>
  );
}
