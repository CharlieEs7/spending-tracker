import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useCloudTransactions } from "../hooks/useCloudTransactions.js";
import { useCloudSettings } from "../hooks/useCloudSettings.js";
import { getAnchorISO, getBiweekEndISO, getBiweekStartISO, monthKey, yearKey } from "../lib/dates.js";
import { money } from "../lib/categories.js";

export default function History() {
  const navigate = useNavigate();

  const { transactions, loading: txLoading } = useCloudTransactions();
  const { settings, loading: settingsLoading } = useCloudSettings();

  const anchorISO = useMemo(() => getAnchorISO(settings), [settings]);

  const biweekMap = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      const start = getBiweekStartISO(t.date, anchorISO);
      const prev = map.get(start) ?? [];
      prev.push(t);
      map.set(start, prev);
    }
    return map;
  }, [transactions, anchorISO]);

  const biweeks = useMemo(() => {
    return Array.from(biweekMap.entries())
      .map(([start, list]) => {
        const spent = list.reduce((s, t) => s + Number(t.amount || 0), 0);
        return { start, end: getBiweekEndISO(start), count: list.length, spent };
      })
      .sort((a, b) => (a.start < b.start ? 1 : -1));
  }, [biweekMap]);

  const months = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      const k = monthKey(t.date);
      map.set(k, (map.get(k) ?? 0) + Number(t.amount || 0));
    }
    return Array.from(map.entries())
      .map(([k, spent]) => ({ k, spent }))
      .sort((a, b) => (a.k < b.k ? 1 : -1));
  }, [transactions]);

  const years = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      const k = yearKey(t.date);
      map.set(k, (map.get(k) ?? 0) + Number(t.amount || 0));
    }
    return Array.from(map.entries())
      .map(([k, spent]) => ({ k, spent }))
      .sort((a, b) => (a.k < b.k ? 1 : -1));
  }, [transactions]);

  const syncing = txLoading || settingsLoading;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={panel}>
        <div style={title}>
          History {syncing ? <span style={{ color: "#6b7280", fontSize: 12 }}> (syncing…)</span> : null}
        </div>
        <div style={{ color: "#6b7280", fontSize: 12 }}>
          Anchor paycheck start: <b>{anchorISO}</b>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={panel}>
          <div style={title}>Biweeks</div>
          {biweeks.length === 0 ? (
            <div style={{ color: "#6b7280" }}>
              {syncing ? "Loading…" : "No data yet — add spendings first."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {biweeks.map((b) => (
                <div
                  key={b.start}
                  style={{ ...item, cursor: "pointer" }}
                  onClick={() => navigate(`/?view=biweek&date=${b.start}`)}
                  title="Open in Dashboard"
                >
                  <div>
                    <b>{b.start}</b> → {b.end}
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{b.count} transaction(s)</div>
                  </div>
                  <div style={{ fontWeight: 900 }}>{money(b.spent)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={panel}>
            <div style={title}>Months</div>
            {months.length === 0 ? (
              <div style={{ color: "#6b7280" }}>—</div>
            ) : (
              months.map((m) => (
                <div
                  key={m.k}
                  style={{ ...item, cursor: "pointer" }}
                  onClick={() => navigate(`/?view=month&date=${m.k}-01`)}
                  title="Open in Dashboard"
                >
                  <div><b>{m.k}</b></div>
                  <div style={{ fontWeight: 900 }}>{money(m.spent)}</div>
                </div>
              ))
            )}
          </div>

          <div style={panel}>
            <div style={title}>Years</div>
            {years.length === 0 ? (
              <div style={{ color: "#6b7280" }}>—</div>
            ) : (
              years.map((y) => (
                <div
                  key={y.k}
                  style={{ ...item, cursor: "pointer" }}
                  onClick={() => navigate(`/?view=year&date=${y.k}-01-01`)}
                  title="Open in Dashboard"
                >
                  <div><b>{y.k}</b></div>
                  <div style={{ fontWeight: 900 }}>{money(y.spent)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const panel = { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" };
const title = { fontWeight: 900, marginBottom: 10 };
const item = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 12, border: "1px solid #f1f5f9" };
