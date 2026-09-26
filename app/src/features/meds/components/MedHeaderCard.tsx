import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Avatar, Badge, Card } from '@/components/ui';
import type { Prescription, User } from '@/lib/contracts';
import { formatDate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { formLabel, iconForForm, purposeLabel } from '../format';
import type { LiveHighlight } from '../useLiveHighlights';
import { LiveUpdateTag } from './LiveUpdateTag';

export interface MedHeaderCardProps {
  rx: Prescription;
  /** The prescribing doctor, when known. */
  prescriber?: User;
  /** "Dr. Daniel Reyes" / "Self-reported". */
  prescriberLabel: string;
  past: boolean;
  highlight?: LiveHighlight;
}

/** Light-yellow summary at the top of the medication detail screen. */
export function MedHeaderCard({ rx, prescriber, prescriberLabel, past, highlight }: MedHeaderCardProps) {
  const purpose = purposeLabel(rx.purpose);
  const status = past
    ? { label: rx.status === 'discontinued' ? 'Stopped' : 'Ended', tone: 'neutral' as const, icon: 'stop-circle-outline' as const }
    : rx.status === 'paused'
      ? { label: 'Paused', tone: 'warning' as const, icon: 'pause' as const }
      : { label: 'Active', tone: 'success' as const, icon: 'checkmark-circle' as const };

  return (
    <Card variant="yellow" style={[styles.card, highlight && styles.highlighted]}>
      {highlight ? <LiveUpdateTag highlight={highlight} /> : null}
      <View style={styles.headRow}>
        <View style={styles.iconTile}>
          <Ionicons name={iconForForm(rx.form, rx.selfReported)} size={26} color={colors.text} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title2">{rx.drugName}</AppText>
          <AppText variant="body" tone="muted">
            {[rx.strength, rx.form ? formLabel(rx.form) : null].filter(Boolean).join(' · ') || 'Strength not set'}
          </AppText>
        </View>
      </View>

      <View style={styles.badges}>
        <Badge label={status.label} tone={status.tone} icon={status.icon} size="md" />
        {rx.selfReported ? <Badge label="Self-reported" tone="outline" icon="person-outline" size="md" /> : null}
      </View>

      {purpose ? (
        <View style={styles.inline}>
          <Ionicons name="heart-outline" size={16} color={colors.text} />
          <AppText variant="bodyStrong" style={styles.flex}>
            {purpose}
          </AppText>
        </View>
      ) : null}

      <View style={styles.prescriber}>
        {rx.selfReported ? (
          <View style={styles.selfIcon}>
            <Ionicons name="person" size={16} color={colors.text} />
          </View>
        ) : (
          <Avatar user={prescriber} name={prescriberLabel} size={36} ring />
        )}
        <View style={styles.flex}>
          <AppText variant="caption" tone="muted">
            {rx.selfReported ? 'Added by you' : 'Prescribed by'}
          </AppText>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {rx.selfReported ? 'Over-the-counter / supplement' : prescriberLabel}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          Since {formatDate(rx.startDate, { omitCurrentYear: true })}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  highlighted: { borderColor: colors.yellow, borderWidth: 2 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  prescriber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.yellowBorder,
  },
  selfIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
