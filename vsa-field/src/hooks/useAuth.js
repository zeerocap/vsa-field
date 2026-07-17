import { useState, useEffect } from "react";
import { getToken, getUser, setAuth, clearAuth } from "../utils/auth.js";
import { loginApi } from "../api/field.api.js";

export function useAuth() {
  const [authUser, setAuthUser] = useState(() => getUser());
  const [token,    setToken]    = useState(() => getToken());
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function login(username, password) {
    setLoading(true); setError(null);
    try {
      const data = await loginApi(username, password);
      setAuth(data.token, data.user);
      setAuthUser(data.user);
      setToken(data.token);
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAuth();
    setAuthUser(null);
    setToken(null);
  }

  return { authUser, token, loading, error, login, logout };
}
