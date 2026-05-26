import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiRequest } from "../lib/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isInitializing, setIsInitializing] = useState(Boolean(getStoredToken()));

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const applyScanHistory = useCallback((nextHistory) => {
    setScanHistory(Array.isArray(nextHistory) ? nextHistory : []);
  }, []);

  const prependScanHistoryItem = useCallback((scan) => {
    if (!scan) {
      return;
    }

    setScanHistory((current) => [scan, ...current]);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setToken("");
    setUser(null);
    setScanHistory([]);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setScanHistory([]);
      setIsInitializing(false);
      return null;
    }

    setIsInitializing(true);

    try {
      const data = await apiRequest(apiBaseUrl, "/api/auth/me", {}, token);
      setUser(data.user);
      setScanHistory(Array.isArray(data.scanHistory) ? data.scanHistory : []);
      return data.user;
    } catch (error) {
      clearSession();
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [apiBaseUrl, clearSession, token]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setSession = useCallback((nextToken, nextUser, nextHistory = []) => {
    setStoredToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setScanHistory(Array.isArray(nextHistory) ? nextHistory : []);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const register = useCallback(
    async (payload) => {
      const data = await apiRequest(apiBaseUrl, "/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSession(data.token, data.user, data.scanHistory);
      return data.user;
    },
    [apiBaseUrl, setSession]
  );

  const login = useCallback(
    async (payload) => {
      const data = await apiRequest(apiBaseUrl, "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSession(data.token, data.user, data.scanHistory);
      return data.user;
    },
    [apiBaseUrl, setSession]
  );

  const createCheckoutSession = useCallback(async () => {
    return apiRequest(
      apiBaseUrl,
      "/api/billing/create-checkout-session",
      { method: "POST" },
      token
    );
  }, [apiBaseUrl, token]);

  const confirmCheckoutSession = useCallback(
    async (sessionId) => {
      const data = await apiRequest(
        apiBaseUrl,
        `/api/billing/checkout-session/${sessionId}`,
        {},
        token
      );

      setUser(data.user);
      return data.user;
    },
    [apiBaseUrl, token]
  );

  const value = useMemo(
    () => ({
      apiBaseUrl,
      applyScanHistory,
      applyUser,
      confirmCheckoutSession,
      createCheckoutSession,
      isAuthenticated: Boolean(token && user),
      isInitializing,
      login,
      logout,
      prependScanHistoryItem,
      refreshUser,
      register,
      scanHistory,
      token,
      user
    }),
    [
      apiBaseUrl,
      applyScanHistory,
      applyUser,
      confirmCheckoutSession,
      createCheckoutSession,
      isInitializing,
      login,
      logout,
      prependScanHistoryItem,
      refreshUser,
      register,
      scanHistory,
      token,
      user
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
