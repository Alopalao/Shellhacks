import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState, ErrorState, IconButton, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { ChatThread, useLiveThreads } from '@/features/chat';
import { displayName } from '@/lib/format';

/** Doctor ↔ patient conversation, with a shortcut to the patient's chart. Params: `draft=` prefills the composer. */
export default function DoctorThreadScreen() {
  const { threadId, draft } = useLocalSearchParams<{ threadId: string; draft?: string }>();
  const live = useLiveThreads();
  const thread = live.threads?.find((t) => t.id === threadId);

  if (thread) {
    const name = displayName(thread.counterpart);
    const chartHref = `/doctor/patients/${encodeURIComponent(thread.patientId)}`;
    const openChart = () => router.push(chartHref);
    return (
      <ChatThread
        key={thread.id}
        thread={thread}
        backHref="/doctor/messages"
        initialDraft={typeof draft === 'string' ? draft : undefined}
        onPressCounterpart={openChart}
        counterpartHint={`Opens ${name}'s chart`}
        headerRight={
          <IconButton
            icon="clipboard-outline"
            variant="outline"
            accessibilityLabel={`Open ${name}'s chart`}
            onPress={openChart}
          />
        }
      />
    );
  }

  const header = <ScreenHeader title="Conversation" back="/doctor/messages" />;

  if (live.loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Opening conversation…" />
      </Screen>
    );
  }

  if (live.error && !live.threads) {
    return (
      <Screen header={header} scroll={false}>
        <ErrorState error={live.error} title="Couldn't open this conversation" onRetry={() => void live.refresh()} />
      </Screen>
    );
  }

  return (
    <Screen header={header} scroll={false}>
      <EmptyState
        icon="chatbubbles-outline"
        title="Conversation not found"
        message="This patient may no longer be assigned to you."
        actionLabel="All messages"
        onAction={() => router.replace('/doctor/messages')}
      />
    </Screen>
  );
}
