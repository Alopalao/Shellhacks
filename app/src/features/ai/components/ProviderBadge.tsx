// "Claude · evidence-backed" vs "Demo mode · evidence summaries" (from GET /api/ai/status).
import { Badge } from '@/components/ui';
import type { AiStatus } from '@/lib/contracts';

export interface ProviderBadgeProps {
  status: AiStatus | null;
  loading?: boolean;
}

export function ProviderBadge({ status, loading }: ProviderBadgeProps) {
  if (!status) {
    return loading ? <Badge label="Checking AI…" tone="neutral" icon="ellipsis-horizontal" /> : null;
  }
  if (status.provider === 'anthropic') {
    return (
      <Badge
        label="Claude · evidence-backed"
        tone="yellow"
        icon="shield-checkmark"
        accessibilityLabel={`AI provider: Claude${status.model ? ` (${status.model})` : ''}. Answers are backed by cited evidence.`}
      />
    );
  }
  return (
    <Badge
      label="Demo mode · evidence summaries"
      tone="outline"
      icon="flask-outline"
      accessibilityLabel="Demo mode: answers are assembled from evidence summaries without a language model."
    />
  );
}
