// Doctor inbox: pending refill requests (approve / deny inline), resolved history, and a
// session-only live activity feed built from socket events.
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import {
  ActivityFeed,
  doctorHrefs,
  medLabel,
  RefillRequestCard,
  ResolvedRefillRow,
  upsertById,
  useActivityFeed,
  useActivityRecorder,
  type ActivityDirectory,
} from '@/features/doctor';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNow } from '@/hooks/useInterval';
import { api } from '@/lib/api';
import type { PatientSummary, Prescription, RefillRequest } from '@/lib/contracts';
import { pluralize } from '@/lib/format';
import { useSocket, useSocketEvent } from '@/lib/socket';
import { setTabBadge } from '@/lib/tab-badges';
import { spacing } from '@/theme';

const HISTORY_PREVIEW = 5;
const WIDE_MAX_WIDTH = 1120;

interface InboxData {
  refills: RefillRequest[];
  patients: PatientSummary[];
  prescriptions: Prescription[];
}

/** Refills + the patient/prescription directory needed to label them. */
async function loadInbox(): Promise<InboxData> {
  const [refills, patients] = await Promise.all([api.refills(), api.patients()]);
  const lists = await Promise.all(patients.map((s) => api.prescriptions(s.patient.id).catch(() => [] as Prescription[])));
  return { refills, patients, prescriptions: lists.flat() };
}

const byResolvedDesc = (a: RefillRequest, b: RefillRequest) =>
  (b.resolvedAt ?? b.createdAt).localeCompare(a.resolvedAt ?? a.createdAt);

export default function DoctorInboxScreen() {
  useActivityRecorder();
  const now = useNow(30_000);
  const { isWide } = useBreakpoint();
  const { connected } = useSocket();
  const feed = useActivityFeed();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const q = useApiQuery(loadInbox, []);
  const data = q.data;

  const patientsById = useMemo(() => new Map((data?.patients ?? []).map((s) => [s.patient.id, s.patient])), [data?.patients]);
  const rxById = useMemo(() => new Map((data?.prescriptions ?? []).map((p) => [p.id, p])), [data?.prescriptions]);

  // ── Live updates ──
  useSocketEvent('refill:upsert', (refill) => {
    q.setData((d) => (d ? { ...d, refills: upsertById(d.refills, refill) } : d));
    // A request for a patient/prescription we haven't loaded yet → refresh the directory.
    if (data && (!patientsById.has(refill.patientId) || !rxById.has(refill.prescriptionId))) void q.reload();
  });
  useSocketEvent('prescription:upsert', (rx) => {
    q.setData((d) => (d ? { ...d, prescriptions: upsertById(d.prescriptions, rx, 'end') } : d));
  });
  useSocketEvent('user:updated', (user) => {
    if (user.role !== 'patient') return;
    if (data && !patientsById.has(user.id)) {
      void q.reload();
      return;
    }
    q.setData((d) =>
      d ? { ...d, patients: d.patients.map((s) => (s.patient.id === user.id ? { ...s, patient: user } : s)) } : d,
    );
  });

  const pending = useMemo(() => (data?.refills ?? []).filter((r) => r.status === 'pending'), [data?.refills]);
  const resolved = useMemo(
    () => (data?.refills ?? []).filter((r) => r.status !== 'pending').sort(byResolvedDesc),
    [data?.refills],
  );

  useEffect(() => {
    if (data) setTabBadge('doctor/inbox', pending.length);
  }, [data, pending.length]);

  const directory: ActivityDirectory = {
    patientName: (id) => patientsById.get(id)?.name,
    rxLabel: (id) => {
      const rx = rxById.get(id);
      return rx ? medLabel(rx) : undefined;
    },
  };

  const header = <ScreenHeader title="Inbox" subtitle="Refill requests and live patient activity" />;

  if (q.loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Loading your inbox…" />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen header={header} refreshing={q.refreshing} onRefresh={q.refresh}>
        <ErrorState error={q.error} onRetry={q.refresh} />
      </Screen>
    );
  }

  const history = showAllHistory ? resolved : resolved.slice(0, HISTORY_PREVIEW);

  const pendingSection = (
    <View style={styles.column}>
      <SectionHeader
        title="Refill requests"
        icon="refresh-circle-outline"
        subtitle={pending.length ? `${pending.length} waiting for your decision` : 'All caught up'}
      />
      {pending.length === 0 ? (
        <Card variant="muted">
          <EmptyState
            compact
            icon="checkmark-done-outline"
            title="No pending refill requests"
            message="New requests from your patients appear here instantly."
          />
        </Card>
      ) : (
        pending.map((r) => {
          const patient = patientsById.get(r.patientId);
          return (
            <RefillRequestCard
              key={r.id}
              refill={r}
              rx={rxById.get(r.prescriptionId)}
              patientName={patient?.name ?? 'Patient'}
              onOpenPatient={() => router.push(doctorHrefs.patient(r.patientId))}
              onResolved={({ refillRequest, prescription }) =>
                q.setData((d) =>
                  d
                    ? {
                        ...d,
                        refills: upsertById(d.refills, refillRequest),
                        prescriptions: upsertById(d.prescriptions, prescription, 'end'),
                      }
                    : d,
                )
              }
              onStale={() => void q.reload()}
              now={now}
            />
          );
        })
      )}
    </View>
  );

  const historySection = (
    <View style={styles.column}>
      <SectionHeader title="Resolved" icon="archive-outline" subtitle={resolved.length ? undefined : 'Nothing resolved yet'} />
      {resolved.length ? (
        <Card variant="outline" padding="sm">
          {history.map((r, i) => (
            <View key={r.id}>
              {i > 0 ? <Divider /> : null}
              <ResolvedRefillRow
                refill={r}
                rx={rxById.get(r.prescriptionId)}
                patientName={patientsById.get(r.patientId)?.name}
                onPress={() => router.push(doctorHrefs.patient(r.patientId))}
                now={now}
              />
            </View>
          ))}
          {resolved.length > HISTORY_PREVIEW ? (
            <Button
              title={showAllHistory ? 'Show less' : `Show all ${resolved.length}`}
              icon={showAllHistory ? 'chevron-up' : 'chevron-down'}
              variant="ghost"
              size="sm"
              onPress={() => setShowAllHistory((v) => !v)}
            />
          ) : null}
        </Card>
      ) : null}
    </View>
  );

  const activitySection = (
    <View style={styles.column}>
      <View style={styles.activityHeader}>
        <SectionHeader
          title="Live activity"
          icon="pulse-outline"
          subtitle={feed.length ? `${pluralize(feed.length, 'event')} this session` : 'This session'}
          style={styles.flex}
        />
        <Badge
          label={connected ? 'Live' : 'Reconnecting…'}
          tone={connected ? 'success' : 'warning'}
          icon={connected ? 'radio-outline' : 'cloud-offline-outline'}
          accessibilityLabel={connected ? 'Live updates connected' : 'Live updates reconnecting'}
        />
      </View>
      <Card variant="outline" padding="sm">
        <ActivityFeed items={feed} directory={directory} now={now} />
      </Card>
    </View>
  );

  return (
    <Screen
      header={header}
      refreshing={q.refreshing}
      onRefresh={q.refresh}
      maxWidth={isWide ? WIDE_MAX_WIDTH : undefined}
      gap="xl"
    >
      {isWide ? (
        <View style={styles.columns}>
          <View style={[styles.main, styles.stack]}>
            {pendingSection}
            {historySection}
          </View>
          <View style={styles.side}>{activitySection}</View>
        </View>
      ) : (
        <>
          {pendingSection}
          {activitySection}
          {historySection}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.md },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl },
  main: { flex: 3 },
  side: { flex: 2 },
  stack: { gap: spacing.xl },
  activityHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  flex: { flex: 1 },
});
