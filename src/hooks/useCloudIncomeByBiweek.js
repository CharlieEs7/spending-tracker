import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { listenIncomeByBiweek, setIncomeForBiweek } from "../lib/cloudStore.js";

export function useCloudIncomeByBiweek() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [incomeByBiweek, setIncomeByBiweekState] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setIncomeByBiweekState({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = listenIncomeByBiweek(uid, (map) => {
      setIncomeByBiweekState(map);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  async function setForBiweek(startISO, amount) {
    if (!uid) return;
    // optimistic update
    setIncomeByBiweekState((prev) => ({ ...prev, [startISO]: Number(amount || 0) }));
    await setIncomeForBiweek(uid, startISO, amount);
  }

  return useMemo(() => ({ incomeByBiweek, loading, setForBiweek }), [incomeByBiweek, loading]);
}
