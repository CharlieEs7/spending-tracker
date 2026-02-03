import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase.js";

function Tabs() {
  const tabs = [
    { to: "/", label: "Dashboard" },
    { to: "/add", label: "Add" },
    { to: "/transactions", label: "Transactions" },
    { to: "/history", label: "History" },
    { to: "/settings", label: "Settings" },
    { to: "/subscriptions", label: "Subs" },
  ];

  return (
    <>
      {/* Mobile nav: shows on small screens */}
      <nav className="mobileNav" aria-label="Primary">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"}
            className={({ isActive }) =>
              isActive ? "mobileNavLink active" : "mobileNavLink"
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      {/* Desktop sidebar: shows on large screens */}
      <aside className="sidebar" aria-label="Sidebar">
        <div className="sidebarBrand">
          <div className="sidebarTitle">Spending Tracker</div>
          <div className="sidebarSub">Personal</div>
        </div>

        <div className="sidebarNav">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === "/"}
              className={({ isActive }) =>
                isActive ? "sideLink active" : "sideLink"
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebarFooter">
          <div className="userCard">
            <div className="userMeta">
              <div className="userName">{auth.currentUser?.displayName || "User"}</div>
              <div className="userEmail">{auth.currentUser?.email || ""}</div>
            </div>

            <button
              className="btn btnGhost"
              onClick={() => signOut(auth)}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Shell() {
  const location = useLocation();

  return (
    <div className="shell">
      <header className="topBar">
        <div className="topLeft">
          <div className="topTitle">Spending Tracker</div>
        </div>

        <div className="topRight">
          <div className="topPill">
            {auth.currentUser?.displayName
              ? auth.currentUser.displayName.length > 12
                ? auth.currentUser.displayName.slice(0, 12) + "…"
                : auth.currentUser.displayName
              : "User"}
          </div>

          <button
            className="btn btnPrimaryOutline"
            onClick={() => signOut(auth)}
            type="button"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="shellBody">
        <Tabs />

        <main className="content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
