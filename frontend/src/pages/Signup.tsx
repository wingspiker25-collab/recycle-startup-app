import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Signup() {
  const [step, setStep] = useState<"send" | "verify">("send");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: err } = await api<{ message: string }>(
      "/auth/send-otp",
      {
        method: "POST",
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() }),
      }
    );
    setLoading(false);
    if (err || !data) {
      setError(err || "Failed to send OTP");
      return;
    }
    setStep("verify");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: err } = await api<{ token: string; user: { id: string; name: string; phone: string; email: string | null; username: string; role: string } }>(
      "/auth/signup-with-otp",
      {
        method: "POST",
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim(), otp, name, username, password }),
      }
    );
    setLoading(false);
    if (err || !data) {
      setError(err || "Signup failed");
      return;
    }
    login(data.token, data.user as any);
    navigate("/");
  }

  if (step === "send") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>♻ Reforge Pickup</h1>
          <p className="section-hint" style={{ marginBottom: "1.5rem" }}>Create your account</p>
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Email or Phone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            Already have an account? <a href="/login" className="link">Log in</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>♻ Reforge Pickup</h1>
        <p className="section-hint" style={{ marginBottom: "1.5rem" }}>Enter OTP and details</p>
        <form onSubmit={handleVerifyOtp}>
          <div className="form-group">
            <input
              type="text"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          <button type="button" onClick={() => setStep("send")} className="link">Back</button>
        </p>
      </div>
    </div>
  );
}