import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncActionState<Args extends unknown[], R> {
  /** Run the action. Resolves the result, or `undefined` if it threw (the error is stored in `error`). */
  run: (...args: Args) => Promise<R | undefined>;
  /** True while running (use for Button `loading`). Concurrent calls are ignored while pending. */
  pending: boolean;
  /** Last error thrown, cleared on the next run. */
  error: unknown;
  /** Clear `error`. */
  reset: () => void;
}

/**
 * Wrap a mutation (button press) with pending/error state:
 *
 *   const toast = useToast();
 *   const refill = useAsyncAction((id: string) => api.createRefill({ prescriptionId: id }), {
 *     onError: (e) => toast.error('Could not request a refill', errorMessage(e)),
 *   });
 *   <Button title="Request refill" loading={refill.pending} onPress={async () => {
 *     if (await refill.run(rx.id)) toast.success('Refill requested');
 *   }} />
 *
 * `run` resolves `undefined` on failure (and while another call is still pending), so check the result.
 */
export function useAsyncAction<Args extends unknown[], R>(
  action: (...args: Args) => Promise<R>,
  options: { onError?: (error: unknown) => void } = {},
): AsyncActionState<Args, R> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const latest = useRef({ action, onError: options.onError });
  useEffect(() => {
    latest.current = { action, onError: options.onError };
  });
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args: Args): Promise<R | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      return await latest.current.action(...args);
    } catch (e) {
      if (mounted.current) setError(e);
      latest.current.onError?.(e);
      return undefined;
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);
  return { run, pending, error, reset };
}
