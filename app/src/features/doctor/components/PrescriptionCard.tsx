import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, useConfirm, useToast } from '@/components/ui';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { api, errorMessage } from '@/lib/api';
import type { Prescription } from '@/lib/contracts';
import { formatDate, formatTime, pluralize, sortTimes } from '@/lib/format';
import { spacing } from '@/theme';
import { medLabel, rxDirections, STATUS_BADGE } from '../format';

export interface PrescriptionCardProps {
  rx: Prescription;
  /** First name used in confirmations ("Maya will be notified"). */
  patientFirstName: string;
  /** Called with the server's updated prescription after pause/resume/discontinue. */
  onChanged: (rx: Prescription) => void;
  onEdit?: () => void;
  /** Hide actions (self-reported meds). */
  readOnly?: boolean;
  /** A refill request is waiting for this prescription. */
  refillPending?: boolean;
}

/** Prescription summary for the doctor with edit / pause-resume / discontinue actions. */
export function PrescriptionCard({ rx, patientFirstName, onChanged, onEdit, readOnly, refillPending }: PrescriptionCardProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const status = STATUS_BADGE[rx.status];
  const label = medLabel(rx);
  const discontinued = rx.status === 'discontinued';

  const toggle = useAsyncAction(
    (next: 'active' | 'paused') => api.updatePrescription(rx.id, { status: next }),
    { onError: (e) => toast.error(`Couldn't update ${rx.drugName}`, errorMessage(e)) },
  );
  const stop = useAsyncAction(() => api.discontinuePrescription(rx.id), {
    onError: (e) => toast.error(`Couldn't discontinue ${rx.drugName}`, errorMessage(e)),
  });

  const onToggle = async () => {
    const next = rx.status === 'paused' ? 'active' : 'paused';
    const updated = await toggle.run(next);
    if (!updated) return;
    onChanged(updated);
    toast.success(
      next === 'paused' ? `${rx.drugName} paused` : `${rx.drugName} resumed`,
      `${patientFirstName} has been notified.`,
    );
  };

  const onDiscontinue = async () => {
    const ok = await confirm({
      title: `Discontinue ${label}?`,
      message: `${patientFirstName} will be told to stop taking it, reminders end, and any pending refill request is closed. This can't be undone from the app.`,
      confirmLabel: 'Discontinue',
      destructive: true,
    });
    if (!ok) return;
    const updated = await stop.run();
    if (!updated) return;
    onChanged(updated);
    toast.success(`${rx.drugName} discontinued`, `${patientFirstName} has been notified.`);
  };

  const times = sortTimes(rx.times);
  const facts = [
    rx.selfReported ? null : pluralize(rx.refillsRemaining, 'refill') + ' left',
    rx.quantity != null ? `Qty ${rx.quantity}` : null,
    discontinued && rx.endDate ? `Stopped ${formatDate(rx.endDate, { omitCurrentYear: true })}` : `Since ${formatDate(rx.startDate, { omitCurrentYear: true })}`,
  ].filter(Boolean);

  return (
    <Card variant={discontinued ? 'muted' : 'default'} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <AppText variant="title3" tone={discontinued ? 'muted' : 'default'}>
            {label}
          </AppText>
          <AppText variant="small" tone="muted">
            {rxDirections(rx) || 'No directions recorded'}
          </AppText>
        </View>
        <Badge label={status.label} tone={status.tone} size="md" />
      </View>

      <View style={styles.chips}>
        {times.length ? (
          times.map((t) => <Badge key={t} label={formatTime(t)} tone={discontinued ? 'neutral' : 'yellow'} icon="alarm-outline" />)
        ) : (
          <Badge label="As needed" tone="outline" icon="hand-left-outline" />
        )}
        {refillPending ? <Badge label="Refill requested" tone="dark" icon="refresh-circle" /> : null}
      </View>

      {rx.instructions ? <AppText variant="small">{rx.instructions}</AppText> : null}
      {rx.purpose ? (
        <AppText variant="small" tone="muted">
          For: <AppText variant="small" weight="semibold">{rx.purpose}</AppText>
        </AppText>
      ) : null}
      <AppText variant="caption" tone="subtle">
        {facts.join(' · ')}
      </AppText>

      {!readOnly && !discontinued ? (
        <View style={styles.actions}>
          {onEdit ? (
            <Button
              title="Edit"
              icon="create-outline"
              variant="outline"
              size="sm"
              onPress={onEdit}
              accessibilityLabel={`Edit ${label}`}
            />
          ) : null}
          <Button
            title={rx.status === 'paused' ? 'Resume' : 'Pause'}
            icon={rx.status === 'paused' ? 'play-outline' : 'pause-outline'}
            variant="outline"
            size="sm"
            loading={toggle.pending}
            disabled={stop.pending}
            onPress={onToggle}
            accessibilityLabel={`${rx.status === 'paused' ? 'Resume' : 'Pause'} ${label}`}
          />
          <Button
            title="Discontinue"
            icon="close-circle-outline"
            variant="ghost"
            size="sm"
            loading={stop.pending}
            disabled={toggle.pending}
            onPress={onDiscontinue}
            accessibilityLabel={`Discontinue ${label}`}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleWrap: { flex: 1, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});
