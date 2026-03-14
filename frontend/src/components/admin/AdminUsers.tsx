import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { Link } from "react-router-dom";

interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  pickupCount: number;
  totalWeightKg: number;
  totalPaid: number;
  amountDue: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User[]>("/admin/users").then(({ data }) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  const totalDue = users.reduce((s, u) => s + (u.amountDue || 0), 0);
  const usersWithDue = users.filter((u) => (u.amountDue || 0) > 0);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-section">
      <h2>Users</h2>
      {usersWithDue.length > 0 && (
        <div className="card card-warning" style={{ marginBottom: 20, background: "#fef3c7", borderLeft: "4px solid #f59e0b" }}>
          <strong>Payments due</strong>
          <p style={{ margin: "8px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "#92400e" }}>
            ₹{totalDue.toFixed(2)} total ({usersWithDue.length} user{usersWithDue.length > 1 ? "s" : ""} pending)
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#78350f" }}>
            Amount owed for picked-up scrap not yet paid. Record payment in Pickups tab.
          </p>
        </div>
      )}
      <p className="section-hint">
        Total weight and total paid count only completed pickups. Amount due = picked-up scrap not yet paid.
      </p>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Pickups</th>
              <th>Total weight</th>
              <th>Total paid</th>
              <th>Payment due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.phone}</td>
                <td>{u.pickupCount}</td>
                <td>{u.totalWeightKg.toFixed(1)} kg</td>
                <td>₹{u.totalPaid.toFixed(2)}</td>
                <td>
                  {(u.amountDue || 0) > 0 ? (
                    <span className="amount-due">₹{u.amountDue.toFixed(2)}</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <Link to={`/admin/users/${u.id}`} className="link">View history</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p className="empty">No users yet. Share invite links to add users.</p>}
    </div>
  );
}
