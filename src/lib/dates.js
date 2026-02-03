// src/lib/dates.js
// UTC-safe date helpers to avoid timezone drift on biweeks.

function toUTCDate(iso) {
    // iso: "YYYY-MM-DD"
    if (typeof iso !== "string") return null;
    const parts = iso.split("-");
    if (parts.length !== 3) return null;
  
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
  
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      return null;
    }
  
    return new Date(Date.UTC(y, m - 1, d));
  }
  
  function toISODateUTC(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }
  
  export function getAnchorISO() {
    // Default anchor start for the first paycheck (biweeks roll forward from here).
    // You can override via Settings in Firestore with `anchorPaycheckStartISO`.
    return "2026-01-02";
  }
  
  export function addDaysISO(iso, days) {
    const dt = toUTCDate(iso);
    if (!dt) return "";
    dt.setUTCDate(dt.getUTCDate() + Number(days || 0));
    return toISODateUTC(dt);
  }
  
  /**
   * Given an anchor date and any date, return the biweek start date (YYYY-MM-DD)
   * for the 14-day period that contains the given date.
   */
  export function getBiweekStartISO(anchorISO, dateISO) {
    const anchor = toUTCDate(anchorISO);
    const date = toUTCDate(dateISO);
  
    // Fail-safe: never crash
    if (!anchor || !date) return getAnchorISO();
  
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((date - anchor) / MS_PER_DAY);
  
    // Number of full 14-day blocks since anchor
    const biweekIndex = Math.floor(diffDays / 14);
  
    const start = new Date(anchor.getTime() + biweekIndex * 14 * MS_PER_DAY);
    return toISODateUTC(start);
  }
  
  /**
   * Biweek end = start + 13 days (inclusive end date)
   */
  export function getBiweekEndISO(anchorISO, dateISO) {
    const startISO = getBiweekStartISO(anchorISO, dateISO);
    return addDaysISO(startISO, 13);
  }
  
  /**
   * Nice label for dropdown: "Biweek N (YYYY-MM-DD → YYYY-MM-DD)"
   */
  export function biweekLabel(startISO, anchorISO) {
    const a = toUTCDate(anchorISO);
    const s = toUTCDate(startISO);
    const end = addDaysISO(startISO, 13);
  
    if (!a || !s) return `Biweek (${startISO} → ${end})`;
  
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((s - a) / MS_PER_DAY);
  
    // integer biweek index from anchor
    const idx = Math.floor(diffDays / 14);
  
    // show negative properly but not "random"
    const num = idx >= 0 ? idx + 1 : idx; // e.g. -1, -2 for before anchor
  
    return `Biweek ${num} (${startISO} → ${end})`;
  }
  
  /* Optional helpers — safe and useful for month/year views */
  export function yearKey(iso) {
    const s = typeof iso === "string" ? iso : "";
    return s.slice(0, 4);
  }
  
  export function monthKey(iso) {
    const s = typeof iso === "string" ? iso : "";
    return s.slice(0, 7);
  }
  
  // Compatibility helper (used by AddSpending.jsx)
export function toISODateOnly(date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().slice(0, 10);
  }
  