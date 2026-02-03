import React, { useEffect, useMemo, useState } from "react";
import { CATEGORY_NAMES, CATEGORY_COLORS, money } from "../lib/categories.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { listenTransactions, removeTransaction, upsertTransaction } from "../lib/cloudStore.js";


export default function Transactions() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const unsub = listenTransactions(uid, setTransactions);
    return () => unsub();
  }, [uid]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesCategory = categoryFilter === "All" ? true : t.category === categoryFilter;
      const hay = `${t.date} ${t.category} ${t.note || ""} ${t.amount}`.toLowerCase();
      const matchesQuery = q.length === 0 ? true : hay.includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [transactions, query, categoryFilter]);

  const totalShown = useMemo(() => {
    return filtered.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filtered]);

  async function deleteTx(id) {
    await removeTransaction(uid, id);
  }

  function startEdit(tx) {
    setEditing({ ...tx, amount: String(tx.amount ?? ""), note: tx.note ?? "" });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;

    const amountNum = Number(editing.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      alert("Amount must be a number greater than 0.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editing.date)) {
      alert("Date must be in YYYY-MM-DD format.");
      return;
    }
    if (!CATEGORY_NAMES.includes(editing.category)) {
      alert("Invalid category.");
      return;
    }

    await upsertTransaction(uid, {
      id: editing.id,
      date: editing.date,
      category: editing.category,
      amount: amountNum,
      note: editing.note.trim(),
    });

    setEditing(null);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={panel}>
        <div style={title}>Transactions</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search date, note, category, amount..."
            style={input}
          />

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={input}>
            <option value="All">All categories</option>
            {CATEGORY_NAMES.map((c) => (
                <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", fontWeight: 900 }}>
            Total shown: {money(totalShown)}
          </div>
        </div>
      </div>

      <div style={panel}>
        {filtered.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No transactions found.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.map((t) => (
              <div key={t.id} style={row}>
                <div style={{ color: "#555" }}>{t.date}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: CATEGORY_COLORS[t.category] }} />
                  <b>{t.category}</b>
                </div>

                <div style={{ color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.note || "—"}
                </div>

                <div style={{ textAlign: "right", fontWeight: 900 }}>{money(t.amount)}</div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button onClick={() => startEdit(t)} style={btn}>Edit</button>
                  <button onClick={() => deleteTx(t.id)} style={dangerBtn}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <EditModal editing={editing} setEditing={setEditing} onCancel={cancelEdit} onSave={saveEdit} />
      ) : null}
    </div>
  );
}

function EditModal({ editing, setEditing, onCancel, onSave }) {
  return (
    <div style={backdrop} onMouseDown={onCancel}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Edit transaction</div>
          <button onClick={onCancel} style={xBtn} aria-label="Close">✕</button>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div>
            <label style={label}>Amount</label>
            <input
              inputMode="decimal"
              value={editing.amount}
              onChange={(e) => setEditing((p) => ({ ...p, amount: e.target.value }))}
              style={input}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={label}>Category</label>
              <select
                value={editing.category}
                onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))}
                style={input}
              >
                {CATEGORY_NAMES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Date</label>
              <input
                type="date"
                value={editing.date}
                onChange={(e) => setEditing((p) => ({ ...p, date: e.target.value }))}
                style={input}
              />
            </div>
          </div>

          <div>
            <label style={label}>Note</label>
            <input
              value={editing.note}
              onChange={(e) => setEditing((p) => ({ ...p, note: e.target.value }))}
              style={input}
              placeholder="Optional"
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <button onClick={onCancel} style={btn}>Cancel</button>
          <button onClick={onSave} style={primaryBtn}>Save</button>
        </div>
      </div>
    </div>
  );
}

const panel = { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" };
const title = { fontWeight: 900, marginBottom: 10 };
const input = { padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", width: "100%" };
const label = { display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6 };

const row = {
  display: "grid",
  gridTemplateColumns: "120px 160px 1fr 140px 200px",
  gap: 10,
  alignItems: "center",
  padding: 10,
  borderRadius: 12,
  border: "1px solid #f1f5f9",
};

const btn = { padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700 };
const dangerBtn = { ...btn, border: "1px solid #fecaca", background: "#fff" };
const primaryBtn = { padding: "10px 14px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900 };
const xBtn = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 10, padding: "6px 10px", cursor: "pointer" };

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const modal = {
  width: "min(560px, 100%)",
  background: "white",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  padding: 16,
};
