import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

const TABS = [
  { to: "/", label: "Library", end: true },
  { to: "/for-you", label: "For you" },
  { to: "/explore", label: "Explore" },
  { to: "/my-list", label: "My list" },
];

export default function NavBar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-rule bg-paper/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-medium">Filmy Diary</span>
            <span className="text-xs text-ink-faint hidden sm:inline">a world cinema ledger</span>
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-sm text-ink-soft hover:text-ink"
            >
              Log out
            </button>
          ) : (
            <NavLink to="/login" className="text-sm text-archive-700 font-medium hover:underline">
              Log in
            </NavLink>
          )}
        </div>

        <nav className="flex gap-5 -mb-px overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `text-sm py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-ink text-ink font-medium"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
