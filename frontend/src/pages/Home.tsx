import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

interface Notification {
  id: string;
  message: string;
  pickupStatus: string;
  scheduledAt: string | null;
  updatedAt: string;
  addressText: string;
}

interface Pickup {
  id: string;
  addressText: string;
  pickupStatus: string;
  totalWeightKg: number;
  estimatedAmount: number;
  finalAmountPaid: number | null;
  createdAt: string;
}

export default function Home() {
  const { user, logout } = useAuth();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api<Pickup[]>("/pickups").then(({ data }) => {
      if (data) {
        setPickups(data);
        const pickedUp = data.filter((p) => p.pickupStatus === "picked_up");
        setTotalWeight(pickedUp.reduce((s, p) => s + p.totalWeightKg, 0));
        setTotalEarnings(data.reduce((s, p) => s + (p.finalAmountPaid ?? 0), 0));
      }
    });
    api<Notification[]>("/notifications").then(({ data }) => {
      if (data) setNotifications(data.slice(0, 5));
    });
  }, []);

  const activePickups = pickups.filter((p) => p.pickupStatus !== "picked_up" && p.pickupStatus !== "cancelled");
  const historyPickups = pickups.filter((p) => p.pickupStatus === "picked_up");

  const statusLabel: Record<string, string> = {
    requested: "Pending",
    accepted: "Accepted",
    driver_assigned: "Driver assigned",
    on_the_way: "On the way",
    picked_up: "Picked up",
    cancelled: "Cancelled",
  };

  return (
    <div className="page">
      <header className="header">
        <h1 className="logo">♻ Recycle Pickup</h1>
        <nav className="nav">
          {user?.role === "admin" && (
            <Link to="/admin" className="nav-link admin-link">Admin</Link>
          )}
          <span className="user-name">Hello, {user?.name}</span>
          <button onClick={logout} className="btn btn-ghost">Log out</button>
        </nav>
      </header>
      <main className="main">
        {notifications.length > 0 && (
          <div className="banner banner-success">
            <strong>Updates</strong>
            {notifications.map((n) => (
              <Link key={n.id} to={`/pickup/${n.id}`} className="banner-link">{n.message}</Link>
            ))}
          </div>
        )}
        <div className="cards">
          <div className="card card-stat">
            <div className="card-label">Total weight picked up</div>
            <div className="card-hint">Completed pickups only</div>
            <div className="card-value">{totalWeight.toFixed(1)} kg</div>
          </div>
          <div className="card card-stat card-accent">
            <div className="card-label">Total earnings</div>
            <div className="card-hint">Amount received</div>
            <div className="card-value">₹{totalEarnings.toFixed(2)}</div>
          </div>
        </div>
        <Link to="/new-pickup" className="btn btn-primary btn-lg">+ New Pickup Request</Link>

        <section className="section">
          <h2 className="section-title">My Pickups</h2>
          {activePickups.length === 0 ? (
            <p className="empty">No active pickups. Create a new pickup request.</p>
          ) : (
            <div className="card-list">
              {activePickups.map((p) => (
                <Link key={p.id} to={`/pickup/${p.id}`} className="card card-clickable">
                  <div className="card-row">
                    <span className="badge badge-pending">{statusLabel[p.pickupStatus] || p.pickupStatus}</span>
                    <span className="muted">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="card-addr">{p.addressText}</div>
                  <div className="card-meta">{p.totalWeightKg} kg · Est. ₹{p.estimatedAmount.toFixed(2)}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">History</h2>
          <p className="section-hint">Past pickups and amounts received</p>
          {historyPickups.length === 0 ? (
            <p className="empty">No completed pickups yet.</p>
          ) : (
            <div className="card-list">
              {historyPickups.map((p) => (
                <Link key={p.id} to={`/pickup/${p.id}`} className="card card-clickable">
                  <div className="card-row">
                    <span className="badge badge-success">Picked up</span>
                    <span className="muted">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="card-addr">{p.addressText}</div>
                  <div className="card-meta">
                    {p.totalWeightKg} kg
                    {p.finalAmountPaid != null && (
                      <strong className="amount-received">Received ₹{p.finalAmountPaid.toFixed(2)}</strong>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
