// Authentication state for the whole app. Demo auth: any email + non-empty password → server says `lgtm`.
// The session (token + user) is persisted in AsyncStorage and re-validated against /api/me on launch
// and whenever the server URL changes.
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, isApiRequestError, setAuthToken, setUnauthorizedHandler } from './api';
import type { LoginRequest, LoginResponse, Role, User } from './contracts';
import { loadServerUrl, subscribeServerUrl, getServerUrl } from './server-url';
import { getJSON, removeItem, setJSON, storageKeys } from './storage';

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export interface AuthContextValue {
  /** 'loading' until the saved session has been read from storage. */
  status: AuthStatus;
  /** The signed-in user (non-null whenever status === 'signed-in'). */
  user: User | null;
  /** Bearer token (non-null whenever status === 'signed-in'). */
  token: string | null;
  /** Sign in (or sign up for a new email). Resolves the raw `lgtm` response; throws ApiRequestError. */
  login: (req: LoginRequest) => Promise<LoginResponse>;
  /** Sign out locally (server logout is best-effort). */
  logout: () => Promise<void>;
  /** Re-fetch /api/me. Resolves the fresh user, or null if signed out / unreachable. */
  refreshUser: () => Promise<User | null>;
  /** Replace the cached user (e.g. after `api.updateMe`). Persisted. */
  setUser: (user: User) => void;
}

interface StoredSession {
  token: string;
  user: User;
}

interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<StoredSession>;
  return typeof v.token === 'string' && !!v.token && !!v.user && typeof v.user.id === 'string';
}

/** Home route for a role: `/patient` or `/doctor`. */
export function homeHrefForRole(role: Role): '/patient' | '/doctor' {
  return role === 'doctor' ? '/doctor' : '/patient';
}

/** Profile route for a role: `/patient/profile` or `/doctor/profile`. */
export function profileHrefForRole(role: Role): '/patient/profile' | '/doctor/profile' {
  return role === 'doctor' ? '/doctor/profile' : '/patient/profile';
}

/** Provides auth state. Must wrap SocketProvider and every screen. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', token: null, user: null });
  // Mirrors state.token for callbacks that must see the latest value without re-subscribing.
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback((session: StoredSession | null) => {
    tokenRef.current = session?.token ?? null;
    setAuthToken(session?.token ?? null);
    setState(
      session
        ? { status: 'signed-in', token: session.token, user: session.user }
        : { status: 'signed-out', token: null, user: null },
    );
  }, []);

  const signOutLocal = useCallback(() => {
    applySession(null);
    void removeItem(storageKeys.session);
  }, [applySession]);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = tokenRef.current;
    if (!token) return null;
    try {
      const user = await api.me();
      if (tokenRef.current !== token) return null; // signed out / switched meanwhile
      setState((s) => (s.status === 'signed-in' ? { ...s, user } : s));
      void setJSON(storageKeys.session, { token, user } satisfies StoredSession);
      return user;
    } catch (error) {
      // 401 is handled by the unauthorized handler; network errors keep the cached session (offline-friendly).
      if (isApiRequestError(error) && error.status === 401 && tokenRef.current === token) signOutLocal();
      return null;
    }
  }, [signOutLocal]);

  // Boot: load saved server URL + session, then validate in the background.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadServerUrl();
      const saved = await getJSON<unknown>(storageKeys.session);
      if (cancelled) return;
      if (isStoredSession(saved)) {
        applySession(saved);
        void refreshUser();
      } else {
        applySession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession, refreshUser]);

  // Any authenticated request that gets a 401 with the current token signs the user out.
  useEffect(() => {
    setUnauthorizedHandler((rejected) => {
      if (rejected === tokenRef.current) signOutLocal();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOutLocal]);

  // Server URL changed → re-validate the session against the new server.
  useEffect(() => {
    let lastUrl = getServerUrl();
    return subscribeServerUrl(() => {
      const next = getServerUrl();
      if (next === lastUrl) return;
      lastUrl = next;
      if (tokenRef.current) void refreshUser();
    });
  }, [refreshUser]);

  const login = useCallback(
    async (req: LoginRequest): Promise<LoginResponse> => {
      const res = await api.login({
        ...req,
        email: req.email.trim().toLowerCase(),
        name: req.name?.trim() || undefined,
      });
      const session: StoredSession = { token: res.token, user: res.user };
      await setJSON(storageKeys.session, session);
      applySession(session);
      return res;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const token = tokenRef.current;
    signOutLocal();
    await removeItem(storageKeys.session);
    if (token) {
      // Best effort, not awaited: the token is already cleared locally, so send it explicitly.
      fetch(`${getServerUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      }).catch(() => {
        // ignore — the local session is gone either way
      });
    }
  }, [signOutLocal]);

  const setUser = useCallback((user: User) => {
    const token = tokenRef.current;
    if (!token) return;
    setState((s) => (s.status === 'signed-in' ? { ...s, user } : s));
    void setJSON(storageKeys.session, { token, user } satisfies StoredSession);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status: state.status, user: state.user, token: state.token, login, logout, refreshUser, setUser }),
    [state, login, logout, refreshUser, setUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

/** Auth state + actions. Throws if used outside AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
  return ctx;
}
