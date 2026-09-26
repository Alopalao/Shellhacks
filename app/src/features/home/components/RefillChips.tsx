import { StyleSheet, View } from 'react-native';
import { Chip, SectionHeader } from '@/components/ui';
import type { Prescription, RefillRequest } from '@/lib/contracts';
import { formatRelative } from '@/lib/format';
import { spacing } from '@/theme';
import { medLabel, refillState } from '@/features/meds';

export interface RefillChipsProps {
  prescriptions: readonly Prescription[];
  pending: readonly RefillRequest[];
  onOpen: (prescriptionId: string) => void;
  onSeeAll: () => void;
  /** Current time (a just-written prescription with 0 refills isn't flagged). Defaults to render time. */
  now?: Date;
}

/**
 * Pending refill requests (yellow) and doctor-prescribed meds that are out of refills (outline;
 * just-written prescriptions with no refills aren't flagged).
 * Renders nothing when there's nothing to show.
 */
export function RefillChips({ prescriptions, pending, onOpen, onSeeAll, now }: RefillChipsProps) {
  const byId = new Map(prescriptions.map((p) => [p.id, p]));
  const pendingIds = new Set(pending.map((r) => r.prescriptionId));
  const needsRenewal = prescriptions.filter(
    (p) => p.status === 'active' && !p.selfReported && refillState(p, now) === 'out' && !pendingIds.has(p.id),
  );
  if (!pending.length && !needsRenewal.length) return null;

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Refills"
        icon="repeat"
        subtitle={pending.length ? 'Waiting for your doctor' : 'Running low'}
        actionLabel="Meds"
        onAction={onSeeAll}
      />
      <View style={styles.chips}>
        {pending.map((r) => {
          const rx = byId.get(r.prescriptionId);
          const name = rx ? medLabel(rx) : 'Medication';
          return (
            <Chip
              key={r.id}
              label={`${name} · pending`}
              icon="time-outline"
              selected
              onPress={() => onOpen(r.prescriptionId)}
              accessibilityLabel={`${name}: refill requested ${formatRelative(r.createdAt)}, pending. Opens details.`}
            />
          );
        })}
        {needsRenewal.map((rx) => (
          <Chip
            key={rx.id}
            label={`${medLabel(rx)} · 0 refills`}
            icon="alert-circle-outline"
            onPress={() => onOpen(rx.id)}
            accessibilityLabel={`${medLabel(rx)} has no refills left. Opens details to request a renewal.`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
