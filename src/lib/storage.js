const LS_TRANSACTIONS = "st_transactions_v1";
const LS_INCOME = "st_incomeByBiweek_v1";
const LS_SETTINGS = "st_settings_v1";

export function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(LS_TRANSACTIONS)) ?? [];
  } catch {
    return [];
  }
}

export function saveTransactions(list) {
  localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(list));
}

export function loadIncomeByBiweek() {
  try {
    return JSON.parse(localStorage.getItem(LS_INCOME)) ?? {};
  } catch {
    return {};
  }
}

export function saveIncomeByBiweek(map) {
  localStorage.setItem(LS_INCOME, JSON.stringify(map));
}

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(LS_SETTINGS)) ?? {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
}

export function uid() {
  return crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
}
