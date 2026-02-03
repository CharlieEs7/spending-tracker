import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Shell from "./layout/Shell.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AddSpending from "./pages/AddSpending.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import Transactions from "./pages/Transactions.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddSpending />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
