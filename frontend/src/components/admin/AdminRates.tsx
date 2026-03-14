import React, { useState, useEffect } from "react";
import { api } from "../../api/client";

interface RateRow {
  category: string;
  rate_per_kg: number;
  effective_from: string;
}

export default function AdminRates() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<RateRow[]>([]);
  const [category, setCategory] = useState("");
  const [ratePerKg, setRatePerKg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<Record<string, number>>("/scrap-rates"),
      api<RateRow[]>("/admin/scrap-rates"),
    ]).then(([r1, r2]) => {
      if (r1.data) setRates(r1.data);
      if (r2.data) setHistory(r2.data);
      setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const rate = parseFloat(ratePerKg);
    if (isNaN(rate) || rate < 0 || !category.trim()) {
      setError("Valid category and rate required");
      return;
    }
    setSaving(true);
    const { error: err } = await api("/admin/scrap-rates", {
      method: "POST",
      body: JSON.stringify({ category: category.trim(), ratePerKg: rate }),
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setRates((prev) => ({ ...prev, [category.trim()]: rate }));
    setCategory("");
    setRatePerKg("");
    const { data } = await api<RateRow[]>("/admin/scrap-rates");
    if (data) setHistory(data);
  }

  async function handleUpdate(cat: string, newRate: number) {
    const { error: err } = await api(`/admin/scrap-rates/${encodeURIComponent(cat)}`, {
      method: "PATCH",
      body: JSON.stringify({ ratePerKg: newRate }),
    });
    if (!err) {
      setRates((prev) => ({ ...prev, [cat]: newRate }));
      const { data } = await api<RateRow[]>("/admin/scrap-rates");
      if (data) setHistory(data);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Scrap rates (₹/kg)</h2>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: 16 }}>
        Update rates daily according to market prices. New pickups use the latest rate per category.
      </p>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        <input
          type="text"
          placeholder="Category (e.g. copper)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 8, width: 140 }}
        />
        <input
          type="number"
          step={0.01}
          min={0}
          placeholder="Rate per kg"
          value={ratePerKg}
          onChange={(e) => setRatePerKg(e.target.value)}
          style={{ padding: 8, width: 120 }}
        />
        <button type="submit" disabled={saving} style={btnStyle}>{saving ? "..." : "Add / Update"}</button>
        {error && <span style={{ color: "#c00" }}>{error}</span>}
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {Object.entries(rates).map(([cat, r]) => (
          <RateCard key={cat} category={cat} rate={r} onUpdate={(n) => handleUpdate(cat, n)} />
        ))}
      </div>
      {Object.keys(rates).length === 0 && <p style={{ color: "#666" }}>No rates. Add categories above or run: npm run db:seed-rates</p>}
    </div>
  );
}

function RateCard({ category, rate, onUpdate }: { category: string; rate: number; onUpdate: (r: number) => void }) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(String(rate));

  function save() {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) {
      onUpdate(n);
      setEdit(false);
    }
  }

  return (
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
      <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{category}</div>
      {edit ? (
        <div style={{ marginTop: 8 }}>
          <input type="number" value={val} onChange={(e) => setVal(e.target.value)} style={{ width: 80, padding: 4 }} />
          <button onClick={save} style={{ marginLeft: 4, padding: "4px 8px" }}>Save</button>
        </div>
      ) : (
        <div style={{ marginTop: 4 }}>
          ₹{rate}/kg <button onClick={() => setEdit(true)} style={{ marginLeft: 4, fontSize: 12 }}>Edit</button>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = { padding: "8px 16px", background: "#0a7c42", color: "white", border: "none", borderRadius: 6, cursor: "pointer" };
