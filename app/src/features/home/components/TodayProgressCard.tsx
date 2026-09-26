import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, ProgressBar } from '@/components/ui';
import { formatRelative, formatTime, pluralize, toDate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { medLabel, type TodayChecklist } from '@/features/meds';

export interface TodayProgressCardProps {
  checklist: TodayChecklist;
  today: string;
  now: Date;
  /** Shown when nothing is scheduled today. */
  onAddMedication: () => void;
}

/** Local Date for an `HH:mm` slot on a `YYYY-MM-DD` day. */
function slotDate(day: string, slot: string): Date | null {
  const d = toDate(day);
  const m = /^(\d{1,2}):(\d{2})$/.exec(slot);
  if (!d || !m) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(m[1]), Number(m[2]));
}

/** "3 of 5 doses today" with a yellow progress bar and the next upcoming dose. */
export function TodayProgressCard({ checklist, today, now, onAddMedication }: TodayProgressCardProps) {
  const { total, taken, next, overdue } = checklist;
  const pct = total ? taken / total : 0;
  const allDone = total > 0 && taken === total;

  const nextAt = next ? slotDate(today, next.slot) : null;
  const minutesUntil = nextAt ? (nextAt.getTime() - now.getTime()) / 60_000 : 0;
  const nextNames = next
    ? next.items.length > 2
      ? `${medLabel(next.items[0]!.rx)} + ${next.items.length - 1} more`
      : next.items.map((i) => medLabel(i.rx)).join(' + ')
    : '';

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <AppText variant="label" tone="muted">
            Today’s doses
          </AppText>
          <AppText variant="title1" accessibilityRole="text">
            {total ? `${taken} of ${total}` : '—'}
          </AppText>
        </View>
        <View style={[styles.pctBubble, allDone && styles.pctBubbleDone]}>
          {allDone ? (
            <Ionicons name="checkmark" size={26} color={colors.textOnYellow} />
          ) : (
            <AppText variant="title3">{total ? `${Math.round(pct * 100)}%` : '0'}</AppText>
          )}
        </View>
      </View>

      {total ? (
        <ProgressBar
          value={pct}
          height={12}
          accessibilityLabel={`${taken} of ${total} doses taken today`}
        />
      ) : null}

      {total === 0 ? (
        <View style={styles.message}>
          <AppText variant="body" tone="muted">
            No doses scheduled for today.
          </AppText>
          <Button title="Add a medicine" icon="add" variant="outline" size="sm" onPress={onAddMedication} />
        </View>
      ) : allDone ? (
        <View style={styles.nextRow}>
          <View style={[styles.nextIcon, styles.nextIconDone]}>
            <Ionicons name="trophy-outline" size={18} color={colors.text} />
          </View>
          <AppText variant="bodyStrong" style={styles.flex}>
            All doses logged for today. Nice work!
          </AppText>
        </View>
      ) : next ? (
        <View
          style={styles.nextRow}
          accessible
          accessibilityLabel={`Next dose at ${formatTime(next.slot)}: ${nextNames}`}
        >
          <View style={styles.nextIcon}>
            <Ionicons name="alarm-outline" size={18} color={colors.text} />
          </View>
          <View style={styles.flex}>
            <AppText variant="small" tone="muted">
              Next dose · {formatTime(next.slot)}
              {nextAt && minutesUntil >= 1 ? ` (${formatRelative(nextAt, now)})` : ' (due now)'}
            </AppText>
            <AppText variant="bodyStrong" numberOfLines={2}>
              {nextNames}
            </AppText>
          </View>
        </View>
      ) : null}

      {overdue > 0 && !allDone ? (
        <View style={styles.overdue} accessibilityRole="alert">
          <Ionicons name="time-outline" size={16} color={colors.warning} />
          <AppText variant="small" tone="warning" style={styles.flex}>
            {pluralize(overdue, 'earlier dose')} not logged yet. Tap it below if you took it.
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  flex: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pctBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  pctBubbleDone: { backgroundColor: colors.yellow },
  message: { gap: spacing.sm, alignItems: 'flex-start' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextIconDone: { backgroundColor: colors.yellow },
  overdue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.warningLight,
  },
});
