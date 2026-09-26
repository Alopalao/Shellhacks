import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Disclaimer,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  useToast,
} from '@/components/ui';
import { shortName } from '@/features/chat';
import { JargonDecoder, NoteCard, decodeJargon, explainNoteHref, type JargonMatch } from '@/features/notes';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Thread, User, VisitNote } from '@/lib/contracts';
import { spacing } from '@/theme';

const DECODER_DISCLAIMER =
  'The decoder gives general meanings of common medical shorthand. Your doctor is the best source for what this note means for you. In an emergency, call 911.';

interface NoteScreenData {
  note: VisitNote | null;
  /** The patient's current conversation (for "Ask Dr. …"). */
  thread: Thread | null;
  doctors: User[];
}

function findNote(notes: readonly VisitNote[], id: string): VisitNote | null {
  return notes.find((n) => n.id === id) ?? null;
}

export default function VisitNoteScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === 'string' ? rawId : '';
  const { user } = useAuth();
  const toast = useToast();
  const { isWide } = useBreakpoint();
  const [highlight, setHighlight] = useState(true);
  const [selected, setSelected] = useState<JargonMatch | null>(null);

  const query = useApiQuery<NoteScreenData>(
    async () => {
      const [notes, threads, doctors] = await Promise.all([
        api.notes(),
        api.threads().catch(() => [] as Thread[]),
        api.doctors().catch(() => [] as User[]),
      ]);
      return { note: findNote(notes, id), thread: threads[0] ?? null, doctors };
    },
    [id, user?.id],
    { enabled: !!id && !!user },
  );

  const note = query.data?.note ?? null;
  const thread = query.data?.thread ?? null;
  const doctor = useMemo<User | null>(() => {
    if (!note) return null;
    const fromList = query.data?.doctors.find((d) => d.id === note.doctorId);
    if (fromList) return fromList;
    return thread?.counterpart.id === note.doctorId ? thread.counterpart : null;
  }, [note, thread, query.data?.doctors]);
  const matches = useMemo(() => (note ? decodeJargon(note.body) : []), [note]);

  const askDoctor = thread?.counterpart ?? null;
  const ask = useAsyncAction(
    async () => {
      if (!thread || !note) return null;
      return api.sendMessage(thread.id, {
        body: 'I have a question about this visit note.',
        attachment: { type: 'visit-note', noteId: note.id },
      });
    },
    { onError: (e) => toast.error("Couldn't send your question", errorMessage(e)) },
  );

  const onAsk = async () => {
    const sent = await ask.run();
    if (!sent || !askDoctor) return;
    toast.show({
      kind: 'success',
      title: `Note shared with ${shortName(askDoctor)}`,
      body: 'Type your question in the chat.',
    });
    router.push('/patient/care/chat?focus=1');
  };

  const toggleTerm = (m: JargonMatch | null) => {
    setSelected((prev) => (m && prev?.key !== m.key ? m : null));
  };

  const header = <ScreenHeader title="Visit note" back="/patient/care" />;

  if (query.loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Opening your note…" />
      </Screen>
    );
  }

  if (query.error && !query.data) {
    return (
      <Screen header={header} refreshing={query.refreshing} onRefresh={() => void query.refresh()}>
        <ErrorState error={query.error} title="Couldn't open this note" onRetry={() => void query.refresh()} />
      </Screen>
    );
  }

  if (!note) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="document-text-outline"
          title="Note not found"
          message="This visit note may have been removed, or it belongs to a different account."
          actionLabel="Back to Care"
          onAction={() => router.replace('/patient/care')}
        />
      </Screen>
    );
  }

  const actions = (
    <View style={styles.actions}>
      <Button
        title="Explain this with BRIAN"
        icon="sparkles"
        size="lg"
        fullWidth
        onPress={() => router.push(explainNoteHref(note.id))}
        accessibilityHint="Opens BRIAN AI, which explains this note in plain language"
      />
      {askDoctor ? (
        <Button
          title={`Ask ${shortName(askDoctor)} about this note`}
          icon="chatbubble-ellipses-outline"
          variant="outline"
          size="lg"
          fullWidth
          loading={ask.pending}
          onPress={() => void onAsk()}
          accessibilityHint="Shares this note in your chat so you can ask a question"
        />
      ) : null}
      <AppText variant="caption" tone="subtle" align="center">
        BRIAN is an AI guide, not your doctor — it explains, it doesn&apos;t diagnose.
      </AppText>
    </View>
  );

  const card = (
    <NoteCard
      note={note}
      doctor={doctor}
      highlight={highlight}
      onToggleHighlight={() => {
        setHighlight((h) => !h);
        setSelected(null);
      }}
      selected={selected}
      onSelectTerm={toggleTerm}
    />
  );

  const decoder = (
    <JargonDecoder
      matches={matches}
      selectedKey={selected?.key ?? null}
      onSelect={(m) => {
        if (!highlight) setHighlight(true);
        toggleTerm(m);
      }}
    />
  );

  return (
    <Screen
      header={header}
      refreshing={query.refreshing}
      onRefresh={() => void query.refresh()}
      maxWidth={isWide ? 1080 : undefined}
    >
      {isWide ? (
        <View style={styles.columns}>
          <View style={styles.main}>
            {card}
            {actions}
          </View>
          <View style={styles.side}>
            {decoder}
            <Disclaimer text={DECODER_DISCLAIMER} />
          </View>
        </View>
      ) : (
        <>
          {card}
          {actions}
          {decoder}
          <Disclaimer text={DECODER_DISCLAIMER} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl },
  main: { flex: 3, gap: spacing.lg },
  side: { flex: 2, gap: spacing.lg },
});
