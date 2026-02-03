import React, { useMemo, useState } from "react";
import { CATEGORY_NAMES } from "../lib/categories.js";
import { uid } from "../lib/storage.js";
import { toISODateOnly } from "../lib/dates.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { upsertTransaction } from "../lib/cloudStore.js";

export default function AddSpending() {
  const { user } = useAuth();
  const uidUser = user?.uid;

  const todayISO = useMemo(() => toISODateOnly(new Date()), []);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [dateISO, setDateISO] = useState(todayISO);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (!uidUser) return;

    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      alert("Please enter an amount greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const tx = {
        id: uid(),
        date: dateISO,
        amount: n,
        category,
        note: note.trim(),
      };

      await upsertTransaction(uidUser, tx);

      // Reset form (keep date, since people often add multiple items same day)
      setAmount("");
      setNote("");
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={panel}>
      <div style={title}>Add a spending</div>

      <form onSubmit={add} style={formGrid}>
        <input
          inputMode="decimal"
          placeholder="Amount (e.g. 12.50)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={input}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
        {CATEGORY_NAMES.map((c) => (
            <option key={c} value={c}>{c}</option>
        ))}
        </select>

        <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} style={input} />

        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={input}
        />

        <button type="submit" style={saving ? buttonDisabled : button} disabled={saving}>
          {saving ? "Saving..." : "Add"}
        </button>
      </form>

      <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
        Saved to your Firebase account (syncs across devices).
      </div>
    </div>
  );
}

/* styles */
const panel = { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" };
const title = { fontWeight: 900, marginBottom: 10 };
const input = { padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", width: "100%" };
const button = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const buttonDisabled = { ...button, opacity: 0.6, cursor: "not-allowed" };

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 2fr auto",
  gap: 10,
};
