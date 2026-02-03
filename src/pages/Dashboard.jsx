// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import { CATEGORY_COLORS, CATEGORY_NAMES, money } from "../lib/categories";
import {
  getAnchorISO,
  getBiweekStartISO,
  getBiweekEndISO,
  addDaysISO,
  biweekLabel,
} from "../lib/dates";
import {
  filterTransactions,
  totalsByCategory,
  totalSpent,
  pieDataFromTotals,
} from "../lib/summarize";
import { buildTransactionsCSV, downloadTextFile } from "../lib/csv";

import { useCloudTransactions } from "../hooks/useCloudTransactions";
import { useCloudSettings } from "../hooks/useCloudSettings";
import { useCloudIncomeByBiweek } from "../hooks/useCloudIncomeByBiweek";


export default function Dashboard() {
  const { settings } = useCloudSettings();
  const { transactions } = useCloudTransactions();

  const todayISO = new Date().toISOString().slice(0, 10);
  const anchorISO = settings?.anchorPaycheckStartISO || getAnchorISO();
  const currentBiweekStartISO = useMemo(
    () => getBiweekStartISO(anchorISO, todayISO),
    [anchorISO, todayISO]
  );
  const [view, setView] = useState("biweek");
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);

  // 🔑 biweek is driven by biweekStartISO
  const [biweekStartISO, setBiweekStartISO] = useState(
    getBiweekStartISO(anchorISO, todayISO)
  );

  useEffect(() => {
    // When anchor date or "today" changes,
    // re-center the biweek selector on the current biweek
    setBiweekStartISO(currentBiweekStartISO);
  }, [currentBiweekStartISO]);
  
  const [editingPaycheck, setEditingPaycheck] = useState(false);
  const [paycheckDraft, setPaycheckDraft] = useState("");

  const biweekStart =
    view === "biweek"
      ? biweekStartISO
      : getBiweekStartISO(anchorISO, selectedDateISO);

  const biweekEnd =
    view === "biweek"
      ? getBiweekEndISO(anchorISO, biweekStartISO)
      : getBiweekEndISO(anchorISO, selectedDateISO);

  const filtered = useMemo(() => {
    return filterTransactions(transactions || [], {
      view,
      selectedDateISO,
      biweekStart,
      biweekEnd,
    });
  }, [transactions, view, selectedDateISO, biweekStart, biweekEnd]);

  const spent = useMemo(() => totalSpent(filtered), [filtered]);
  const totals = useMemo(() => totalsByCategory(filtered), [filtered]);
  const pieData = useMemo(() => pieDataFromTotals(totals), [totals]);

  const { income, saveIncome } = useCloudIncomeByBiweek({
    anchorISO,
    biweekStartISO: biweekStart,
  });

  const paycheck = Number(income?.amount || 0);
  const remaining = Math.max(0, paycheck - spent);
  const limits = settings?.categoryLimits || {};

  function exportCSV() {
    const csv = buildTransactionsCSV(filtered, {
      title: "Spending Report",
      range: `${biweekStart} → ${biweekEnd}`,
      generatedAt: new Date().toISOString(),
    });
    downloadTextFile(`spending_${biweekStart}.csv`, csv);
  }

  async function savePaycheckValue() {
    const num = Number(paycheckDraft);
    if (!Number.isFinite(num) || num < 0) return;
    await saveIncome({ amount: num });
    setEditingPaycheck(false);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* TOP GRID */}
      <div className="dashTopGrid">
        {/* VIEW */}
        <Card>
          <Label>View</Label>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="input"
          >
            <option value="biweek">Biweek</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </Card>

        {/* DATE / BIWEEK */}
        <Card>
          <Label>{view === "biweek" ? "Pick a biweek" : "Pick a date"}</Label>

          {view === "biweek" ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                className="btn"
                onClick={() =>
                  setBiweekStartISO(addDaysISO(biweekStartISO, -14))
                }
              >
                ← Prev
              </button>

              <select
                className="input"
                value={biweekStartISO}
                onChange={(e) => setBiweekStartISO(e.target.value)}
                style={{ minWidth: 260 }}
              >
                {Array.from({ length: 120 }).map((_, i) => {
                    // Center around "current biweek"
                    const offset = i - 60; // 60 past, current, 59 future
                    const start = addDaysISO(currentBiweekStartISO, offset * 14);
                    return (
                        <option key={start} value={start}>
                        {biweekLabel(start, anchorISO)}
                        </option>
                    );
                    })}

              </select>

              <button
                className="btn"
                onClick={() =>
                  setBiweekStartISO(addDaysISO(biweekStartISO, 14))
                }
              >
                Next →
              </button>
            </div>
          ) : (
            <input
              type="date"
              value={selectedDateISO}
              onChange={(e) => setSelectedDateISO(e.target.value)}
              className="input"
            />
          )}

          <div style={{ marginTop: 10, fontWeight: 900 }}>
            Biweek: {biweekStart} → {biweekEnd}
          </div>
        </Card>

        {/* PAYCHECK */}
        <Card>
          <Label>Paycheck for this biweek</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              disabled={!editingPaycheck}
              value={editingPaycheck ? paycheckDraft : money(paycheck)}
              onChange={(e) => setPaycheckDraft(e.target.value)}
            />
            {!editingPaycheck ? (
              <button
                className="btn"
                onClick={() => {
                  setPaycheckDraft(String(paycheck));
                  setEditingPaycheck(true);
                }}
              >
                Edit
              </button>
            ) : (
              <button className="btn" onClick={savePaycheckValue}>
                Save
              </button>
            )}
          </div>
          <button className="btn" onClick={exportCSV} style={{ marginTop: 10 }}>
            Export CSV
          </button>
        </Card>
      </div>

      {/* SUMMARY */}
      <div className="grid3">
        <Stat title="Total spent" value={money(spent)} />
        <Stat title="Paycheck" value={money(paycheck)} />
        <Stat title="Remaining" value={money(remaining)} />
      </div>

      {/* LIMITS */}
      <Card>
        <h3>Limits</h3>
        {CATEGORY_NAMES.map((cat) => {
          const limit = limits[cat] || 0;
          const used = totals[cat] || 0;
          const pct = limit ? Math.min(100, (used / limit) * 100) : 0;

          const color =
            used > limit
              ? "#ef4444"
              : used >= limit * 0.8
              ? "#f59e0b"
              : "#22c55e";

          return (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <strong>{cat}</strong>
                <span>
                  {money(used)} / {money(limit)}
                </span>
              </div>
              <div className="bar">
                <div
                  className="barFill"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </Card>

      {/* PIE */}
      <Card>
        <h3>Spending breakdown</h3>
        <div className="chartBox">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius="80%"
                label
              >
                {pieData.map((d) => (
                  <Cell
                    key={d.name}
                    fill={CATEGORY_COLORS[d.name] || "#999"}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* TOTALS */}
      <Card>
        <h3>Category totals</h3>
        {CATEGORY_NAMES.map((cat) => (
          <div
            key={cat}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span>{cat}</span>
            <strong>{money(totals[cat] || 0)}</strong>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- helpers ---------- */

function Card({ children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 14,
      }}
    >
      {children}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <Card>
      <div style={{ fontSize: 12, color: "#64748b" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </Card>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
      {children}
    </div>
  );
}
