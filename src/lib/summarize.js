import { CATEGORIES } from "./categories.js";
import { monthKey, yearKey } from "./dates.js";

export function filterTransactions(transactions, view, selectedDateISO, biweekStartISO, biweekEndISO) {
  if (view === "biweek") {
    return transactions.filter((t) => t.date >= biweekStartISO && t.date <= biweekEndISO);
  }
  if (view === "month") {
    const mk = monthKey(selectedDateISO);
    return transactions.filter((t) => monthKey(t.date) === mk);
  }
  const yk = yearKey(selectedDateISO);
  return transactions.filter((t) => yearKey(t.date) === yk);
}

export function totalsByCategory(transactions) {
  const map = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const t of transactions) {
    map[t.category] = (map[t.category] ?? 0) + Number(t.amount || 0);
  }
  return map;
}

export function totalSpent(transactions) {
  return transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

export function pieDataFromTotals(totalsMap) {
  return Object.entries(totalsMap)
    .map(([name, value]) => ({ name, value: Number(value || 0) }))
    .filter((x) => x.value > 0);
}
