import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";

interface RateMap {
  [key: string]: number;
}

export default function NewPickup() {
  const [addressText, setAddressText] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rates, setRates] = useState<RateMap>({});
  const [items, setItems] = useState<{ category: string; weightKg: number }[]>([{ category: "", weightKg: 0 }]);
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api<RateMap>("/scrap-rates").then(({ data }) => {
      if (data) setRates(data);
    });
  }, []);

  const categories = Object.keys(rates);

  const totalWeight = items.reduce((s, i) => s + (i.weightKg || 0), 0);
  const totalAmount = items.reduce((s, i) => {
    const r = rates[i.category] ?? 0;
    return s + (i.weightKg || 0) * r;
  }, 0);
  const meetsMin = totalWeight >= 60;

  function addItem() {
    setItems([...items, { category: "", weightKg: 0 }]);
  }

  function updateItem(i: number, field: "category" | "weightKg", val: string | number) {
    const next = [...items];
    next[i] = { ...next[i], [field]: field === "weightKg" ? Number(val) || 0 : val };
    setItems(next);
  }

  function removeItem(i: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, j) => j !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!meetsMin) {
      setError(`Minimum 60 kg required. Current total: ${totalWeight} kg`);
      return;
    }
    setLoading(true);
    const payload = {
      addressText,
      scheduledAt: scheduledAt || null,
      items: items.filter((i) => i.category && i.weightKg > 0).map((i) => ({ category: i.category, weightKg: i.weightKg })),
      ...(location && { latitude: location.lat, longitude: location.lng }),
    };
    const { data, error: err } = await api<{ id: string }>("/pickups", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (err || !data) {
      setError(err || "Failed to create pickup");
      setLoading(false);
      return;
    }
    if (images.length > 0) {
      const fd = new FormData();
      images.forEach((f) => fd.append("images", f));
      await api(`/pickups/${data.id}/images`, { method: "POST", body: fd, skipJson: true } as any);
    }
    setLoading(false);
    navigate("/");
  }

  return (
    <div className="page">
      <header className="header" style={{ marginBottom: 0 }}>
        <Link to="/" className="logo" style={{ textDecoration: "none" }}>← Back</Link>
      </header>
      <main className="main">
      <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>New Pickup Request</h1>
      <p className="section-hint" style={{ marginBottom: "1.5rem" }}>Minimum 60 kg total weight required.</p>
      <form onSubmit={handleSubmit} className="card" style={{ padding: "1.5rem" }}>
        <div className="form-group">
        <label className="form-label">Address</label>
          <textarea
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            className="form-input form-textarea"
            placeholder="Full pickup address"
            required
            rows={3}
          />
        </div>
        <div className="form-group">
        <label className="form-label">Location (optional)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
                    () => {}
                  );
                }
              }}
            >
              Share location
            </button>
            {location && <span style={{ fontSize: "0.9rem", color: "var(--color-primary)" }}>Location shared</span>}
          </div>
        </div>
        <div className="form-group">
        <label className="form-label">Preferred pickup date & time</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="form-label" style={{ marginBottom: 0 }}>Scrap items</span>
            <button type="button" onClick={addItem} className="btn btn-primary" style={{ padding: "6px 12px" }}>+ Add</button>
          </div>
          {items.map((item, i) => (
            <div key={i} className="form-row">
              <select
                value={item.category}
                onChange={(e) => updateItem(i, "category", e.target.value)}
                className="form-select"
                style={{ flex: 2 }}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c} (₹{rates[c]}/kg)</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="kg"
                value={item.weightKg || ""}
                onChange={(e) => updateItem(i, "weightKg", e.target.value)}
                className="form-input"
                style={{ width: 90 }}
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} className="btn btn-ghost" style={{ color: "#dc2626" }}>Remove</button>
              )}
            </div>
          ))}
        </div>

        <div className="form-totals">
          <span>Total: {totalWeight} kg</span>
          <span style={!meetsMin ? { color: "#dc2626", fontWeight: 600 } : { color: "var(--color-primary)" }}>
            {meetsMin ? "✓ Min 60 kg" : "✗ Min 60 kg"}
          </span>
          <span>Est. ₹{totalAmount.toFixed(2)}</span>
        </div>

        <div className="form-group">
        <label className="form-label">Images (optional, max 5)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))}
          />
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading || !meetsMin} className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 8 }}>
          {loading ? "Creating..." : "Submit Request"}
        </button>
      </form>
      </main>
    </div>
  );
}
