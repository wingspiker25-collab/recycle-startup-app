import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

interface Pickup {
  id: string;
  addressText: string;
  pickupStatus: string;
  totalWeightKg: number;
  estimatedAmount: number;
  finalAmountPaid: number | null;
  createdAt: string;
}

interface HistoryData {
  userName: string;
  userPhone: string;
  pickups: Pickup[];
}

export default function AdminUserHistory() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api<HistoryData>(`/admin/users/${id}/history`).then(({ data: d }) => {
      if (d) setData(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>User not found.</p>;

  const completed = data.pickups.filter((p) => p.pickupStatus === "picked_up" && p.finalAmountPaid != null);

  return (
    <div>
      <Link to="/admin" style={{ color: "#0a7c42", marginBottom: 16, display: "inline-block" }}>← Back to Admin</Link>
      <h2>Pickup history: {data.userName}</h2>
      <p style={{ color: "#666" }}>{data.userPhone}</p>
      <p><strong>Total amount received:</strong> ₹{completed.reduce((s, p) => s + (p.finalAmountPaid ?? 0), 0).toFixed(2)}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Address</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Weight</th>
            <th style={thStyle}>Amount received</th>
          </tr>
        </thead>
        <tbody>
          {data.pickups.map((p) => (
            <tr key={p.id}>
              <td style={tdStyle}>{new Date(p.createdAt).toLocaleDateString()}</td>
              <td style={tdStyle}>{p.addressText.slice(0, 40)}...</td>
              <td style={tdStyle}>{p.pickupStatus}</td>
              <td style={tdStyle}>{p.totalWeightKg} kg</td>
              <td style={tdStyle}>
                {p.finalAmountPaid != null ? `₹${p.finalAmountPaid.toFixed(2)}` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = { border: "1px solid #ddd", padding: 8, textAlign: "left", background: "#f5f5f5" };
const tdStyle: React.CSSProperties = { border: "1px solid #ddd", padding: 8 };
