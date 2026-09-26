import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { ChatThread, useLiveThreads } from '@/features/chat';

/**
 * The patient's conversation with their physician. Patients have exactly one thread.
 * Params: `focus=1` focuses the composer, `draft=` prefills it.
 */
export default function PatientChatScreen() {
  const { focus, draft } = useLocalSearchParams<{ focus?: string; draft?: string }>();
  const live = useLiveThreads();
  const thread = live.threads?.[0];

  if (thread) {
    return (
      <ChatThread
        key={thread.id}
        thread={thread}
        backHref="/patient/care"
        autoFocus={focus === '1'}
        initialDraft={typeof draft === 'string' ? draft : undefined}
      />
    );
  }

  const header = <ScreenHeader title="Messages" back="/patient/care" />;

  if (live.loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Opening your conversation…" />
      </Screen>
    );
  }

  if (live.error && !live.threads) {
    return (
      <Screen header={header} scroll={false}>
        <ErrorState error={live.error} title="Couldn't open your messages" onRetry={() => void live.refresh()} />
      </Screen>
    );
  }

  return (
    <Screen header={header} scroll={false}>
      <EmptyState
        icon="person-add-outline"
        title="No physician assigned yet"
        message="Choose your doctor in your profile to start a secure conversation."
        actionLabel="Choose a doctor"
        onAction={() => router.push('/patient/profile')}
      />
    </Screen>
  );
}
