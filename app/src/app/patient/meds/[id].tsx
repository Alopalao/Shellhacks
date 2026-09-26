// Medication detail: summary, how to take it, today's doses, 14-day history, refills (live),
// FDA drug info, "Ask BRIAN", and edit/remove for self-reported medicines.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  Disclaimer,
  EmptyState,
  ErrorState,
  IconButton,
  InfoRow,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
  useConfirm,
  useToast,
} from '@/components/ui';
import {
  AdherenceGrid,
  buildAdherenceGrid,
  DoseSlotRow,
  doseKey,
  DrugInfoPanel,
  historyRange,
  indexDoses,
  isDueToday,
  isPastPrescription,
  liveChangeLabel,
  medLabel,
  MedForm,
  MedHeaderCard,
  periodInfo,
  periodForSlot,
  RefillPanel,
  slotState,
  upsertPrescription,
  upsertRefill,
  useDoseToggle,
  useLiveHighlights,
  usePrescribers,
  type DoseToggle,
  type MedFormValues,
} from '@/features/meds';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useNow } from '@/hooks/useInterval';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { DoseLog, Prescription } from '@/lib/contracts';
import { dateKey, formatDate, formatTime, sortTimes } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';
import { colors, radius, spacing } from '@/theme';

export default function MedDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const rxId = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const now = useNow(60_000);
  const today = dateKey(now);
  const range = historyRange(today);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const meds = useApiQuery(() => api.prescriptions(), [], { enabled: !!rxId });
  const doses = useApiQuery(() => api.doses({ ...range, prescriptionId: rxId }), [rxId, range.from, range.to], {
    enabled: !!rxId,
    keepPreviousData: true,
  });
  const refills = useApiQuery(() => api.refills(), [], { enabled: !!rxId });
  const prescribers = usePrescribers();
  const highlights = useLiveHighlights();

  const rx = meds.data?.find((p) => p.id === rxId);
  const rxDoses = doses.data?.filter((d) => d.prescriptionId === rxId);
  const rxRefills = refills.data?.filter((r) => r.prescriptionId === rxId);

  const doseToggle = useDoseToggle({
    doses: doses.data,
    update: (fn) => doses.setData((prev) => (prev ? fn(prev) : prev)),
    patientId: user?.id,
    accept: (d) => d.prescriptionId === rxId && d.date >= range.from && d.date <= range.to,
  });

  useSocketEvent('prescription:upsert', (updated) => {
    if (updated.id !== rxId) return;
    const previous = meds.data?.find((p) => p.id === updated.id);
    meds.setData((prev) => (prev ? upsertPrescription(prev, updated) : prev));
    // Self-reported changes come from the patient themselves, so only doctor changes are flagged.
    if (!updated.selfReported) highlights.flash(updated.id, liveChangeLabel(previous, updated, prescribers.shortLabel(updated)));
  });

  useSocketEvent('refill:upsert', (refill) => {
    if (refill.prescriptionId !== rxId) return;
    refills.setData((prev) => (prev ? upsertRefill(prev, refill) : prev));
  });

  const back = '/patient/meds';
  const title = rx?.drugName ?? 'Medication';

  if (meds.loading) {
    return (
      <Screen header={<ScreenHeader title={title} back={back} />} scroll={false}>
        <LoadingState label="Loading medication…" />
      </Screen>
    );
  }
  if (!meds.data) {
    return (
      <Screen header={<ScreenHeader title={title} back={back} />} refreshing={meds.refreshing} onRefresh={meds.refresh}>
        <ErrorState error={meds.error} title="Couldn’t load this medication" onRetry={() => void meds.refresh()} />
      </Screen>
    );
  }
  if (!rx) {
    return (
      <Screen header={<ScreenHeader title="Medication" back={back} />}>
        <EmptyState
          icon="search-outline"
          title="Medication not found"
          message="It may have been removed from your list."
          actionLabel="Back to medications"
          onAction={() => router.replace(back)}
        />
      </Screen>
    );
  }

  const past = isPastPrescription(rx, today);
  const canEdit = rx.selfReported && !past;
  const prescriberLabel = prescribers.label(rx);
  const doctorShort = prescribers.shortLabel(rx);

  const save = async (values: MedFormValues) => {
    try {
      const updated = await api.updatePrescription(rx.id, values);
      meds.setData((prev) => (prev ? upsertPrescription(prev, updated) : prev));
      setEditing(false);
      toast.success('Saved', `${medLabel(updated)} is up to date.`);
    } catch (e) {
      toast.error('Couldn’t save your changes', errorMessage(e));
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Remove ${rx.drugName}?`,
      message: 'It moves to Past on your list and leaves your daily checklist. Your doctor will see that you stopped it.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    setRemoving(true);
    try {
      const updated = await api.discontinuePrescription(rx.id);
      meds.setData((prev) => (prev ? upsertPrescription(prev, updated) : prev));
      toast.success(`${rx.drugName} removed`, 'You can still find it under Past.');
      if (router.canGoBack()) router.back();
      else router.replace(back);
    } catch (e) {
      toast.error('Couldn’t remove it', errorMessage(e));
    } finally {
      setRemoving(false);
    }
  };

  const askBrian = () =>
    router.push({
      pathname: '/patient/ai',
      params: { mode: 'medication', prescriptionId: rx.id, drugName: rx.drugName },
    });

  const header = (
    <ScreenHeader
      title={rx.drugName}
      subtitle={rx.strength || undefined}
      back={back}
      right={
        canEdit && !editing ? (
          <IconButton icon="create-outline" variant="outline" accessibilityLabel={`Edit ${rx.drugName}`} onPress={() => setEditing(true)} />
        ) : undefined
      }
    />
  );

  if (editing) {
    return (
      <Screen header={header}>
        <AppText variant="body" tone="muted">
          Update the details of this self-reported medicine. Your doctor will see the changes.
        </AppText>
        <MedForm initial={rx} submitLabel="Save changes" submitIcon="save-outline" onSubmit={save} onCancel={() => setEditing(false)} />
      </Screen>
    );
  }

  const onRefresh = () => {
    void doses.reload();
    void refills.reload();
    void meds.refresh();
  };

  return (
    <Screen header={header} refreshing={meds.refreshing} onRefresh={onRefresh}>
      <MedHeaderCard
        rx={rx}
        prescriber={prescribers.doctor(rx.doctorId)}
        prescriberLabel={prescriberLabel}
        past={past}
        highlight={highlights.get(rx.id)}
      />

      <Button
        title={`Ask BRIAN about ${rx.drugName}`}
        icon="sparkles"
        onPress={askBrian}
        fullWidth
        accessibilityHint="Opens BRIAN AI with questions about this medicine"
      />

      <StatusNotice rx={rx} past={past} doctorShort={doctorShort} />

      <HowToTake rx={rx} />

      {isDueToday(rx, today) ? (
        <TodaySection
          rx={rx}
          today={today}
          now={now}
          doses={rxDoses}
          loading={doses.loading}
          error={doses.error}
          onRetry={() => void doses.refresh()}
          toggle={doseToggle}
        />
      ) : null}

      {rx.times.length ? (
        <Card style={styles.card}>
          <SectionHeader title="Last 14 days" icon="calendar-outline" subtitle="Doses you logged in BRIAN" />
          {doses.loading ? (
            <LoadingState label="Loading history…" fill={false} />
          ) : doses.error && !doses.data ? (
            <ErrorState error={doses.error} title="Couldn’t load your history" onRetry={() => void doses.refresh()} compact />
          ) : (
            <AdherenceGrid grid={buildAdherenceGrid(rx, rxDoses, now)} />
          )}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <SectionHeader title="Refills" icon="repeat" />
        <RefillPanel
          rx={rx}
          refills={rxRefills}
          loading={refills.loading}
          error={refills.error}
          onRetry={() => void refills.refresh()}
          doctorName={doctorShort}
          past={past}
          now={now}
          onRequested={(r) => refills.setData((prev) => upsertRefill(prev ?? [], r))}
        />
      </Card>

      <Card style={styles.card}>
        <SectionHeader title="Drug info" icon="book-outline" subtitle="Label highlights and trusted sources" />
        <DrugInfoPanel drugName={rx.drugName} />
      </Card>

      {canEdit ? (
        <View style={styles.actions}>
          <Button title="Edit" icon="create-outline" variant="outline" onPress={() => setEditing(true)} style={styles.flex} />
          <Button title="Remove" icon="trash-outline" variant="danger" onPress={remove} loading={removing} style={styles.flex} />
        </View>
      ) : null}

      <Disclaimer />
    </Screen>
  );
}

function StatusNotice({ rx, past, doctorShort }: { rx: Prescription; past: boolean; doctorShort: string }) {
  if (!past && rx.status !== 'paused') return null;
  const text = past
    ? `You’re no longer taking this${rx.endDate ? ` (stopped ${formatDate(rx.endDate, { omitCurrentYear: true })})` : ''}. It’s kept here for your records.`
    : rx.selfReported
      ? 'This medicine is paused, so it’s not in your daily checklist.'
      : `${doctorShort === 'your doctor' ? 'Your doctor' : doctorShort} paused this medicine. Check with them before taking it again.`;
  return (
    <View style={[styles.notice, past ? styles.noticePast : styles.noticePaused]} accessibilityRole="alert">
      <Ionicons name={past ? 'archive-outline' : 'pause-circle-outline'} size={20} color={past ? colors.textMuted : colors.warning} />
      <AppText variant="small" tone={past ? 'muted' : 'warning'} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

function HowToTake({ rx }: { rx: Prescription }) {
  const times = sortTimes(rx.times);
  return (
    <Card style={styles.card}>
      <SectionHeader title="How to take it" icon="information-circle-outline" />
      <View>
        <InfoRow label="Dose" value={[rx.dose, rx.route].filter(Boolean).join(' ') || '—'} />
        <InfoRow label="How often" value={rx.frequency || '—'} />
        <InfoRow
          label="Times"
          value={
            times.length ? (
              <View style={styles.timeChips}>
                {times.map((t) => (
                  <Badge key={t} label={formatTime(t)} icon="alarm-outline" tone="outline" size="md" />
                ))}
              </View>
            ) : (
              'As needed'
            )
          }
        />
        {rx.quantity != null ? <InfoRow label="Quantity" value={String(rx.quantity)} /> : null}
        {rx.endDate ? <InfoRow label="Until" value={formatDate(rx.endDate)} /> : null}
      </View>
      {rx.instructions ? (
        <View style={styles.instructions} accessible accessibilityLabel={`Instructions: ${rx.instructions}`}>
          <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.text} />
          <AppText variant="body" style={styles.flex}>
            {rx.instructions}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

interface TodaySectionProps {
  rx: Prescription;
  today: string;
  now: Date;
  doses: readonly DoseLog[] | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  toggle: DoseToggle;
}

function TodaySection({ rx, today, now, doses, loading, error, onRetry, toggle }: TodaySectionProps) {
  const taken = indexDoses(doses);
  const slots = sortTimes(rx.times);
  const done = slots.filter((s) => taken.has(doseKey(rx.id, today, s))).length;
  return (
    <Card style={styles.card}>
      <SectionHeader title="Today" icon="today-outline" subtitle={`${done} of ${slots.length} taken · tap to log or undo`} />
      {loading ? (
        <LoadingState label="Loading today’s doses…" fill={false} />
      ) : error && !doses ? (
        <ErrorState error={error} title="Couldn’t load today’s doses" onRetry={onRetry} compact />
      ) : (
        <View style={styles.slots}>
          {slots.map((slot) => {
            const dose = taken.get(doseKey(rx.id, today, slot));
            return (
              <DoseSlotRow
                key={slot}
                title={formatTime(slot)}
                subtitle={`${periodInfo(periodForSlot(slot)).label} · ${rx.dose || medLabel(rx)}`}
                slot={slot}
                state={slotState(slot, !!dose, now)}
                takenAt={dose?.takenAt}
                showTime={false}
                pending={toggle.isPending(rx.id, today, slot)}
                onToggle={() => void toggle.toggle(rx, today, slot)}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  noticePaused: { backgroundColor: colors.warningLight },
  noticePast: { backgroundColor: colors.surfaceMuted },
  timeChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xs + 2 },
  instructions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLighter,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  slots: { gap: spacing.sm },
});
