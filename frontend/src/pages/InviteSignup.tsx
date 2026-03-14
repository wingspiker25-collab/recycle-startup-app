import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function InviteSignup() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<{ emailOrPhone: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }
    api<{ emailOrPhone: string; role: string }>(`/invites/${token}`)
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err || !data) {
          setError(err || "Invalid invite");
          return;
        }
        setInvite(data);
        setPhone(data.emailOrPhone.includes("@") ? "" : data.emailOrPhone);
        setEmail(data.emailOrPhone.includes("@") ? data.emailOrPhone : "");
      })
      .catch(() => {
        setLoading(false);
        setError("Failed to validate invite");
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !invite) return;
    setError("");
    setSubmitLoading(true);
    const { data, error: err } = await api<{ token: string; user: { id: string; name: string; phone: string; email: string | null; role: string } }>(
      "/auth/signup-with-invite",
      {
        method: "POST",
        body: JSON.stringify({ inviteToken: token, name, phone, email: email || undefined, password }),
      }
    );
    setSubmitLoading(false);
    if (err || !data) {
      setError(err || "Signup failed");
      return;
    }
    login(data.token, data.user as any);
    if (data.user.role === "admin" || data.user.role === "driver") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <p>Validating invite...</p>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 style={{ fontSize: "1.35rem", marginBottom: 8 }}>Invalid invite</h1>
          <p className="error">{error}</p>
          <a href="/login" className="link" style={{ display: "inline-block", marginTop: 16 }}>Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.35rem", marginBottom: 4 }}>Create your account</h1>
        <p className="section-hint" style={{ marginBottom: "1.5rem" }}>Invited as {invite.role}</p>
        <form onSubmit={handleSubmit}>
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
          <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="form-group">
          <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={submitLoading} className="btn btn-primary btn-lg">
            {submitLoading ? "Creating account..." : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
