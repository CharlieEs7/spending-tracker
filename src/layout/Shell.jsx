import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useCloudSettings } from "../hooks/useCloudSettings.js";
import { useAutoGenerateSubscriptions } from "../hooks/useAutoGenerateSubscriptions.js";


export default function Shell() {
  const { user, logout } = useAuth();

  const { settings } = useCloudSettings();
  useAutoGenerateSubscriptions(settings);


  return (
    <div style={page}>
      {/* Header */}
      <header style={header}>
        <div style={headerInner}>
          <div style={brand}>Spending Tracker</div>

          {/* Navigation */}
          <nav style={nav}>
            <NavItem to="/">Dashboard</NavItem>
            <NavItem to="/add">Add</NavItem>
            <NavItem to="/transactions">Transactions</NavItem>
            <NavItem to="/history">History</NavItem>
            <NavItem to="/settings">Settings</NavItem>
            <NavItem to="/subscriptions">Subscriptions</NavItem>
          </nav>

          {/* User / Logout */}
          <div style={userBox}>
            <div style={userName}>
              {user?.displayName || user?.email}
            </div>
            <button onClick={logout} style={logoutBtn}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={main}>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...navLink,
        ...(isActive ? navLinkActive : {}),
      })}
    >
      {children}
    </NavLink>
  );
}

/* -------------------- styles -------------------- */

const page = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const header = {
  borderBottom: "1px solid #e5e7eb",
  background: "#fff",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const headerInner = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "12px 16px",
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: 16,
};

const brand = {
  fontWeight: 900,
  fontSize: 16,
};

const nav = {
  display: "flex",
  gap: 12,
  justifyContent: "center",
  flexWrap: "wrap",
};

const navLink = {
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: "#111",
  fontWeight: 700,
};

const navLinkActive = {
  background: "#111",
  color: "#fff",
};

const userBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const userName = {
  fontSize: 12,
  color: "#6b7280",
  maxWidth: 180,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const logoutBtn = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const main = {
  flex: 1,
  maxWidth: 1200,
  margin: "0 auto",
  padding: 16,
  width: "100%",
};
