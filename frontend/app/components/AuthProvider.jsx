"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const AuthContext = createContext(null);
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function readResponse(response) {
  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}

function createResponseError(response, payload) {
  const errorMessage = payload?.error?.message || "The request could not be completed.";
  const error = new Error(errorMessage);
  error.status = response.status;
  error.code = payload?.error?.code;
  return error;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const accessTokenRef = useRef(null);
  const csrfTokenRef = useRef(null);
  const initializationRef = useRef(null);

  const saveSession = useCallback((session) => {
    accessTokenRef.current = session.accessToken;
    csrfTokenRef.current = session.csrfToken;
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
  }, []);

  const requestCsrfToken = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const payload = await readResponse(response);

    if (!response.ok || !payload?.csrfToken) {
      throw createResponseError(response, payload);
    }

    csrfTokenRef.current = payload.csrfToken;
    return payload.csrfToken;
  }, []);

  const refreshSession = useCallback(async () => {
    const csrfToken = await requestCsrfToken();
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRF-Token": csrfToken,
      },
    });
    const payload = await readResponse(response);

    if (!response.ok || !payload?.accessToken) {
      return false;
    }

    saveSession(payload);
    return true;
  }, [requestCsrfToken, saveSession]);

  const getAccessToken = useCallback(async () => {
    const currentToken = accessTokenRef.current;
    if (currentToken) {
      try {
        const payload = JSON.parse(window.atob(currentToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload.exp * 1000 > Date.now() + 30000) return currentToken;
      } catch {}
    }
    try {
      const sessionWasRefreshed = await refreshSession();
      return sessionWasRefreshed ? accessTokenRef.current : null;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession, refreshSession]);

  const request = useCallback(async (path, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const needsCsrfToken = !SAFE_METHODS.has(method);
    const canRefreshAfterUnauthorized = options.retryOnUnauthorized !== false
      && !path.startsWith("/auth/login")
      && !path.startsWith("/auth/register")
      && !path.startsWith("/auth/refresh");

    if (needsCsrfToken) {
      await requestCsrfToken();
    }

    const sendRequest = async () => {
      const headers = new Headers(options.headers || {});
      const hasBody = options.body !== undefined && options.body !== null;
      const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

      if (hasBody && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      if (options.auth !== false && accessTokenRef.current) {
        headers.set("Authorization", `Bearer ${accessTokenRef.current}`);
      }

      if (needsCsrfToken) {
        headers.set("X-CSRF-Token", csrfTokenRef.current);
      }

      return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        method,
        headers,
        credentials: "include",
      });
    };

    let response = await sendRequest();

    if (response.status === 401 && canRefreshAfterUnauthorized) {
      const sessionWasRefreshed = await refreshSession();

      if (sessionWasRefreshed) {
        response = await sendRequest();
      } else {
        clearSession();
      }
    }

    const payload = await readResponse(response);
    if (!response.ok) {
      throw createResponseError(response, payload);
    }

    return payload;
  }, [clearSession, refreshSession, requestCsrfToken]);

  const login = useCallback(async (credentials) => {
    const session = await request("/auth/login", {
      method: "POST",
      auth: false,
      retryOnUnauthorized: false,
      body: JSON.stringify(credentials),
    });

    saveSession(session);
    return session.user;
  }, [request, saveSession]);

  const register = useCallback(async (registration) => {
    return request("/auth/register", {
      method: "POST",
      auth: false,
      retryOnUnauthorized: false,
      body: JSON.stringify(registration),
    });
  }, [request]);

  const verifyEmail = useCallback(async (verification) => {
    return request("/auth/verify-email", {
      method: "POST",
      auth: false,
      retryOnUnauthorized: false,
      body: JSON.stringify(verification),
    });
  }, [request]);

  const resendVerification = useCallback(async (verification) => {
    return request("/auth/resend-verification", {
      method: "POST",
      auth: false,
      retryOnUnauthorized: false,
      body: JSON.stringify(verification),
    });
  }, [request]);

  const logout = useCallback(async () => {
    try {
      await request("/auth/logout", {
        method: "POST",
        auth: false,
        retryOnUnauthorized: false,
      });
    } finally {
      clearSession();
    }
  }, [clearSession, request]);

  const deleteAccount = useCallback(async () => {
    await request("/auth/me", { method: "DELETE" });
    clearSession();
  }, [clearSession, request]);

  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = (async () => {
        try {
          await requestCsrfToken();
          await refreshSession();
        } catch {
          clearSession();
        } finally {
          setIsReady(true);
        }
      })();
    }
  }, [clearSession, refreshSession, requestCsrfToken]);

  const contextValue = useMemo(() => ({
    user,
    isReady,
    isAuthenticated: Boolean(user),
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    deleteAccount,
    request,
    getAccessToken,
  }), [user, isReady, login, register, verifyEmail, resendVerification, logout, deleteAccount, request, getAccessToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return auth;
}
