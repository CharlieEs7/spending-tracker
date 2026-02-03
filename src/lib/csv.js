import { money } from "./categories.js";

function escapeCSV(value) {
  const s = String(value ?? "");
  const needsWrap = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsWrap ? `"${escaped}"` : escaped;
}

export function buildTransactionsCSV(transactions, meta = {}) {
  const headerLines = [];
  if (meta.title) headerLines.push(`# ${meta.title}`);
  if (meta.range) headerLines.push(`# Range: ${meta.range}`);
  if (meta.generatedAt) headerLines.push(`# Generated: ${meta.generatedAt}`);
  if (headerLines.length) headerLines.push("");

  const rows = [];
  rows.push(["date", "category", "amount", "note"].map(escapeCSV).join(","));

  for (const t of transactions) {
    rows.push(
      [
        escapeCSV(t.date),
        escapeCSV(t.category),
        escapeCSV(Number(t.amount || 0)),
        escapeCSV(t.note || ""),
      ].join(",")
    );
  }

  const total = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  rows.push("");
  rows.push(["total", "", escapeCSV(total), escapeCSV(money(total))].join(","));

  return headerLines.join("\n") + rows.join("\n");
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
