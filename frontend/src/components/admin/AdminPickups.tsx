import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import Chat from "../Chat";

interface Pickup {
  id: string;
  userName: string;
  userPhone: string;
  addressText: string;
  pickupStatus: string;
  totalWeightKg: number;
  estimatedAmount: number;
  finalAmountPaid: number | null;
  driverName: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  requested: "Pending",
  accepted: "Accepted",
  driver_assigned: "Driver assigned",
  on_the_way: "On the way",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export default function AdminPickups() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ id: string; drivers: { id: string; name: string }[] } | null>(null);
  const [detailData, setDetailData] = useState<any>(null);

  useEffect(() => {
    const url = filter ? `/admin/pickups?status=${filter}` : "/admin/pickups";
    api<Pickup[]>(url).then(({ data }) => {
      if (data) setPickups(data);
      setLoading(false);
    });
  }, [filter]);

  async function openDetail(id: string) {
    const { data } = await api<any>(`/admin/pickups/${id}`);
    if (data) {
      setDetail({ id, drivers: data.drivers || [] });
      setDetailData(data);
    }
  }

  async function updatePickup(updates: Record<string, unknown>) {
    if (!detail) return;
    await api(`/admin/pickups/${detail.id}`, { method: "PATCH", body: JSON.stringify(updates) });
    const { data } = await api<any>(`/admin/pickups/${detail.id}`);
    if (data) setDetailData(data);
    setPickups((prev) => prev.map((p) => (p.id === detail.id ? { ...p, ...updates } : p)));
  }

  async function recordPayment(amount: number, method: string) {
    if (!detail) return;
    await api(`/admin/pickups/${detail.id}/payments`, {
      method: "POST",
      body: JSON.stringify({ amount, method }),
    });
    const { data } = await api<any>(`/admin/pickups/${detail.id}`);
    if (data) setDetailData(data);
    setDetail(null);
    setPickups((prev) => prev.map((p) => (p.id === detail.id ? { ...p, finalAmountPaid: amount } : p)));
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Pickups</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Filter:{" "}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Weight</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {pickups.map((p) => (
              <tr key={p.id}>
                <td style={tdStyle}>{p.userName}<br /><small>{p.userPhone}</small></td>
                <td style={tdStyle}>{p.addressText.slice(0, 40)}...</td>
                <td style={tdStyle}>{statusLabels[p.pickupStatus] || p.pickupStatus}</td>
                <td style={tdStyle}>{p.totalWeightKg} kg</td>
                <td style={tdStyle}>₹{p.estimatedAmount.toFixed(0)}{p.finalAmountPaid != null ? ` (paid ₹${p.finalAmountPaid})` : ""}</td>
                <td style={tdStyle}>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={tdStyle}><button onClick={() => openDetail(p.id)} style={btnStyle}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pickups.length === 0 && <p style={{ color: "#666" }}>No pickups.</p>}

      {detail && detailData && (
        <DetailModal
          data={detailData}
          drivers={detail.drivers}
          onClose={() => setDetail(null)}
          onUpdate={updatePickup}
          onPayment={recordPayment}
        />
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { border: "1px solid #ddd", padding: 8, textAlign: "left", background: "#f5f5f5" };
const tdStyle: React.CSSProperties = { border: "1px solid #ddd", padding: 8 };
const btnStyle: React.CSSProperties = { padding: "4px 12px", background: "#0a7c42", color: "white", border: "none", borderRadius: 4, cursor: "pointer" };

function DetailModal({
  data,
  drivers,
  onClose,
  onUpdate,
  onPayment,
}: {
  data: any;
  drivers: { id: string; name: string }[];
  onClose: () => void;
  onUpdate: (u: Record<string, unknown>) => void;
  onPayment: (amount: number, method: string) => void;
}) {
  const [status, setStatus] = useState(data.pickup_status);
  const [driverId, setDriverId] = useState(data.driver_id || "");
  const [scheduledAt, setScheduledAt] = useState((data.scheduled_at || "").slice(0, 16));
  const [payAmount, setPayAmount] = useState(String(data.estimated_amount || 0));
  const [payMethod, setPayMethod] = useState("cash");

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3>Pickup detail</h3>
          <button onClick={onClose}>×</button>
        </div>
        <p><strong>User:</strong> {data.user_name} ({data.phone})</p>
        <p><strong>Address:</strong> {data.address_text}</p>
        <p><strong>Weight:</strong> {data.total_weight_kg} kg · Est. ₹{data.estimated_amount}</p>
        <p><strong>Items:</strong></p>
        <ul>{data.items?.map((i: any, idx: number) => (
          <li key={idx}>{i.category}: {i.weight_kg} kg × ₹{i.rate_per_kg} = ₹{i.amount}</li>
        ))}</ul>

        <hr />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            Status:{" "}
            <select value={status} onChange={(e) => { setStatus(e.target.value); onUpdate({ pickupStatus: e.target.value }); }}>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>
            Driver:{" "}
            <select value={driverId} onChange={(e) => { setDriverId(e.target.value); onUpdate({ driverId: e.target.value || null }); }}>
              <option value="">—</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label>
            Scheduled:{" "}
            <input type="datetime-local" value={scheduledAt} onChange={(e) => { setScheduledAt(e.target.value); onUpdate({ scheduledAt: e.target.value || null }); }} />
          </label>
        </div>

        <hr />
        <strong>Chat</strong>
        <div style={{ marginTop: 8 }}><Chat pickupId={data.id} /></div>

        {!data.final_amount_paid && (
          <>
            <hr />
            <h4>Record payment</h4>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} style={{ width: 100 }} />
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="bank">Bank transfer</option>
              </select>
              <button onClick={() => onPayment(Number(payAmount), payMethod)} style={btnStyle}>Mark paid</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const modalOverlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const modalContent: React.CSSProperties = {
  background: "white", padding: 24, borderRadius: 8, maxWidth: 500, maxHeight: "90vh", overflow: "auto",
};
