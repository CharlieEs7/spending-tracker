import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { CATEGORY_COLORS, money } from "../lib/categories.js";
import { getAnchorISO, getBiweekEndISO, getBiweekStartISO, toISODateOnly } from "../lib/dates.js";
import { filterTransactions, pieDataFromTotals, totalSpent, totalsByCategory } from "../lib/summarize.js";
import { buildTransactionsCSV, downloadTextFile } from "../lib/csv.js";

import { useCloudTransactions } from "../hooks/useCloudTransactions.js";
import { useCloudSettings } from "../hooks/useCloudSettings.js";
import { useCloudIncomeByBiweek } from "../hooks/useCloudIncomeByBiweek.js";

export default function Dashboard() {
  const todayISO = toISODateOnly(new Date());
  const [searchParams] = useSearchParams();

  // ✅ CLOUD
  const { transactions, loading: txLoading } = useCloudTransactions();
  const { settings, loading: settingsLoading } = useCloudSettings();
  const { incomeByBiweek, loading: incomeLoading, setForBiweek } = useCloudIncomeByBiweek();

  const [view, setView] = useState("biweek");
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);

  // Paycheck edit-lock state
  const [isEditingPaycheck, setIsEditingPaycheck] = useState(false);
  const [paycheckDraft, setPaycheckDraft] = useState("");

  // Read URL params like: /?view=month&date=2026-02-01
  useEffect(() => {
    const v = searchParams.get("view");
    const d = searchParams.get("date");

    if (v === "biweek" || v === "month" || v === "year") setView(v);
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setSelectedDateISO(d);
  }, [searchParams]);

  const anchorISO = useMemo(() => getAnchorISO(settings), [settings]);

  const biweekStart = useMemo(
    () => getBiweekStartISO(selectedDateISO, anchorISO),
    [selectedDateISO, anchorISO]
  );
  const biweekEnd = useMemo(() => getBiweekEndISO(biweekStart), [biweekStart]);

  const paycheck = useMemo(() => {
    const specific = incomeByBiweek[biweekStart];
    if (specific !== undefined && specific !== null) return Number(specific) || 0;
    return Number(settings?.defaultPaycheck || 0);
  }, [incomeByBiweek, biweekStart, settings]);

  // Keep draft synced + lock editing when biweek changes
  useEffect(() => {
    setIsEditingPaycheck(false);
    setPaycheckDraft(String(paycheck));
  }, [biweekStart, paycheck]);

  const filtered = useMemo(() => {
    return filterTransactions(transactions, view, selectedDateISO, biweekStart, biweekEnd);
  }, [transactions, view, selectedDateISO, biweekStart, biweekEnd]);

  const totals = useMemo(() => totalsByCategory(filtered), [filtered]);
  const pieData = useMemo(() => pieDataFromTotals(totals), [totals]);
  const spent = useMemo(() => totalSpent(filtered), [filtered]);

  const remaining = useMemo(() => (view === "biweek" ? paycheck - spent : null), [view, paycheck, spent]);

  const header = useMemo(() => {
    if (view === "biweek") return `Biweek: ${biweekStart} → ${biweekEnd}`;
    if (view === "month") return `Month: ${selectedDateISO.slice(0, 7)}`;
    return `Year: ${selectedDateISO.slice(0, 4)}`;
  }, [view, biweekStart, biweekEnd, selectedDateISO]);

  function startEditPaycheck() {
    setPaycheckDraft(String(paycheck));
    setIsEditingPaycheck(true);
  }

  function cancelEditPaycheck() {
    setPaycheckDraft(String(paycheck));
    setIsEditingPaycheck(false);
  }

  async function saveEditPaycheck() {
    const n = Number(paycheckDraft);
    if (!Number.isFinite(n) || n < 0) {
      alert("Paycheck must be a valid number (0 or more).");
      return;
    }
    await setForBiweek(biweekStart, n); // ✅ Cloud save
    setIsEditingPaycheck(false);
  }

  function exportCSV() {
    const now = new Date().toISOString();

    const title =
      view === "biweek" ? "Biweek Report" : view === "month" ? "Monthly Report" : "Yearly Report";

    const range =
      view === "biweek"
        ? `${biweekStart} to ${biweekEnd}`
        : view === "month"
        ? `${selectedDateISO.slice(0, 7)}`
        : `${selectedDateISO.slice(0, 4)}`;

    const csv = buildTransactionsCSV(filtered, { title, range, generatedAt: now });
    const safeRange = range.replace(/\s+/g, "_").replace(/:/g, "-");
    downloadTextFile(`spending_${view}_${safeRange}.csv`, csv);
  }

  /* -------------------- Limits -------------------- */
  // Bars should match the dashboard view (year doesn't have limits, so default to month)
  const limitPeriod = view === "biweek" ? "biweek" : "month";
  const categoryLimitsRaw = settings?.categoryLimits || {};

  const categoryLimits = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(categoryLimitsRaw)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = n;
    }
    return out;
  }, [categoryLimitsRaw]);

  const limitFiltered = useMemo(() => {
    return filterTransactions(transactions, limitPeriod, selectedDateISO, biweekStart, biweekEnd);
  }, [transactions, limitPeriod, selectedDateISO, biweekStart, biweekEnd]);

  const limitTotals = useMemo(() => totalsByCategory(limitFiltered), [limitFiltered]);

  const limitHeader = useMemo(() => {
    if (limitPeriod === "biweek") return `Limits (biweek ${biweekStart} → ${biweekEnd})`;
    return `Limits (month ${selectedDateISO.slice(0, 7)})`;
  }, [limitPeriod, biweekStart, biweekEnd, selectedDateISO]);

  const syncing = txLoading || settingsLoading || incomeLoading;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Controls Panel */}
      <div style={panel}>
        <div style={grid3}>
          <div>
            <label style={label}>View</label>
            <select value={view} onChange={(e) => setView(e.target.value)} style={input}>
              <option value="biweek">Biweek</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          <div>
            <label style={label}>Pick a date</label>
            <input type="date" value={selectedDateISO} onChange={(e) => setSelectedDateISO(e.target.value)} style={input} />
          </div>

          <div>
            {view === "biweek" ? (
              <>
                <label style={label}>Paycheck for this biweek</label>

                {!isEditingPaycheck ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={lockedValue}>{money(paycheck)}</div>
                    <button onClick={startEditPaycheck} style={smallBtn}>Edit</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      inputMode="decimal"
                      value={paycheckDraft}
                      onChange={(e) => setPaycheckDraft(e.target.value)}
                      style={input}
                    />
                    <button onClick={saveEditPaycheck} style={smallPrimaryBtn}>Save</button>
                    <button onClick={cancelEditPaycheck} style={smallBtn}>Cancel</button>
                  </div>
                )}

                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  Locked by default — click Edit to change.
                </div>
              </>
            ) : (
              <div style={{ color: "#6b7280", fontSize: 13, paddingTop: 22 }}>
                Paycheck + Remaining show in <b>Biweek</b> view.
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12, fontWeight: 900 }}>
          {header} {syncing ? <span style={{ color: "#6b7280", fontSize: 12 }}> (syncing…)</span> : null}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
          Anchor paycheck start: <b>{anchorISO}</b>
        </div>

        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Export the transactions currently shown in this view.
          </div>
          <button onClick={exportCSV} style={exportBtn}>Export CSV</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={grid3}>
        <Card title="Total spent" value={money(spent)} />
        {view === "biweek" ? (
          <>
            <Card title="Paycheck" value={money(paycheck)} />
            <Card title="Remaining" value={money(remaining)} sub={remaining < 0 ? "Over budget" : "On track"} />
          </>
        ) : (
          <>
            <Card title="Transactions" value={String(filtered.length)} />
            <Card title="Tip" value={"Switch to Biweek for remaining"} />
          </>
        )}
      </div>

      {/* Limits Panel */}
      <div style={panel}>
        <div style={panelTitle}>{limitHeader}</div>

        {Object.keys(categoryLimits).length === 0 ? (
          <div style={{ color: "#6b7280" }}>
            No limits set yet. Go to <b>Settings</b> → “Spending limits”.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {Object.entries(categoryLimits).map(([cat, limit]) => {
              const spentInPeriod = Number(limitTotals[cat] || 0);
              const pct = limit > 0 ? spentInPeriod / limit : 0;
              const status = pct >= 1 ? "danger" : pct >= 0.8 ? "warning" : "ok";
              const diff = limit - spentInPeriod;

              return (
                <div
                  key={cat}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid #e5e7eb",
                    background: status === "danger" ? "#fef2f2" : status === "warning" ? "#fffbeb" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: CATEGORY_COLORS[cat], display: "inline-block" }} />
                      <b>{cat}</b>
                      {status === "warning" ? <span title="80% reached">🟡</span> : null}
                      {status === "danger" ? <span title="Over limit">🔴</span> : null}
                    </div>

                    <div style={{ fontWeight: 900 }}>
                      {money(spentInPeriod)} / {money(limit)}
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={barBg}>
                      <div
                        style={{
                          ...barFill,
                          width: `${Math.min(100, Math.round(pct * 100))}%`,
                          background: BAR_COLORS[status],
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                    {diff >= 0 ? <span>{money(diff)} left</span> : <span>{money(Math.abs(diff))} over</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart + Totals */}
      <div style={gridTwo}>
        <div style={panel}>
          <div style={panelTitle}>Spending breakdown</div>
          <div style={{ height: 340 }}>
            {pieData.length === 0 ? (
              <div style={{ color: "#6b7280", paddingTop: 40 }}>
                Add spendings to see a chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={120} label>
                    {pieData.map((p) => (
                      <Cell key={p.name} fill={CATEGORY_COLORS[p.name]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={panel}>
          <div style={panelTitle}>Category totals (current view)</div>
          {Object.entries(totals).map(([name, value]) => (
            <div key={name} style={row}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: CATEGORY_COLORS[name] }} />
                <span>{name}</span>
              </div>
              <b>{money(value)}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, sub }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

/* ---------- styles ---------- */
const panel = { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" };
const panelTitle = { fontWeight: 900, marginBottom: 10 };
const label = { display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6 };
const input = { padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", width: "100%" };

const lockedValue = { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#f8fafc", fontWeight: 900, minWidth: 140 };
const smallBtn = { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
const smallPrimaryBtn = { padding: "10px 12px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" };

const card = { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" };
const gridTwo = { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 };

const row = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" };

const exportBtn = { padding: "10px 14px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, cursor: "pointer" };

const barBg = { height: 10, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" };
const barFill = { height: "100%", borderRadius: 999 };

const BAR_COLORS = { ok: "#22c55e", warning: "#facc15", danger: "#ef4444" };
