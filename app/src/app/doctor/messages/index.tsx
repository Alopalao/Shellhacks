import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { ThreadListItem, useLiveThreads, useTypingThreads } from '@/features/chat';
import { useNow } from '@/hooks/useInterval';
import { useAuth } from '@/lib/auth';
import { pluralize } from '@/lib/format';
import { spacing } from '@/theme';

/** Show a filter box once the list is long enough to need one. */
const SEARCH_THRESHOLD = 6;

export default function DoctorMessagesScreen() {
  const { user } = useAuth();
  const me = user?.id ?? '';
  const live = useLiveThreads();
  const threads = live.threads;
  const typing = useTypingThreads(me);
  const now = useNow(30_000);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!threads || !q) return threads ?? [];
    return threads.filter((t) => t.counterpart.name.toLowerCase().includes(q) || t.counterpart.email.toLowerCase().includes(q));
  }, [threads, query]);

  const subtitle =
    threads && live.totalUnread > 0
      ? `${pluralize(live.totalUnread, 'unread message')}`
      : 'Secure, real-time chat with your patients';

  const header = <ScreenHeader title="Messages" subtitle={subtitle} />;

  if (live.loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Loading conversations…" />
      </Screen>
    );
  }

  if (live.error && !threads) {
    return (
      <Screen header={header} refreshing={live.refreshing} onRefresh={() => void live.refresh()}>
        <ErrorState error={live.error} title="Couldn't load conversations" onRetry={() => void live.refresh()} />
      </Screen>
    );
  }

  return (
    <Screen header={header} refreshing={live.refreshing} onRefresh={() => void live.refresh()}>
      {!threads || threads.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          message="Patients assigned to you appear here. When one messages you, it shows up instantly."
          actionLabel="View patients"
          onAction={() => router.push('/doctor')}
        />
      ) : (
        <>
          {threads.length >= SEARCH_THRESHOLD ? (
            <Input
              leftIcon="search"
              placeholder="Search patients"
              value={query}
              onChangeText={setQuery}
              accessibilityLabel="Search conversations by patient name"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          ) : null}
          {visible.length === 0 ? (
            <EmptyState compact icon="search" title="No matches" message={`No patient matches “${query.trim()}”.`} />
          ) : (
            <Card variant="default" padding="xs">
              {visible.map((thread, i) => (
                <View key={thread.id}>
                  {i > 0 ? <Divider inset={76} /> : null}
                  <ThreadListItem
                    thread={thread}
                    me={me}
                    typing={!!typing[thread.id]}
                    now={now}
                    onPress={() => router.push(`/doctor/messages/${encodeURIComponent(thread.id)}`)}
                  />
                </View>
              ))}
            </Card>
          )}
          <AppText variant="caption" tone="subtle" align="center" style={styles.footnote}>
            Conversations are sorted by latest activity and update live.
          </AppText>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footnote: { marginTop: spacing.xs },
});
