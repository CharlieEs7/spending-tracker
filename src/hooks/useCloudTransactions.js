import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { listenTransactions } from "../lib/cloudStore.js";

export function useCloudTransactions() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = listenTransactions(uid, (list) => {
      setTransactions(list);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  return { transactions, loading };
}
