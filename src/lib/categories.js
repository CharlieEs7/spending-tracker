export const CATEGORIES = [
    { key: "Food", color: "#ef4444" },
    { key: "Transport", color: "#3b82f6" },
    { key: "Entertainment", color: "#a855f7" },
    { key: "Subscriptions", color: "#f59e0b" },
    { key: "Bills", color: "#10b981" },
    { key: "Drinks", color: "#FBFF0A" },
    { key: "Other", color: "#64748b" },
    // Add new ones here 👇
    // { key: "Health", color: "#14b8a6" },
  ];
  
  export const CATEGORY_NAMES = CATEGORIES.map(c => c.key);
  
  export const CATEGORY_COLORS = Object.fromEntries(
    CATEGORIES.map(c => [c.key, c.color])
  );
  
  export function money(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "$0.00";
    return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }
  