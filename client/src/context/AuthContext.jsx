import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("inventra_token"));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(
    Boolean(localStorage.getItem("inventra_token")),
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.data))
      .catch(() => logout())
      .finally(() => setAuthLoading(false));
  }, [token]);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("inventra_token", res.data.data.token);
    setToken(res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  }

  async function register(payload) {
    await api.post("/auth/register", payload);
  }

  async function updateProfile(payload) {
    const res = await api.put("/auth/me", payload);
    setUser(res.data.data);
  }

  async function forgotPassword(email) {
    await api.post("/auth/forgot-password", { email });
  }

  async function resetPassword(token, password) {
    await api.post("/auth/reset-password", { token, password });
  }

  function logout() {
    localStorage.removeItem("inventra_token");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      authLoading,
      login,
      register,
      updateProfile,
      forgotPassword,
      resetPassword,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, user, authLoading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
