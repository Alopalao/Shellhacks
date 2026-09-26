// Resolves the BRIAN server base URL (no trailing slash, no `/api`).
// Priority: saved override (AsyncStorage) → EXPO_PUBLIC_API_URL → web page host:<port>
// → Expo dev-server host (phones on the same Wi-Fi):<port> → http://localhost:<port>,
// where <port> is EXPO_PUBLIC_API_PORT or 4000. Under `expo start --tunnel` the dev-server host is a
// public tunnel that only carries the app bundle, so the user is asked for the server's address.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { getString, removeItem, setString, storageKeys } from './storage';

/** Port the BRIAN server listens on by default. */
export const DEFAULT_SERVER_PORT = 4000;

function parsePort(value: string | undefined): number | null {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : null;
}

/**
 * Port used for auto-detected server URLs: `EXPO_PUBLIC_API_PORT` (set it in app/.env when the
 * server runs with a different PORT) or 4000.
 */
export const SERVER_PORT = parsePort(process.env.EXPO_PUBLIC_API_PORT) ?? DEFAULT_SERVER_PORT;

/**
 * Where the current URL came from (shown in settings). `tunnel`: the app was loaded through
 * `expo start --tunnel`, which can't reach the server — the user must enter its public address.
 */
export type ServerUrlSource = 'saved' | 'env' | 'web-host' | 'expo-host' | 'tunnel' | 'default';

export interface ServerUrlState {
  /** The URL every request/socket uses right now. */
  url: string;
  /** User-saved override, or null when auto-detected. */
  override: string | null;
  /** What the URL would be without an override. */
  detected: string;
  source: ServerUrlSource;
  /** True once the saved override has been read from storage. */
  ready: boolean;
}

/**
 * Normalize user input into a base URL: trims, adds `http://` when missing, drops trailing
 * slashes and a trailing `/api`. Returns null for empty/invalid input.
 * `normalizeServerUrl('192.168.1.5:4000')` → `'http://192.168.1.5:4000'`.
 */
export function normalizeServerUrl(input: string | null | undefined): string | null {
  let value = (input ?? '').trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `http://${value}`;
  value = value.replace(/\/+$/, '').replace(/\/api$/i, '').replace(/\/+$/, '');
  const match = /^(https?):\/\/([^\s/?#:]+|\[[0-9a-f:]+\])(:\d{1,5})?(\/[^\s?#]*)?$/i.exec(value);
  if (!match) return null;
  return value;
}

function hostFromHostUri(hostUri: string | undefined | null): string | null {
  if (!hostUri) return null;
  const authority = hostUri.replace(/^[a-z]+:\/\//i, '').split('/')[0] ?? '';
  // Bracketed IPv6 literal ("[fe80::1]:8081") keeps its brackets; otherwise drop the port.
  const host = authority.startsWith('[') ? authority.slice(0, authority.indexOf(']') + 1) : authority.split(':')[0];
  return host ? host : null;
}

/**
 * True when a phone can reach `host` directly on the local network: IP literals, single-label
 * names ("my-laptop") and local DNS suffixes. Other names are public DNS — in practice the
 * `expo start --tunnel` host (e.g. *.exp.direct), which only forwards the Metro bundler.
 */
function isLocalNetworkHost(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) return true;
  if (!host.includes('.')) return true;
  return /\.(local|lan|home|internal|localdomain|home\.arpa)$/i.test(host);
}

function detect(): { url: string; source: ServerUrlSource } {
  const fromEnv = normalizeServerUrl(process.env.EXPO_PUBLIC_API_URL);
  if (fromEnv) return { url: fromEnv, source: 'env' };

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      return { url: `${protocol}//${window.location.hostname}:${SERVER_PORT}`, source: 'web-host' };
    }
    return { url: `http://localhost:${SERVER_PORT}`, source: 'default' };
  }

  const host =
    hostFromHostUri(Constants.expoConfig?.hostUri) ??
    hostFromHostUri(Constants.expoGoConfig?.debuggerHost) ??
    hostFromHostUri(Constants.linkingUri);
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    if (isLocalNetworkHost(host)) return { url: `http://${host}:${SERVER_PORT}`, source: 'expo-host' };
    // Tunnel: <tunnel-host>:<port> never answers. Fall back to a URL that fails fast; the login
    // screen and settings ask for the server's public address instead.
    return { url: `http://localhost:${SERVER_PORT}`, source: 'tunnel' };
  }
  // Android emulators reach the host machine at 10.0.2.2.
  if (Platform.OS === 'android' && !Device.isDevice) {
    return { url: `http://10.0.2.2:${SERVER_PORT}`, source: 'default' };
  }
  return { url: `http://localhost:${SERVER_PORT}`, source: 'default' };
}

const detected = detect();

let state: ServerUrlState = {
  url: detected.url,
  override: null,
  detected: detected.url,
  source: detected.source,
  ready: false,
};

const listeners = new Set<() => void>();

function commit(next: Partial<ServerUrlState>) {
  const override = next.override !== undefined ? next.override : state.override;
  state = {
    ...state,
    ...next,
    override,
    url: override ?? detected.url,
    source: override ? 'saved' : detected.source,
  };
  listeners.forEach((l) => l());
}

let loadPromise: Promise<string> | null = null;

/** Read the saved override once (idempotent). Resolves with the effective URL. Called by AuthProvider at startup. */
export function loadServerUrl(): Promise<string> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const saved = normalizeServerUrl(await getString(storageKeys.serverUrl));
      commit({ override: saved, ready: true });
      return state.url;
    })();
  }
  return loadPromise;
}

/** The effective server base URL right now (synchronous). */
export function getServerUrl(): string {
  return state.url;
}

/** Full snapshot (url, override, detected, source, ready). */
export function getServerUrlState(): ServerUrlState {
  return state;
}

/**
 * Save an override (normalized) or pass null/'' to go back to auto-detection.
 * Resolves with the new effective URL. Throws an Error if the input is not a valid URL.
 */
export async function setServerUrl(url: string | null): Promise<string> {
  if (url == null || url.trim() === '') {
    await removeItem(storageKeys.serverUrl);
    commit({ override: null, ready: true });
    return state.url;
  }
  const normalized = normalizeServerUrl(url);
  if (!normalized) throw new Error('Enter a valid server address, e.g. http://192.168.1.23:4000');
  await setString(storageKeys.serverUrl, normalized);
  commit({ override: normalized, ready: true });
  return state.url;
}

/** Subscribe to URL changes. Returns an unsubscribe function. */
export function subscribeServerUrl(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React hook: live server URL state + setter. */
export function useServerUrl(): ServerUrlState & { setServerUrl: typeof setServerUrl } {
  const snapshot = useSyncExternalStore(subscribeServerUrl, getServerUrlState, getServerUrlState);
  return { ...snapshot, setServerUrl };
}
