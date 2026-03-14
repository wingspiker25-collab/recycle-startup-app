import React, { useState } from "react";
import { api } from "../../api/client";

export default function AdminInvites() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [role, setRole] = useState<"user" | "driver">("user");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inviteLink: string } | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    const { data, error: err } = await api<{ inviteLink: string }>("/admin/invites", {
      method: "POST",
      body: JSON.stringify({ emailOrPhone: emailOrPhone.trim(), role }),
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (data) setResult(data);
  }

  return (
    <div>
      <h2>Create Invite</h2>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: 16 }}>
        Share the invite link with new users. Only people with a valid link can sign up.
      </p>
      <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
        <input
          type="text"
          placeholder="Phone or email"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "user" | "driver")}
          style={{ padding: 8 }}
        >
          <option value="user">User</option>
          <option value="driver">Driver</option>
        </select>
        {error && <p style={{ color: "#c00", margin: 0 }}>{error}</p>}
        {result && (
          <div style={{ padding: 12, background: "#e8f5e9", borderRadius: 6 }}>
            <strong>Invite link created. Share this:</strong>
            <p style={{ margin: "8px 0 0", wordBreak: "break-all" }}>{result.inviteLink}</p>
          </div>
        )}
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Creating..." : "Create invite"}
        </button>
      </form>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.75rem",
  background: "#0a7c42",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  alignSelf: "flex-start",
};
