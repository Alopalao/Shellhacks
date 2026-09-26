// Data-fetching hook for GET-style calls: loading / error / pull-to-refresh / focus + reconnect refetch.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type SetStateAction } from 'react';
import { useSocket } from '@/lib/socket';

export interface UseApiQueryOptions<T> {
  /** Skip fetching while false (e.g. until an id is known). Default true. */
  enabled?: boolean;
  /** Silently refetch when the screen regains focus. Default true. */
  refetchOnFocus?: boolean;
  /** Silently refetch after the realtime socket reconnects. Default true. */
  refetchOnReconnect?: boolean;
  /** Keep showing the previous data while deps change (instead of resetting to loading). Default false. */
  keepPreviousData?: boolean;
  /** Minimum ms between focus-triggered refetches. Default 2000. */
  focusThrottleMs?: number;
  /** Called after every successful fetch. */
  onSuccess?: (data: T) => void;
}

export interface UseApiQueryResult<T> {
  /** Latest data (undefined until the first successful load). */
  data: T | undefined;
  /** Last error (cleared on the next success). Use `errorMessage(error)` or `<ErrorState error={error} />`. */
  error: unknown;
  /** True during the first load (no data yet). */
  loading: boolean;
  /** True while a user-initiated `refresh()` (pull-to-refresh) is running. */
  refreshing: boolean;
  /** Refetch with the pull-to-refresh indicator. */
  refresh: () => Promise<void>;
  /** Refetch silently (no indicators), e.g. after a mutation or a socket event. */
  reload: () => Promise<void>;
  /** Locally update data (optimistic updates, applying socket events). */
  setData: (update: SetStateAction<T | undefined>) => void;
}

type RunMode = 'initial' | 'refresh' | 'silent';

function depsKey(deps: readonly unknown[]): string {
  try {
    return JSON.stringify(deps);
  } catch {
    return String(deps.length);
  }
}

/**
 * Run an async fetcher and track its state. Refetches when `deps` change (compared by value),
 * when the screen regains focus, and after a socket reconnect.
 *
 *   const { data, loading, error, refreshing, refresh, setData } =
 *     useApiQuery(() => api.prescriptions(patientId), [patientId], { enabled: !!patientId });
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
  options: UseApiQueryOptions<T> = {},
): UseApiQueryResult<T> {
  const {
    enabled = true,
    refetchOnFocus = true,
    refetchOnReconnect = true,
    keepPreviousData = false,
    focusThrottleMs = 2_000,
    onSuccess,
  } = options;
  const key = depsKey(deps);

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [refreshing, setRefreshing] = useState(false);

  // Latest inputs, readable from stable callbacks.
  const latest = useRef({ fetcher, onSuccess, enabled, refetchOnFocus, refetchOnReconnect, focusThrottleMs });
  useLayoutEffect(() => {
    latest.current = { fetcher, onSuccess, enabled, refetchOnFocus, refetchOnReconnect, focusThrottleMs };
  });

  const requestId = useRef(0);
  const mounted = useRef(true);
  const lastFetchAt = useRef(0);
  const hasFetched = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (mode: RunMode): Promise<void> => {
    if (!latest.current.enabled) return;
    const id = ++requestId.current;
    lastFetchAt.current = Date.now();
    if (mode === 'refresh') setRefreshing(true);
    try {
      const result = await latest.current.fetcher();
      if (!mounted.current || id !== requestId.current) return;
      setData(result);
      setError(null);
      latest.current.onSuccess?.(result);
    } catch (e) {
      if (!mounted.current || id !== requestId.current) return;
      setError(e);
    } finally {
      if (mounted.current) {
        if (id === requestId.current) setLoading(false);
        if (mode === 'refresh') setRefreshing(false);
      }
    }
  }, []);

  // Initial load + whenever deps/enabled change.
  useEffect(() => {
    if (!enabled) {
      requestId.current += 1; // drop in-flight results
      setLoading(false);
      return;
    }
    if (!keepPreviousData) {
      setData(undefined);
      setError(null);
    }
    setLoading(true);
    hasFetched.current = true;
    void run('initial');
  }, [key, enabled, keepPreviousData, run]);

  // Silent refetch when the screen regains focus (throttled; the first focus is covered above).
  useFocusEffect(
    useCallback(() => {
      const { refetchOnFocus: onFocus, enabled: on, focusThrottleMs: throttle } = latest.current;
      if (!onFocus || !on || !hasFetched.current) return;
      if (Date.now() - lastFetchAt.current < throttle) return;
      void run('silent');
    }, [run]),
  );

  // Silent refetch after a socket reconnect (not on the very first connect).
  const { connectCount } = useSocket();
  const seenConnectCount = useRef(connectCount);
  useEffect(() => {
    const changed = connectCount !== seenConnectCount.current;
    seenConnectCount.current = connectCount;
    if (!changed || connectCount <= 1) return;
    if (latest.current.refetchOnReconnect && latest.current.enabled && hasFetched.current) void run('silent');
  }, [connectCount, run]);

  const refresh = useCallback(() => run('refresh'), [run]);
  const reload = useCallback(() => run('silent'), [run]);

  return {
    data,
    error,
    loading: enabled && loading && data === undefined,
    refreshing,
    refresh,
    reload,
    setData,
  };
}
