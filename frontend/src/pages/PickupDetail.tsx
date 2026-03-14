import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import Chat from "../components/Chat";

interface PickupDetail {
  id: string;
  addressText: string;
  scheduledAt: string | null;
  pickupStatus: string;
  totalWeightKg: number;
  estimatedAmount: number;
  finalAmountPaid: number | null;
  driverName: string | null;
  createdAt: string;
  items: { category: string; weightKg: number; ratePerKg: number; amount: number }[];
  images: { id: string; imageUrl: string }[];
}

const statusLabel: Record<string, string> = {
  requested: "Pending",
  accepted: "Accepted",
  driver_assigned: "Driver assigned",
  on_the_way: "On the way",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export default function PickupDetail() {
  const { id } = useParams<{ id: string }>();
  const [pickup, setPickup] = useState<PickupDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api<PickupDetail>(`/pickups/${id}`).then(({ data, error: err }) => {
      if (err) setError(err);
      else if (data) setPickup(data);
    });
  }, [id]);

  if (error) return <div className="main"><p className="error">{error}</p><Link to="/" className="link">← Back</Link></div>;
  if (!pickup) return <div className="main">Loading...</div>;

  return (
    <div className="page">
      <header className="header">
        <Link to="/" className="logo" style={{ textDecoration: "none" }}>← Back</Link>
      </header>
      <main className="main">
      <div className="card" style={{ padding: "1.5rem" }}>
      <span className="badge badge-pending">{statusLabel[pickup.pickupStatus] || pickup.pickupStatus}</span>
      <h1 style={{ fontSize: "1.35rem", margin: "12px 0" }}>Pickup #{pickup.id.slice(0, 8)}</h1>
      <div className="section" style={{ marginBottom: "1rem" }}>
        <strong>Address</strong>
        <p>{pickup.addressText}</p>
      </div>
      {pickup.scheduledAt && (
        <div className="section" style={{ marginBottom: "1rem" }}>
          <strong>Scheduled</strong>
          <p>{new Date(pickup.scheduledAt).toLocaleString()}</p>
        </div>
      )}
      {pickup.driverName && (
        <div className="section" style={{ marginBottom: "1rem" }}>
          <strong>Driver</strong>
          <p>{pickup.driverName}</p>
        </div>
      )}
      <div className="section" style={{ marginBottom: "1rem" }}>
        <strong>Items</strong>
        <table className="admin-table" style={{ marginTop: 8 }}>
          <thead>
            <tr><th>Category</th><th>Weight</th><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {pickup.items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.category}</td>
                <td>{i.weightKg} kg</td>
                <td>₹{i.ratePerKg}/kg</td>
                <td>₹{i.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section" style={{ marginBottom: "1rem" }}>
        <strong>Totals</strong>
        <p>Weight: {pickup.totalWeightKg} kg · Est. ₹{pickup.estimatedAmount.toFixed(2)}</p>
        {pickup.finalAmountPaid != null && <p>Paid: ₹{pickup.finalAmountPaid.toFixed(2)}</p>}
      </div>
      {pickup.images.length > 0 && (
        <div className="section" style={{ marginBottom: "1rem" }}>
          <strong>Images</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {pickup.images.map((img) => (
              <img key={img.id} src={img.imageUrl} alt="" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }} />
            ))}
          </div>
        </div>
      )}
      <div className="section" style={{ marginBottom: 0 }}>
        <strong>Chat</strong>
        <Chat pickupId={pickup.id} />
      </div>
      </div>
      </main>
    </div>
  );
}
