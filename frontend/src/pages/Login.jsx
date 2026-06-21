import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-serif text-2xl font-medium mb-1">
        {mode === "login" ? "Welcome back" : "Start your diary"}
      </h1>
      <p className="text-sm text-ink-soft mb-8">
        {mode === "login"
          ? "Log in to see your watchlist and ratings."
          : "Just a username and password — nothing else needed."}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="username" className="text-sm text-ink-soft block mb-1.5">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full border border-rule_soft rounded-lg px-3 py-2 text-sm bg-white focus:border-archive-600 outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm text-ink-soft block mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full border border-rule_soft rounded-lg px-3 py-2 text-sm bg-white focus:border-archive-600 outline-none"
          />
          {mode === "signup" && (
            <p className="text-xs text-ink-faint mt-1.5">At least 6 characters.</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-paper rounded-lg py-2.5 text-sm font-medium mt-2 hover:bg-archive-700 transition-colors disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
        }}
        className="text-sm text-archive-700 mt-6 hover:underline"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
