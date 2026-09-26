// Doctor home: the patient list with live presence, adherence, refills and unread messages.
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import {
  doctorHrefs,
  doctorShortName,
  LOW_ADHERENCE,
  PatientCard,
  StatTile,
  useActivityRecorder,
  useLiveEvents,
} from '@/features/doctor';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNow } from '@/hooks/useInterval';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { PatientSummary } from '@/lib/contracts';
import { formatDate, greeting, pluralize } from '@/lib/format';
import { usePresenceMap } from '@/lib/socket';
import { setTabBadge } from '@/lib/tab-badges';
import { spacing } from '@/theme';

type Filter = 'all' | 'online' | 'attention';

const WIDE_MAX_WIDTH = 1120;

/** True when a patient has something for the doctor to act on. */
function needsAttention(s: PatientSummary): boolean {
  return s.pendingRefills > 0 || s.unreadMessages > 0 || (s.adherence7d != null && s.adherence7d < LOW_ADHERENCE);
}

function matchesQuery(s: PatientSummary, q: string): boolean {
  if (!q) return true;
  const p = s.patient;
  const haystack = [p.name, p.email, ...(p.patient?.conditions ?? []), ...(p.patient?.allergies ?? [])]
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export default function DoctorPatientsScreen() {
  const { user } = useAuth();
  const now = useNow(60_000);
  const { isWide } = useBreakpoint();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Record live activity for the Inbox feed from the moment the doctor lands here.
  useActivityRecorder();

  const patientsQuery = useApiQuery(() => api.patients(), []);
  const summaries = useMemo(() => patientsQuery.data ?? [], [patientsQuery.data]);

  // Anything a patient does changes these summaries: refetch quietly (debounced).
  useLiveEvents(
    [
      'presence',
      'refill:upsert',
      'message:new',
      'message:read',
      'dose:logged',
      'dose:removed',
      'prescription:upsert',
      'user:updated',
    ],
    () => void patientsQuery.reload(),
  );

  const ids = useMemo(() => summaries.map((s) => s.patient.id), [summaries]);
  const fallback = useMemo(
    () => Object.fromEntries(summaries.map((s) => [s.patient.id, s.online])) as Record<string, boolean>,
    [summaries],
  );
  const presence = usePresenceMap(ids, fallback);

  const totals = useMemo(
    () => ({
      online: ids.filter((id) => presence[id]).length,
      refills: summaries.reduce((n, s) => n + s.pendingRefills, 0),
      unread: summaries.reduce((n, s) => n + s.unreadMessages, 0),
    }),
    [ids, presence, summaries],
  );

  useEffect(() => {
    if (patientsQuery.data) setTabBadge('doctor/inbox', totals.refills);
  }, [patientsQuery.data, totals.refills]);

  const visible = summaries.filter(
    (s) =>
      matchesQuery(s, query.trim()) &&
      (filter === 'all' || (filter === 'online' ? !!presence[s.patient.id] : needsAttention(s))),
  );
  const attentionCount = summaries.filter(needsAttention).length;

  const title = `${greeting(now)}, ${doctorShortName(user)}`;
  const subtitle = `${formatDate(now, { weekday: true, long: true, omitCurrentYear: true })}${
    patientsQuery.data ? ` · ${pluralize(summaries.length, 'patient')}` : ''
  }`;

  const header = <ScreenHeader title={title} subtitle={subtitle} />;

  if (patientsQuery.loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Loading your patients…" />
      </Screen>
    );
  }

  if (patientsQuery.error && !patientsQuery.data) {
    return (
      <Screen header={header} refreshing={patientsQuery.refreshing} onRefresh={patientsQuery.refresh}>
        <ErrorState error={patientsQuery.error} onRetry={patientsQuery.refresh} />
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      refreshing={patientsQuery.refreshing}
      onRefresh={patientsQuery.refresh}
      maxWidth={isWide ? WIDE_MAX_WIDTH : undefined}
    >
      <View style={styles.stats}>
        <StatTile
          icon="radio-outline"
          value={totals.online}
          label={totals.online === 1 ? 'Patient online' : 'Patients online'}
          live={totals.online > 0}
          accessibilityLabel={`${pluralize(totals.online, 'patient')} online now`}
          accessibilityHint="Shows only online patients"
          onPress={() => setFilter('online')}
        />
        <StatTile
          icon="refresh-circle-outline"
          value={totals.refills}
          label={totals.refills === 1 ? 'Pending refill' : 'Pending refills'}
          highlight={totals.refills > 0}
          accessibilityLabel={`${pluralize(totals.refills, 'pending refill request')}`}
          accessibilityHint="Opens your inbox"
          onPress={() => router.push(doctorHrefs.inbox)}
        />
        <StatTile
          icon="chatbubbles-outline"
          value={totals.unread}
          label={totals.unread === 1 ? 'Unread message' : 'Unread messages'}
          highlight={totals.unread > 0}
          accessibilityLabel={`${pluralize(totals.unread, 'unread message')}`}
          accessibilityHint="Opens your messages"
          onPress={() => router.push('/doctor/messages')}
        />
      </View>

      <View style={styles.controls}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, condition or allergy"
          accessibilityLabel="Search patients"
          leftIcon="search"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          right={
            query ? (
              <IconButton icon="close-circle" size={36} iconSize={20} accessibilityLabel="Clear search" onPress={() => setQuery('')} />
            ) : null
          }
        />
        <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Filter patients">
          <Chip label={`All (${summaries.length})`} selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip
            label={`Online (${totals.online})`}
            icon="radio-outline"
            selected={filter === 'online'}
            onPress={() => setFilter('online')}
          />
          <Chip
            label={`Needs attention (${attentionCount})`}
            icon="alert-circle-outline"
            selected={filter === 'attention'}
            onPress={() => setFilter('attention')}
          />
        </View>
      </View>

      {summaries.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No patients yet"
          message="Patients who choose you as their physician in BRIAN appear here, with live updates as they log doses and send messages."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon="search-outline"
          title="No matching patients"
          message={
            query ? `Nobody matches “${query.trim()}”${filter === 'all' ? '' : ' with this filter'}.` : 'No patients match this filter right now.'
          }
          actionLabel="Show all patients"
          onAction={() => {
            setQuery('');
            setFilter('all');
          }}
        />
      ) : (
        <View style={[styles.list, isWide && styles.grid]} accessibilityRole="list">
          {visible.map((s) => (
            <PatientCard
              key={s.patient.id}
              summary={s}
              online={!!presence[s.patient.id]}
              now={now}
              onPress={() => router.push(doctorHrefs.patient(s.patient.id))}
              style={isWide ? styles.gridItem : undefined}
            />
          ))}
        </View>
      )}

      {patientsQuery.error ? (
        <AppText variant="small" tone="muted" align="center">
          Showing the last loaded list — pull to refresh when you're back online.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm },
  controls: { gap: spacing.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  list: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // Two columns; `maxWidth` keeps an odd last card at half width.
  gridItem: { flexBasis: '40%', flexGrow: 1, maxWidth: '49%' },
});
