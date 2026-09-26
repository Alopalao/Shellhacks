// Patient chart for the doctor: profile, prescriptions, 14-day adherence, refills and visit notes.
// Everything updates live from socket events (doses, refills, prescriptions, notes, profile).
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Avatar,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  InfoRow,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import {
  AdherenceGrid,
  AdherenceLegend,
  ageLabel,
  doctorHrefs,
  isPatientUnavailable,
  paramValue,
  PatientUnavailable,
  PrescriptionCard,
  RefillRequestCard,
  removeById,
  ResolvedRefillRow,
  TagList,
  timeKey,
  upsertById,
  VisitNoteItem,
} from '@/features/doctor';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useNow } from '@/hooks/useInterval';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { PatientDetail, Prescription } from '@/lib/contracts';
import { dateKey, firstName, formatDate, lastNDays, pluralize } from '@/lib/format';
import { usePresence, useSocketEvent } from '@/lib/socket';
import { spacing } from '@/theme';

const GRID_DAYS = 14;
const HISTORY_PREVIEW = 4;

export default function PatientDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const patientId = paramValue(params.id);
  if (!patientId) {
    return (
      <Screen header={<ScreenHeader title="Patient" back={doctorHrefs.patients} />}>
        <ErrorState title="Patient not found" message="This link is missing a patient id." />
      </Screen>
    );
  }
  // Keyed so local UI state resets when the (singular) screen is reused for another patient.
  return <PatientChart key={patientId} patientId={patientId} />;
}

function PatientChart({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const doctorId = user?.id ?? '';
  const now = useNow(60_000);
  const q = useApiQuery(() => api.patient(patientId), [patientId]);
  const detail = q.data;
  const online = usePresence(patientId, detail?.online ?? false);

  const patch = (fn: (d: PatientDetail) => PatientDetail) => q.setData((d) => (d ? fn(d) : d));

  // ── Live updates ──
  useSocketEvent('dose:logged', (dose) => {
    if (dose.patientId === patientId) patch((d) => ({ ...d, doseLogs: upsertById(d.doseLogs, dose) }));
  });
  useSocketEvent('dose:removed', (p) => {
    if (p.patientId === patientId) patch((d) => ({ ...d, doseLogs: removeById(d.doseLogs, p.id) }));
  });
  useSocketEvent('prescription:upsert', (rx) => {
    if (rx.patientId === patientId) patch((d) => ({ ...d, prescriptions: upsertById(d.prescriptions, rx, 'end') }));
  });
  useSocketEvent('refill:upsert', (refill) => {
    if (refill.patientId === patientId) patch((d) => ({ ...d, refillRequests: upsertById(d.refillRequests, refill) }));
  });
  useSocketEvent('note:new', (note) => {
    if (note.patientId === patientId) patch((d) => ({ ...d, notes: upsertById(d.notes, note) }));
  });
  useSocketEvent('user:updated', (updated) => {
    if (updated.id !== patientId) return;
    // Reassigned to another physician → reload (the server will answer 403 and we show why).
    if (updated.doctorId && updated.doctorId !== doctorId) void q.reload();
    else patch((d) => ({ ...d, patient: updated }));
  });

  const upsertRx = (rx: Prescription) => patch((d) => ({ ...d, prescriptions: upsertById(d.prescriptions, rx, 'end') }));

  const back = doctorHrefs.patients;

  if (q.loading) {
    return (
      <Screen header={<ScreenHeader title="Patient" back={back} />} scroll={false}>
        <LoadingState label="Loading chart…" />
      </Screen>
    );
  }
  // Not found / not (or no longer) assigned to this doctor — retrying can't help, and a chart kept
  // from before a reassignment must not stay actionable.
  if (isPatientUnavailable(q.error)) {
    return (
      <Screen header={<ScreenHeader title="Patient" back={back} />}>
        <PatientUnavailable error={q.error} />
      </Screen>
    );
  }
  if (!detail) {
    return (
      <Screen header={<ScreenHeader title="Patient" back={back} />} refreshing={q.refreshing} onRefresh={q.refresh}>
        <ErrorState error={q.error} onRetry={q.refresh} />
      </Screen>
    );
  }

  const { patient } = detail;
  const first = firstName(patient.name) || patient.name;
  const age = ageLabel(patient, now);
  const threadHref = doctorHrefs.thread(patient.id, doctorId);

  return (
    <Screen
      header={
        <ScreenHeader
          title={patient.name}
          subtitle={[age, online ? 'Online now' : 'Offline'].filter(Boolean).join(' · ')}
          back={back}
          right={
            <IconButton
              icon="chatbubble-ellipses-outline"
              variant="yellow"
              accessibilityLabel={`Message ${first}`}
              onPress={() => router.push(threadHref)}
            />
          }
        />
      }
      refreshing={q.refreshing}
      onRefresh={q.refresh}
    >
      {q.error ? (
        <ErrorState compact title="Couldn't refresh this chart" error={q.error} onRetry={q.refresh} retryLabel="Retry" />
      ) : null}

      <ProfileCard detail={detail} online={online} now={now} />

      <View style={styles.actions}>
        <Button
          title="Message"
          icon="chatbubble-ellipses-outline"
          onPress={() => router.push(threadHref)}
          accessibilityLabel={`Message ${first}`}
          style={styles.actionButton}
        />
        <Button
          title="Prescribe"
          icon="add-circle-outline"
          variant="secondary"
          onPress={() => router.push(doctorHrefs.prescribe(patient.id))}
          accessibilityLabel={`Write a new prescription for ${first}`}
          style={styles.actionButton}
        />
        <Button
          title="Write note"
          icon="create-outline"
          variant="outline"
          onPress={() => router.push(doctorHrefs.note(patient.id))}
          accessibilityLabel={`Write a visit note for ${first}`}
          style={styles.actionButton}
        />
      </View>

      <PrescriptionsSection detail={detail} patientFirstName={first} onChanged={upsertRx} />

      <AdherenceSection detail={detail} now={now} />

      <RefillsSection
        detail={detail}
        patientFirstName={first}
        now={now}
        onResolved={({ refillRequest, prescription }) =>
          patch((d) => ({
            ...d,
            refillRequests: upsertById(d.refillRequests, refillRequest),
            prescriptions: upsertById(d.prescriptions, prescription, 'end'),
          }))
        }
        onStale={() => void q.reload()}
      />

      <NotesSection detail={detail} />
    </Screen>
  );
}

// ───────────────────────── Profile ─────────────────────────

function ProfileCard({ detail, online, now }: { detail: PatientDetail; online: boolean; now: Date }) {
  const { patient } = detail;
  const profile = patient.patient;
  const dob = profile?.dateOfBirth;
  const age = ageLabel(patient, now);
  return (
    <Card style={styles.profile}>
      <View style={styles.profileHeader}>
        <Avatar user={patient} size={64} online={online} />
        <View style={styles.flex}>
          <AppText variant="title3">{patient.name}</AppText>
          <AppText variant="small" tone="muted">
            {dob ? `${age ?? ''}${age ? ' · ' : ''}Born ${formatDate(dob)}` : 'Date of birth not recorded'}
          </AppText>
          <AppText variant="small" tone="muted" selectable>
            {patient.email}
          </AppText>
        </View>
      </View>
      <Divider />
      <View style={styles.block}>
        <AppText variant="label">Allergies</AppText>
        <TagList items={profile?.allergies ?? []} variant="allergy" emptyText="No known allergies recorded" />
      </View>
      <View style={styles.block}>
        <AppText variant="label">Conditions</AppText>
        <TagList items={profile?.conditions ?? []} emptyText="No conditions recorded" />
      </View>
      <InfoRow label="Pharmacy" icon="storefront-outline" value={profile?.pharmacy || 'Not set'} />
    </Card>
  );
}

// ───────────────────────── Prescriptions ─────────────────────────

function PrescriptionsSection({
  detail,
  patientFirstName,
  onChanged,
}: {
  detail: PatientDetail;
  patientFirstName: string;
  onChanged: (rx: Prescription) => void;
}) {
  const [showStopped, setShowStopped] = useState(false);
  const patientId = detail.patient.id;
  const pendingRx = useMemo(
    () => new Set(detail.refillRequests.filter((r) => r.status === 'pending').map((r) => r.prescriptionId)),
    [detail.refillRequests],
  );
  const current = detail.prescriptions.filter((p) => !p.selfReported && p.status !== 'discontinued');
  const selfReported = detail.prescriptions.filter((p) => p.selfReported && p.status !== 'discontinued');
  const stopped = detail.prescriptions.filter((p) => p.status === 'discontinued');
  const activeCount = current.filter((p) => p.status === 'active').length;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Prescriptions"
        icon="medkit-outline"
        subtitle={`${activeCount} active${current.length > activeCount ? ` · ${current.length - activeCount} paused` : ''}`}
        actionLabel="Add"
        onAction={() => router.push(doctorHrefs.prescribe(patientId))}
      />
      {current.length === 0 ? (
        <Card variant="muted">
          <EmptyState
            compact
            icon="medkit-outline"
            title="No active prescriptions"
            message={`Prescriptions you write for ${patientFirstName} show up here and on their phone instantly.`}
            actionLabel="Prescribe"
            onAction={() => router.push(doctorHrefs.prescribe(patientId))}
          />
        </Card>
      ) : (
        current.map((rx) => (
          <PrescriptionCard
            key={rx.id}
            rx={rx}
            patientFirstName={patientFirstName}
            onChanged={onChanged}
            refillPending={pendingRx.has(rx.id)}
            onEdit={() => router.push(doctorHrefs.prescribe(patientId, rx.id))}
          />
        ))
      )}

      {selfReported.length ? (
        <View style={styles.subsection}>
          <AppText variant="label" tone="muted">
            Self-reported by {patientFirstName} (OTC & supplements)
          </AppText>
          {selfReported.map((rx) => (
            <PrescriptionCard key={rx.id} rx={rx} patientFirstName={patientFirstName} onChanged={onChanged} readOnly />
          ))}
        </View>
      ) : null}

      {stopped.length ? (
        <View style={styles.subsection}>
          <Button
            title={showStopped ? 'Hide discontinued' : `Show ${pluralize(stopped.length, 'discontinued medication')}`}
            icon={showStopped ? 'chevron-up' : 'chevron-down'}
            variant="ghost"
            size="sm"
            onPress={() => setShowStopped((v) => !v)}
            accessibilityHint={showStopped ? undefined : 'Shows medications that were stopped'}
          />
          {showStopped
            ? stopped.map((rx) => (
                <PrescriptionCard key={rx.id} rx={rx} patientFirstName={patientFirstName} onChanged={onChanged} readOnly />
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}

// ───────────────────────── Adherence ─────────────────────────

function AdherenceSection({ detail, now }: { detail: PatientDetail; now: Date }) {
  const today = dateKey(now);
  const nowTime = timeKey(now);
  const days = useMemo(() => lastNDays(GRID_DAYS, today), [today]);
  const active = detail.prescriptions
    .filter((p) => p.status === 'active')
    .sort((a, b) => Number(a.selfReported) - Number(b.selfReported));

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Adherence"
        icon="calendar-outline"
        subtitle={`Last ${GRID_DAYS} days · updates live as doses are logged`}
      />
      {active.length === 0 ? (
        <Card variant="muted">
          <EmptyState compact icon="calendar-outline" title="Nothing to track yet" message="Active prescriptions with reminder times get a dose grid here." />
        </Card>
      ) : (
        <>
          <AdherenceLegend />
          {active.map((rx) => (
            <AdherenceGrid key={rx.id} rx={rx} doseLogs={detail.doseLogs} days={days} today={today} nowTime={nowTime} />
          ))}
        </>
      )}
    </View>
  );
}

// ───────────────────────── Refills ─────────────────────────

function RefillsSection({
  detail,
  patientFirstName,
  now,
  onResolved,
  onStale,
}: {
  detail: PatientDetail;
  patientFirstName: string;
  now: Date;
  onResolved: Parameters<typeof RefillRequestCard>[0]['onResolved'];
  onStale: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const rxById = useMemo(() => new Map(detail.prescriptions.map((p) => [p.id, p])), [detail.prescriptions]);
  const pending = detail.refillRequests.filter((r) => r.status === 'pending');
  const resolved = detail.refillRequests.filter((r) => r.status !== 'pending');
  const shownHistory = showAll ? resolved : resolved.slice(0, HISTORY_PREVIEW);

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Refill requests"
        icon="refresh-circle-outline"
        subtitle={pending.length ? `${pending.length} waiting for you` : 'All caught up'}
      />
      {pending.map((r) => (
        <RefillRequestCard
          key={r.id}
          refill={r}
          rx={rxById.get(r.prescriptionId)}
          patientFirstName={patientFirstName}
          onResolved={onResolved}
          onStale={onStale}
          now={now}
        />
      ))}
      {resolved.length ? (
        <Card variant="outline" padding="sm">
          {shownHistory.map((r, i) => (
            <View key={r.id}>
              {i > 0 ? <Divider /> : null}
              <ResolvedRefillRow refill={r} rx={rxById.get(r.prescriptionId)} now={now} />
            </View>
          ))}
          {resolved.length > HISTORY_PREVIEW ? (
            <Button
              title={showAll ? 'Show less' : `Show all ${resolved.length}`}
              variant="ghost"
              size="sm"
              icon={showAll ? 'chevron-up' : 'chevron-down'}
              onPress={() => setShowAll((v) => !v)}
            />
          ) : null}
        </Card>
      ) : pending.length === 0 ? (
        <AppText variant="small" tone="muted">
          No refill requests yet.
        </AppText>
      ) : null}
    </View>
  );
}

// ───────────────────────── Notes ─────────────────────────

function NotesSection({ detail }: { detail: PatientDetail }) {
  const patientId = detail.patient.id;
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Visit notes"
        icon="document-text-outline"
        subtitle={detail.notes.length ? pluralize(detail.notes.length, 'note') : undefined}
        actionLabel="Write"
        onAction={() => router.push(doctorHrefs.note(patientId))}
      />
      {detail.notes.length === 0 ? (
        <Card variant="muted">
          <EmptyState
            compact
            icon="document-text-outline"
            title="No visit notes yet"
            message="Notes you write are shared with your patient, who can ask BRIAN to explain them in plain language."
            actionLabel="Write a note"
            onAction={() => router.push(doctorHrefs.note(patientId))}
          />
        </Card>
      ) : (
        detail.notes.map((note) => <VisitNoteItem key={note.id} note={note} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  profile: { gap: spacing.md },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  block: { gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: { flexGrow: 1 },
  section: { gap: spacing.md, marginTop: spacing.sm },
  subsection: { gap: spacing.md },
});
