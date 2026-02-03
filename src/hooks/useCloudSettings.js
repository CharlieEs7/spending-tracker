import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { listenSettings, saveSettings as saveSettingsCloud } from "../lib/cloudStore.js";

const DEFAULT_SETTINGS = {
  anchorStartISO: "2026-01-02",
  defaultPaycheck: 0,
  limitPeriod: "month", // "month" | "biweek"
  categoryLimits: {},
};

export function useCloudSettings() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = listenSettings(uid, (data) => {
      const s = data || {};
      setSettings({
        anchorStartISO: s.anchorStartISO || DEFAULT_SETTINGS.anchorStartISO,
        defaultPaycheck: Number(s.defaultPaycheck || 0),
        limitPeriod: s.limitPeriod === "biweek" ? "biweek" : "month",
        categoryLimits: s.categoryLimits || {},
      });
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  async function update(patch) {
    if (!uid) return;
    const next = { ...settings, ...patch };
    setSettings(next); // optimistic UI
    await saveSettingsCloud(uid, next);
  }

  return useMemo(() => ({ settings, loading, update }), [settings, loading]);
}
