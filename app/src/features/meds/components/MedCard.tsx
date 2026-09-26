import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card } from '@/components/ui';
import type { Prescription, RefillRequest } from '@/lib/contracts';
import { formatDate, formatTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { doseSummary, iconForForm, medLabel, purposeLabel, refillsLabel, timesSummary } from '../format';
import type { LiveHighlight } from '../useLiveHighlights';
import { LiveUpdateTag } from './LiveUpdateTag';

export interface MedCardProps {
  rx: Prescription;
  /** "Dr. Daniel Reyes" or "Self-reported". */
  prescriber: string;
  /** The latest refill request for this prescription, if any. */
  refill?: RefillRequest;
  /** Past (discontinued / ended) medications render muted and without refill actions. */
  past?: boolean;
  highlight?: LiveHighlight;
  onPress: () => void;
  onRequestRenewal?: () => void;
  requesting?: boolean;
}

/** A medication in the Meds list: name, how to take it, times, purpose, prescriber, refills. */
export function MedCard({ rx, prescriber, refill, past = false, highlight, onPress, onRequestRenewal, requesting }: MedCardProps) {
  const title = medLabel(rx);
  const how = doseSummary(rx);
  const purpose = purposeLabel(rx.purpose);
  const pendingRefill = refill?.status === 'pending' ? refill : undefined;
  const needsRenewal = !rx.selfReported && !past && rx.refillsRemaining === 0;
  const statusBadge =
    past ? (
      <Badge label={rx.status === 'discontinued' ? 'Stopped' : 'Ended'} tone="neutral" />
    ) : rx.status === 'paused' ? (
      <Badge label="Paused" tone="warning" icon="pause" />
    ) : null;

  const a11y = [
    title,
    how,
    rx.times.length ? `at ${timesSummary(rx.times).replace(/ · /g, ', ')}` : 'no set times',
    purpose,
    rx.selfReported ? 'self-reported' : `prescribed by ${prescriber}`,
    rx.selfReported || past ? null : refillsLabel(rx.refillsRemaining),
    rx.status === 'paused' && !past ? 'paused' : null,
    past ? 'no longer taking' : null,
    highlight?.label,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card variant={highlight ? 'yellow' : past ? 'outline' : 'default'} padding={0} style={highlight && styles.highlighted}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityHint="Opens medication details"
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        {highlight ? <LiveUpdateTag highlight={highlight} /> : null}
        <View style={styles.headRow}>
          <View style={[styles.iconTile, highlight && styles.iconTileOnYellow, past && styles.iconTilePast]}>
            <Ionicons name={iconForForm(rx.form, rx.selfReported)} size={22} color={colors.text} />
          </View>
          <View style={styles.headText}>
            <AppText variant="title3" numberOfLines={2} tone={past ? 'muted' : 'default'}>
              {title}
            </AppText>
            {how ? (
              <AppText variant="small" tone="muted" numberOfLines={2}>
                {how}
              </AppText>
            ) : null}
          </View>
          {statusBadge ?? <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />}
        </View>

        {!past ? (
          <View style={styles.chips}>
            {rx.times.length ? (
              [...rx.times]
                .sort()
                .map((t) => <Badge key={t} label={formatTime(t)} icon="alarm-outline" tone="outline" size="md" />)
            ) : (
              <Badge label="As needed" icon="hand-left-outline" tone="outline" size="md" />
            )}
          </View>
        ) : rx.endDate ? (
          <AppText variant="small" tone="muted">
            Stopped {formatDate(rx.endDate, { omitCurrentYear: true })}
          </AppText>
        ) : null}

        {purpose ? (
          <View style={styles.inline}>
            <Ionicons name="heart-outline" size={15} color={colors.textMuted} />
            <AppText variant="small" tone="muted" numberOfLines={1} style={styles.flex}>
              {purpose}
            </AppText>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={[styles.inline, styles.flex]}>
            <Ionicons
              name={rx.selfReported ? 'person-circle-outline' : 'medkit-outline'}
              size={15}
              color={colors.textMuted}
            />
            <AppText variant="small" numberOfLines={1} style={styles.flex}>
              {prescriber}
            </AppText>
          </View>
          {rx.selfReported || past ? null : (
            <Badge
              label={refillsLabel(rx.refillsRemaining)}
              tone={rx.refillsRemaining > 0 ? 'neutral' : 'warning'}
              icon={rx.refillsRemaining > 0 ? 'repeat' : 'alert-circle-outline'}
            />
          )}
        </View>
      </Pressable>

      {needsRenewal ? (
        <View style={styles.cta}>
          {pendingRefill ? (
            <View style={styles.inline} accessible accessibilityLabel="Renewal requested, waiting for your doctor">
              <Ionicons name="time-outline" size={16} color={colors.text} />
              <AppText variant="label">Renewal requested · waiting for your doctor</AppText>
            </View>
          ) : (
            <>
              <AppText variant="small" tone="muted" style={styles.flex}>
                Out of refills. Ask your doctor to renew it.
              </AppText>
              <Button
                title="Request renewal"
                icon="refresh"
                size="sm"
                loading={requesting}
                onPress={onRequestRenewal}
                accessibilityHint={`Asks your doctor to renew ${title}`}
              />
            </>
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  highlighted: { borderColor: colors.yellow, borderWidth: 2 },
  main: { padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg },
  pressed: { opacity: 0.85 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headText: { flex: 1, gap: 2 },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileOnYellow: { backgroundColor: colors.white },
  iconTilePast: { backgroundColor: colors.surfaceMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
