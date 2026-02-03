import React from "react";
import { CATEGORY_NAMES } from "../lib/categories.js";
import { useCloudSettings } from "../hooks/useCloudSettings.js";

export default function Settings() {
  const { settings, loading, update } = useCloudSettings();

  return (
    <div style={panel}>
      <div style={title}>
        Settings {loading ? <span style={{ color: "#6b7280", fontSize: 12 }}> (syncing…)</span> : null}
      </div>

      <div style={grid}>
        <div>
          <label style={label}>Anchor paycheck start date</label>
          <input
            type="date"
            value={settings.anchorStartISO}
            onChange={(e) => update({ anchorStartISO: e.target.value })}
            style={input}
          />
          <div style={hint}>
            This is your “first paycheck date” used to calculate every 14-day biweek.
          </div>
        </div>

        <div>
          <label style={label}>Default paycheck amount</label>
          <input
            inputMode="decimal"
            value={String(settings.defaultPaycheck)}
            onChange={(e) => update({ defaultPaycheck: e.target.value })}
            style={input}
          />
          <div style={hint}>
            Used when a specific biweek paycheck hasn’t been set yet.
          </div>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "16px 0" }} />

      <div style={{ fontWeight: 900, marginBottom: 10 }}>Spending limits</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={label}>Limit period</label>
          <select
            value={settings.limitPeriod}
            onChange={(e) => update({ limitPeriod: e.target.value })}
            style={input}
          >
            <option value="month">Monthly</option>
            <option value="biweek">Biweekly</option>
          </select>
          <div style={hint}>Limits apply to the selected period (shown on Dashboard).</div>
        </div>

        <div style={{ color: "#6b7280", fontSize: 12, paddingTop: 26 }}>
          Tip: Start with Food / Transport / Entertainment, then add more later.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CATEGORY_NAMES.map((cat) => (
          <div key={cat}>
            <label style={label}>{cat}</label>
            <input
              inputMode="decimal"
              placeholder="No limit"
              value={settings.categoryLimits?.[cat] ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                update({
                  categoryLimits: {
                    ...(settings.categoryLimits || {}),
                    [cat]: raw, // store string; Dashboard converts safely
                  },
                });
              }}
              style={input}
            />
          </div>
        ))}
      </div>

      <div style={hint}>Leave blank for “no limit”. Values are in dollars.</div>
    </div>
  );
}

const panel = { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" };
const title = { fontWeight: 900, marginBottom: 10 };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const label = { display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6 };
const input = { padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", width: "100%" };
const hint = { fontSize: 12, color: "#6b7280", marginTop: 6 };
