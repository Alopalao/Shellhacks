// GET /api/ai/status → which provider answers (Claude vs. demo-mode evidence summaries).
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import type { AiStatus } from '@/lib/contracts';
import { useServerUrl } from '@/lib/server-url';

export interface AiStatusState {
  status: AiStatus | null;
  loading: boolean;
  error: unknown;
}

/** AI provider status; refetched when the server URL changes, after reconnects and (throttled) on focus. */
export function useAiStatus(): AiStatusState {
  const { url } = useServerUrl();
  const query = useApiQuery(() => api.aiStatus(), [url], { keepPreviousData: true, focusThrottleMs: 60_000 });
  return { status: query.data ?? null, loading: query.loading, error: query.error };
}
