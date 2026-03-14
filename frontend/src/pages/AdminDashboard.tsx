import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminInvites from "../components/admin/AdminInvites";
import AdminUsers from "../components/admin/AdminUsers";
import AdminPickups from "../components/admin/AdminPickups";
import AdminRates from "../components/admin/AdminRates";

type Tab = "pickups" | "users" | "invites" | "rates";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("pickups");

  return (
    <div className="page">
      <header className="header">
        <h1 className="logo">Admin Dashboard</h1>
        <nav className="nav">
          <a href="/" className="nav-link">User view</a>
          <span className="user-name">{user?.name}</span>
          <button onClick={logout} className="btn btn-ghost">Log out</button>
        </nav>
      </header>
      <nav className="admin-nav">
        {(["pickups", "users", "invites", "rates"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "admin-nav-btn active" : "admin-nav-btn"}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>
      <main className="main admin-main">
        {tab === "pickups" && <AdminPickups />}
        {tab === "users" && <AdminUsers />}
        {tab === "invites" && <AdminInvites />}
        {tab === "rates" && <AdminRates />}
      </main>
    </div>
  );
}
