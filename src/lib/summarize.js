// src/lib/summarize.js

import { monthKey, yearKey } from "./dates";
import { CATEGORY_NAMES } from "./categories";

// Safely extract dateISO from whatever the transaction stored
export function getTxISO(t) {
  if (!t || typeof t !== "object") return "";

  // Most common fields across your app versions
  return (
    t.dateISO ||
    t.date ||
    t.iso ||
    t.whenISO ||
    t.transactionDate ||
    t.createdAtISO ||
    ""
  );
}

// Safely extract amount as a number
export function getTxAmount(t) {
  if (!t || typeof t !== "object") return 0;

  // Common fields
  const a =
    t.amount ??
    t.value ??
    t.cost ??
    (typeof t.cents === "number" ? t.cents / 100 : undefined);

  const num = Number(a);
  return Number.isFinite(num) ? num : 0;
}

// Safely extract category
export function getTxCategory(t) {
  if (!t || typeof t !== "object") return "Other";
  const c = t.category || t.type || "Other";
  return typeof c === "string" ? c : "Other";
}

/**
 * Filter transactions by view:
 * - biweek: between biweekStart and biweekEnd (inclusive)
 * - month: same YYYY-MM
 * - year: same YYYY
 */
export function filterTransactions(transactions, opts) {
  const txs = Array.isArray(transactions) ? transactions : [];

  const view = opts?.view || "biweek";
  const selectedDateISO = opts?.selectedDateISO || "";
  const biweekStart = opts?.biweekStart || opts?.biweekStartISO || "";
  const biweekEnd = opts?.biweekEnd || opts?.biweekEndISO || "";

  // Pre-calc comparison keys
  const selMonth = monthKey(selectedDateISO);
  const selYear = yearKey(selectedDateISO);

  return txs.filter((t) => {
    const iso = getTxISO(t);
    if (!iso) return false; // no date = cannot include

    if (view === "month") {
      return monthKey(iso) === selMonth;
    }

    if (view === "year") {
      return yearKey(iso) === selYear;
    }

    // default: biweek
    if (!biweekStart || !biweekEnd) return false;
    return iso >= biweekStart && iso <= biweekEnd;
  });
}

/**
 * Total spent across a list of txs
 */
export function totalSpent(transactions) {
  const txs = Array.isArray(transactions) ? transactions : [];
  return txs.reduce((sum, t) => sum + getTxAmount(t), 0);
}

/**
 * Totals per category across a list of txs
 */
export function totalsByCategory(transactions) {
  const txs = Array.isArray(transactions) ? transactions : [];
  const totals = Object.fromEntries(CATEGORY_NAMES.map((c) => [c, 0]));

  for (const t of txs) {
    const cat = getTxCategory(t);
    const amt = getTxAmount(t);

    if (!totals[cat]) totals[cat] = 0;
    totals[cat] += amt;
  }

  return totals;
}

/**
 * Convert totals object => recharts pie data
 */
export function pieDataFromTotals(totals) {
  const obj = totals && typeof totals === "object" ? totals : {};
  const out = [];

  for (const [name, value] of Object.entries(obj)) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) {
      out.push({ name, value: num });
    }
  }

  // Keep stable ordering based on CATEGORY_NAMES
  out.sort((a, b) => {
    const ia = CATEGORY_NAMES.indexOf(a.name);
    const ib = CATEGORY_NAMES.indexOf(b.name);
    return ia - ib;
  });

  return out;
}
