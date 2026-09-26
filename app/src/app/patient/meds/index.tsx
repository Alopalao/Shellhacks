// Meds list: Active / Paused / Past with live updates (yellow flash + "Updated by Dr. …").
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Disclaimer,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Screen,
  ScreenHeader,
  SegmentedControl,
  useConfirm,
  useToast,
  type IoniconName,
  type SegmentOption,
} from '@/components/ui';
import {
  latestRefillByRx,
  liveChangeLabel,
  MedCard,
  medFilterOf,
  medLabel,
  upsertPrescription,
  upsertRefill,
  useLiveHighlights,
  usePrescribers,
  type MedFilter,
} from '@/features/meds';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useNow } from '@/hooks/useInterval';
import { api, errorMessage, isApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Prescription, RefillRequest } from '@/lib/contracts';
import { dateKey, pluralize } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';
import { spacing } from '@/theme';

const EMPTY: Record<MedFilter, { icon: IoniconName; title: string; message: string }> = {
  active: {
    icon: 'medkit-outline',
    title: 'No active medicines',
    message: 'Prescriptions from your doctor appear here automatically. You can add vitamins and OTC medicines yourself.',
  },
  paused: {
    icon: 'pause-circle-outline',
    title: 'Nothing paused',
    message: 'If your doctor pauses a medicine, it moves here until they restart it.',
  },
  past: {
    icon: 'archive-outline',
    title: 'No past medicines',
    message: 'Medicines that were stopped or finished are kept here for your records.',
  },
};

export default function MedsScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const now = useNow(60_000);
  const today = dateKey(now);
  const [filter, setFilter] = useState<MedFilter>('active');
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const meds = useApiQuery(() => api.prescriptions(), []);
  const refills = useApiQuery(() => api.refills('pending'), []);
  const prescribers = usePrescribers();
  const highlights = useLiveHighlights();

  useSocketEvent('prescription:upsert', (rx) => {
    if (rx.patientId !== user?.id) return;
    if (!meds.data) return; // the first load will include it
    const previous = meds.data.find((p) => p.id === rx.id);
    meds.setData((prev) => (prev ? upsertPrescription(prev, rx) : prev));
    highlights.flash(rx.id, liveChangeLabel(previous, rx, rx.selfReported ? null : prescribers.shortLabel(rx)));
  });

  useSocketEvent('refill:upsert', (refill) => {
    if (refill.patientId !== user?.id) return;
    refills.setData((prev) =>
      prev
        ? refill.status === 'pending'
          ? upsertRefill(prev, refill)
          : prev.filter((r) => r.id !== refill.id)
        : prev,
    );
  });

  const requestRenewal = async (rx: Prescription) => {
    const doctor = prescribers.shortLabel(rx);
    const ok = await confirm({
      title: `Ask ${doctor} to renew ${rx.drugName}?`,
      message: `We’ll send a renewal request for ${medLabel(rx)}. You’ll get a notification when they respond. For a note to your doctor, open the medicine’s details.`,
      confirmLabel: 'Send request',
    });
    if (!ok) return;
    setRequestingId(rx.id);
    try {
      const created = await api.createRefill({ prescriptionId: rx.id });
      refills.setData((prev) => upsertRefill(prev ?? [], created));
      toast.success('Renewal requested', `${doctor} will review your request for ${rx.drugName}.`);
    } catch (e) {
      const existing =
        isApiRequestError(e) && e.status === 409
          ? (e.details as { refillRequest?: RefillRequest } | undefined)?.refillRequest
          : undefined;
      if (existing) {
        refills.setData((prev) => upsertRefill(prev ?? [], existing));
        toast.info('Already requested', `A request for ${rx.drugName} is already waiting for ${doctor}.`);
      } else {
        toast.error('Couldn’t send the request', errorMessage(e));
      }
    } finally {
      setRequestingId(null);
    }
  };

  const addButton = (
    <IconButton
      icon="add"
      variant="yellow"
      accessibilityLabel="Add an OTC medicine or supplement"
      onPress={() => router.push('/patient/meds/add')}
    />
  );
  const header = <ScreenHeader title="Medications" right={addButton} />;

  if (meds.loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Loading your medicines…" />
      </Screen>
    );
  }
  if (!meds.data) {
    return (
      <Screen header={header} refreshing={meds.refreshing} onRefresh={meds.refresh}>
        <ErrorState error={meds.error} title="Couldn’t load your medicines" onRetry={() => void meds.refresh()} />
      </Screen>
    );
  }

  const groups: Record<MedFilter, Prescription[]> = { active: [], paused: [], past: [] };
  for (const rx of meds.data) groups[medFilterOf(rx, today)].push(rx);
  const visible = groups[filter];
  const pendingByRx = latestRefillByRx(refills.data);
  const dailyDoses = groups.active.reduce((n, rx) => n + rx.times.length, 0);

  const options: SegmentOption<MedFilter>[] = [
    { value: 'active', label: `Active · ${groups.active.length}`, accessibilityLabel: `Active, ${groups.active.length}` },
    { value: 'paused', label: `Paused · ${groups.paused.length}`, accessibilityLabel: `Paused, ${groups.paused.length}` },
    { value: 'past', label: `Past · ${groups.past.length}`, accessibilityLabel: `Past, ${groups.past.length}` },
  ];

  const onRefresh = () => {
    void refills.reload();
    void meds.refresh();
  };

  return (
    <Screen header={header} refreshing={meds.refreshing} onRefresh={onRefresh}>
      <SegmentedControl options={options} value={filter} onChange={setFilter} accessibilityLabel="Show medicines" />

      {filter === 'active' && groups.active.length ? (
        <AppText variant="small" tone="muted">
          {pluralize(groups.active.length, 'medicine')} · {pluralize(dailyDoses, 'scheduled dose')} a day
        </AppText>
      ) : null}

      {visible.length ? (
        <View style={styles.list}>
          {visible.map((rx) => (
            <MedCard
              key={rx.id}
              rx={rx}
              prescriber={prescribers.label(rx)}
              refill={pendingByRx.get(rx.id)}
              past={filter === 'past'}
              highlight={highlights.get(rx.id)}
              onPress={() => router.push(`/patient/meds/${rx.id}`)}
              onRequestRenewal={() => void requestRenewal(rx)}
              requesting={requestingId === rx.id}
              now={now}
            />
          ))}
        </View>
      ) : (
        <EmptyState icon={EMPTY[filter].icon} title={EMPTY[filter].title} message={EMPTY[filter].message} />
      )}

      <Button
        title="Add OTC / supplement"
        icon="add"
        variant="outline"
        fullWidth
        onPress={() => router.push('/patient/meds/add')}
        accessibilityHint="Add a vitamin, supplement or over-the-counter medicine you take"
      />
      <Disclaimer text="Don’t stop or change a prescription without talking to your doctor. Questions about a medicine? Ask your pharmacist or tap a medicine for details." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
