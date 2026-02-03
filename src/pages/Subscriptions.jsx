import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { listenRecurring, removeRecurring, upsertRecurring, upsertTransaction } from "../lib/cloudStore.js";
import { CATEGORY_NAMES, money } from "../lib/categories.js";
import { uid as makeId } from "../lib/storage.js";

function toISODateOnly(d) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODateOnly(d);
}

function addMonths(iso, months) {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // handle month rollover (e.g., Jan 31 + 1 month)
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return toISODateOnly(d);
}

function nextDate(iso, cadence) {
  if (cadence === "biweekly") return addDays(iso, 14);
  return addMonths(iso, 1);
}

export default function Subscriptions() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // form
  const today = useMemo(() => toISODateOnly(new Date()), []);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Subscriptions");
  const [cadence, setCadence] = useState("monthly"); // monthly | biweekly
  const [nextRunISO, setNextRunISO] = useState(today);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsub = listenRecurring(uid, (list) => {
      // sort soonest nextRun first
      list.sort((a, b) => (a.nextRunISO > b.nextRunISO ? 1 : -1));
      setRules(list);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  async function addRule(e) {
    e.preventDefault();
    if (!uid) return;

    const n = Number(amount);
    if (!name.trim()) return alert("Name is required.");
    if (!Number.isFinite(n) || n <= 0) return alert("Amount must be > 0.");
    if (!CATEGORY_NAMES.includes(category)) return alert("Pick a valid category.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextRunISO)) return alert("Pick a valid next date.");

    const rule = {
      id: makeId(),
      name: name.trim(),
      amount: n,
      category,
      cadence,
      nextRunISO,
      lastRunISO: null,
    };

    await upsertRecurring(uid, rule);

    setName("");
    setAmount("");
    setCategory("Subscriptions");
    setCadence("monthly");
    setNextRunISO(today);
  }

  async function delRule(id) {
    if (!uid) return;
    await removeRecurring(uid, id);
  }

  async function generateDue() {
    if (!uid) return;

    const todayISO = toISODateOnly(new Date());

    // create due transactions (one per rule if nextRunISO <= today)
    for (const r of rules) {
      if (!r.nextRunISO) continue;

      if (r.nextRunISO <= todayISO) {
        const txId = makeId();
        await upsertTransaction(uid, {
          id: txId,
          date: r.nextRunISO,
          category: r.category,
          amount: Number(r.amount || 0),
          note: r.name,
        });

        const newNext = nextDate(r.nextRunISO, r.cadence);
        await upsertRecurring(uid, {
          ...r,
          lastRunISO: r.nextRunISO,
          nextRunISO: newNext,
        });
      }
    }

    alert("Generated due subscription transactions (if any were due).");
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={panel}>
        <div style={title}>Subscriptions</div>
        <div style={{ color: "#6b7280", fontSize: 12 }}>
          Add recurring subscriptions once. Then generate transactions when they’re due.
        </div>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <button onClick={generateDue} style={primaryBtn}>
            Generate due transactions
          </button>
          <div style={{ color: "#6b7280", fontSize: 12 }}>
            {loading ? "Syncing…" : `${rules.length} subscription(s)`}
          </div>
        </div>
      </div>

      <div style={panel}>
        <div style={panelTitle}>Add a subscription</div>

        <form onSubmit={addRule} style={formGrid}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (Netflix, Spotify…)" style={input} />
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={input} />

          <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
            {CATEGORY_NAMES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={cadence} onChange={(e) => setCadence(e.target.value)} style={input}>
            <option value="monthly">Monthly</option>
            <option value="biweekly">Biweekly</option>
          </select>

          <input type="date" value={nextRunISO} onChange={(e) => setNextRunISO(e.target.value)} style={input} />

          <button type="submit" style={primaryBtn}>Add</button>
        </form>
      </div>

      <div style={panel}>
        <div style={panelTitle}>Your subscriptions</div>

        {rules.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No subscriptions yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {rules.map((r) => {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = r.nextRunISO < today;
  const isToday = r.nextRunISO === today;

  return (
    <div key={r.id} style={row}>
      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <b>{r.name}</b>

          {isToday && <span style={badgeToday}>Due today</span>}
          {isOverdue && <span style={badgeOverdue}>Overdue</span>}
        </div>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {r.cadence === "biweekly" ? "Biweekly" : "Monthly"} • Next:{" "}
          <b>{r.nextRunISO}</b>
        </div>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Category: {r.category}
          {r.lastRunISO ? <> • Last: {r.lastRunISO}</> : null}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 900 }}>{money(r.amount)}</div>
        <button onClick={() => delRule(r.id)} style={dangerBtn}>
          Delete
        </button>
      </div>
    </div>
  );
})}

          </div>
        )}
      </div>
    </div>
  );
}

/* styles */
const panel = { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" };
const title = { fontWeight: 900, marginBottom: 8 };
const panelTitle = { fontWeight: 900, marginBottom: 10 };

const input = { padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", width: "100%" };

const formGrid = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
  gap: 10,
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: 12,
  borderRadius: 14,
  border: "1px solid #f1f5f9",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const dangerBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const badgeToday = {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 800,
  };
  
  const badgeOverdue = {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
  };
  
