import { useEffect } from "react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { listenRecurring, upsertRecurring, upsertTransaction, updateLastAutoGenerate } from "../lib/cloudStore.js";
import { uid as makeId } from "../lib/storage.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(iso) {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  if (d.getDate() !== day) d.setDate(0);
  return d.toISOString().slice(0, 10);
}

function nextDate(iso, cadence) {
  return cadence === "biweekly" ? addDays(iso, 14) : addMonths(iso);
}

export function useAutoGenerateSubscriptions(settings) {
  const { user } = useAuth();
  const uid = user?.uid;

  useEffect(() => {
    if (!uid || !settings) return;

    const today = todayISO();
    if (settings.lastAutoGenerateISO === today) return;

    const unsub = listenRecurring(uid, async (rules) => {
      for (const r of rules) {
        if (r.nextRunISO && r.nextRunISO <= today) {
          await upsertTransaction(uid, {
            id: makeId(),
            date: r.nextRunISO,
            category: r.category,
            amount: Number(r.amount || 0),
            note: r.name,
          });

          await upsertRecurring(uid, {
            ...r,
            lastRunISO: r.nextRunISO,
            nextRunISO: nextDate(r.nextRunISO, r.cadence),
          });
        }
      }

      await updateLastAutoGenerate(uid, today);
      unsub(); // run once
    });

    return () => unsub();
  }, [uid, settings]);
}
