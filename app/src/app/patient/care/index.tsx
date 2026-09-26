import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Card,
  Disclaimer,
  Divider,
  EmergencyStrip,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import { CHAT_EMERGENCY_NOTE, PhysicianCard, useLiveThreads, useTypingThreads } from '@/features/chat';
import { NoteListItem, patientNoteHref } from '@/features/notes';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { User } from '@/lib/contracts';
import { displayName } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';
import { spacing } from '@/theme';

export default function CareScreen() {
  const { user } = useAuth();
  const me = user?.id ?? '';

  const live = useLiveThreads();
  const thread = live.threads?.[0] ?? null;
  const doctor = thread?.counterpart ?? null;
  const typingThreads = useTypingThreads(me);
  const typing = !!thread && !!typingThreads[thread.id];

  const notesQuery = useApiQuery(() => api.notes(), [me], { enabled: !!me });
  // Author names for notes written by a previous physician (optional — failures are ignored).
  const doctorsQuery = useApiQuery(() => api.doctors(), [me], { enabled: !!me, refetchOnFocus: false });
  const [liveNoteIds, setLiveNoteIds] = useState<ReadonlySet<string>>(() => new Set());

  useSocketEvent('note:new', (note) => {
    if (note.patientId !== me) return;
    notesQuery.setData((prev) => (prev && !prev.some((n) => n.id === note.id) ? [note, ...prev] : prev));
    setLiveNoteIds((prev) => new Set(prev).add(note.id));
  });

  const notes = useMemo(
    () => [...(notesQuery.data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [notesQuery.data],
  );

  const authors = useMemo(() => {
    const map = new Map<string, User>();
    for (const d of doctorsQuery.data ?? []) map.set(d.id, d);
    if (doctor) map.set(doctor.id, doctor);
    return map;
  }, [doctorsQuery.data, doctor]);

  const refreshing = live.refreshing || notesQuery.refreshing;
  const refresh = () => {
    void live.refresh();
    void notesQuery.refresh();
  };

  const header = <ScreenHeader title="Care" subtitle="Your doctor, messages and visit notes" />;

  if (live.loading && notesQuery.loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Loading your care team…" />
      </Screen>
    );
  }

  if (live.error && !live.threads) {
    return (
      <Screen header={header} refreshing={refreshing} onRefresh={refresh}>
        <ErrorState error={live.error} title="Couldn't load your care team" onRetry={refresh} />
      </Screen>
    );
  }

  return (
    <Screen header={header} refreshing={refreshing} onRefresh={refresh}>
      {doctor ? (
        <PhysicianCard
          doctor={doctor}
          thread={thread}
          me={me}
          typing={typing}
          onMessage={() => router.push('/patient/care/chat')}
        />
      ) : live.loading ? (
        <LoadingState label="Loading your physician…" fill={false} />
      ) : (
        <Card variant="yellow">
          <EmptyState
            compact
            icon="person-add-outline"
            title="No physician assigned yet"
            message="Choose your doctor to start messaging and receive visit notes."
            actionLabel="Choose a doctor"
            onAction={() => router.push('/patient/profile')}
          />
        </Card>
      )}

      <Disclaimer compact text={CHAT_EMERGENCY_NOTE} />

      <View style={styles.section}>
        <SectionHeader
          title="Visit notes"
          icon="document-text-outline"
          subtitle="Notes from your appointments. Open one to decode the jargon or have BRIAN explain it."
        />
        {notesQuery.loading ? (
          <LoadingState label="Loading notes…" fill={false} />
        ) : notesQuery.error && !notesQuery.data ? (
          <Card variant="outline" padding="sm">
            <ErrorState compact error={notesQuery.error} title="Couldn't load notes" onRetry={() => void notesQuery.refresh()} />
          </Card>
        ) : notes.length === 0 ? (
          <Card variant="outline" padding="sm">
            <EmptyState
              compact
              icon="document-text-outline"
              title="No visit notes yet"
              message={
                doctor
                  ? `When ${displayName(doctor)} writes up a visit, it will appear here right away.`
                  : 'When your doctor writes up a visit, it will appear here right away.'
              }
            />
          </Card>
        ) : (
          <Card variant="default" padding="xs">
            {notes.map((note, i) => {
              const author = authors.get(note.doctorId);
              return (
                <View key={note.id}>
                  {i > 0 ? <Divider inset={64} /> : null}
                  <NoteListItem
                    note={note}
                    doctorName={author ? displayName(author) : null}
                    isNew={liveNoteIds.has(note.id)}
                    onPress={() => router.push(patientNoteHref(note.id))}
                  />
                </View>
              );
            })}
          </Card>
        )}
      </View>

      <EmergencyStrip compact />
      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
});
