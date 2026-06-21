import React, { createContext, useContext, useState, useCallback } from "react";
import * as api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  React.useEffect(() => {
    // We don't store the user object, only the token — on reload, we just
    // know "logged in" until the first auth'd request fails (401), which
    // ProtectedRoute below handles. Keeps this intentionally simple.
    setChecked(true);
  }, []);

  const doLogin = useCallback(async (username, password) => {
    const loggedInUser = await api.login(username, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const doSignup = useCallback(async (username, password) => {
    const newUser = await api.signup(username, password);
    setUser(newUser);
    return newUser;
  }, []);

  const doLogout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isLoggedIn: Boolean(user) || api.isLoggedIn(),
    login: doLogin,
    signup: doSignup,
    logout: doLogout,
    checked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
