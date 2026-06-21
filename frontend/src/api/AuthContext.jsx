import React, { createContext, useContext, useState, useCallback } from "react";
import * as api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  React.useEffect(() => {
    // On reload, we only have the token, not the user object — fetch it
    // once so the avatar and username show up immediately instead of
    // staying blank until the next login.
    if (api.isLoggedIn()) {
      api
        .getMe()
        .then(setUser)
        .catch(() => {
          // Token is invalid/expired — clear it so the UI doesn't think
          // we're logged in when the backend disagrees.
          api.logout();
        })
        .finally(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, []);

  const doLogin = useCallback(async (username, password) => {
    const loggedInUser = await api.login(username, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const doSignup = useCallback(async (username, password, avatarSeed) => {
    const newUser = await api.signup(username, password, avatarSeed);
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
