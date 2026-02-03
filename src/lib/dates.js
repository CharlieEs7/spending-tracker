const DEFAULT_ANCHOR = "2026-01-02";

export function toISODateOnly(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODateOnly(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a, b) {
  const msDay = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcA - utcB) / msDay);
}

export function getAnchorISO(settings) {
  return settings?.anchorStartISO || DEFAULT_ANCHOR;
}

export function getBiweekStartISO(dateISO, anchorISO) {
  const anchor = parseISODateOnly(anchorISO);
  const d = parseISODateOnly(dateISO);
  const daysSince = diffDays(d, anchor);
  const index = Math.floor(daysSince / 14);
  const start = addDays(anchor, index * 14);
  return toISODateOnly(start);
}

export function getBiweekEndISO(startISO) {
  const start = parseISODateOnly(startISO);
  return toISODateOnly(addDays(start, 13));
}

export function monthKey(dateISO) {
  return dateISO.slice(0, 7); // YYYY-MM
}

export function yearKey(dateISO) {
  return dateISO.slice(0, 4); // YYYY
}
