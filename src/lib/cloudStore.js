import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    getDoc,
  } from "firebase/firestore";
  import { db } from "./firebase.js";
  
  /* -------------------- Transactions -------------------- */
  // Path: users/{uid}/transactions/{txId}
  function txCol(uid) {
    return collection(db, "users", uid, "transactions");
  }
  function txDoc(uid, id) {
    return doc(db, "users", uid, "transactions", id);
  }
  
  export function listenTransactions(uid, cb) {
    const q = query(txCol(uid), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(list);
    });
  }
  
  export async function upsertTransaction(uid, tx) {
    await setDoc(txDoc(uid, tx.id), {
      date: tx.date,
      amount: Number(tx.amount || 0),
      category: tx.category,
      note: tx.note || "",
      updatedAt: Date.now(),
    });
  }
  
  export async function removeTransaction(uid, id) {
    await deleteDoc(txDoc(uid, id));
  }
  
  /* -------------------- Settings -------------------- */
  // Path: users/{uid}/settings/main
  function settingsDoc(uid) {
    return doc(db, "users", uid, "settings", "main");
  }
  
  export function listenSettings(uid, cb) {
    return onSnapshot(settingsDoc(uid), (snap) => {
      cb(snap.exists() ? snap.data() : null);
    });
  }
  
  export async function saveSettings(uid, settings) {
    // merge so we don't wipe fields if we add more later
    await setDoc(settingsDoc(uid), { ...settings, updatedAt: Date.now() }, { merge: true });
  }
  
  // Optional: one-time read (useful for migrations)
  export async function getSettingsOnce(uid) {
    const snap = await getDoc(settingsDoc(uid));
    return snap.exists() ? snap.data() : null;
  }

  export async function updateLastAutoGenerate(uid, isoDate) {
    await setDoc(
      doc(db, "users", uid, "settings", "main"),
      { lastAutoGenerateISO: isoDate },
      { merge: true }
    );
  }
  


  
  /* -------------------- Income by Biweek -------------------- */
  // Path: users/{uid}/incomeByBiweek/{biweekStartISO}
  function incomeCol(uid) {
    return collection(db, "users", uid, "incomeByBiweek");
  }
  function incomeDoc(uid, startISO) {
    return doc(db, "users", uid, "incomeByBiweek", startISO);
  }
  
  export function listenIncomeByBiweek(uid, cb) {
    return onSnapshot(incomeCol(uid), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = Number(data.amount || 0);
      });
      cb(map);
    });
  }
  
  export async function setIncomeForBiweek(uid, startISO, amount) {
    await setDoc(
      incomeDoc(uid, startISO),
      { amount: Number(amount || 0), updatedAt: Date.now() },
      { merge: true }
    );
  }
/* -------------------- Recurring (Subscriptions) -------------------- */
// Path: users/{uid}/recurring/{ruleId}
function recurringCol(uid) {
    return collection(db, "users", uid, "recurring");
  }
  function recurringDoc(uid, id) {
    return doc(db, "users", uid, "recurring", id);
  }
  
  export function listenRecurring(uid, cb) {
    return onSnapshot(recurringCol(uid), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(list);
    });
  }
  
  export async function upsertRecurring(uid, rule) {
    // rule: { id, name, amount, category, cadence, nextRunISO, lastRunISO }
    await setDoc(
      recurringDoc(uid, rule.id),
      {
        name: rule.name,
        amount: Number(rule.amount || 0),
        category: rule.category,
        cadence: rule.cadence, // "monthly" | "biweekly"
        nextRunISO: rule.nextRunISO,
        lastRunISO: rule.lastRunISO || null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }
  
  export async function removeRecurring(uid, id) {
    await deleteDoc(recurringDoc(uid, id));
  }
  