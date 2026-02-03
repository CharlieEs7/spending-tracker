// src/layout/Shell.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useCloudSettings } from "../hooks/useCloudSettings.js";
import { useAutoGenerateSubscriptions } from "../hooks/useAutoGenerateSubscriptions.js";

function TabLink({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        "navLink" + (isActive ? " navLinkActive" : "")
      }
    >
      {label}
    </NavLink>
  );
}

export default function Shell() {
  const { user, signOutUser } = useAuth();
  const { settings } = useCloudSettings();

  // auto-generate subscriptions on app open (once/day)
  useAutoGenerateSubscriptions(settings);

  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <div className="appShell">
      {/* Mobile top nav */}
      <div className="mobileTopbar">
        <div className="mobileBrand">Spending Tracker</div>
        <div className="mobileRight">
          <div className="userChip" title={user?.email || ""}>
            {displayName}
          </div>
          <button className="btn btnGhost" onClick={signOutUser}>
            Sign out
          </button>
        </div>
      </div>

      <div className="mobileNav">
        <TabLink to="/" label="Dashboard" />
        <TabLink to="/add" label="Add" />
        <TabLink to="/transactions" label="Transactions" />
        <TabLink to="/history" label="History" />
        <TabLink to="/settings" label="Settings" />
        <TabLink to="/subscriptions" label="Subs" />
      </div>

      {/* Desktop layout */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brandTitle">Spending Tracker</div>
          <div className="brandSub">Personal</div>
        </div>

        <nav className="nav">
          <TabLink to="/" label="Dashboard" />
          <TabLink to="/add" label="Add" />
          <TabLink to="/transactions" label="Transactions" />
          <TabLink to="/history" label="History" />
          <TabLink to="/settings" label="Settings" />
          <TabLink to="/subscriptions" label="Subscriptions" />
        </nav>

        <div className="sidebarFooter">
          <div className="userRow">
            <div className="userMeta">
              <div className="userName">{displayName}</div>
              <div className="userEmail">{user?.email || ""}</div>
            </div>
            <button className="btn btnGhost" onClick={signOutUser}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
