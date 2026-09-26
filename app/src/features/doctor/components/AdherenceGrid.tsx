import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import type { DoseLog, Prescription } from '@/lib/contracts';
import { formatDate, formatPercent, formatTime, formatWeekday, pluralize } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { buildAdherence, type DoseCellState } from '../adherence';
import { medLabel } from '../format';

const LABEL_WIDTH = 64;
const DOT = 16;

export interface AdherenceGridProps {
  rx: Prescription;
  doseLogs: readonly DoseLog[];
  /** Date keys, oldest first (e.g. `lastNDays(14)`). */
  days: readonly string[];
  today: string;
  /** Local `HH:mm` now — decides which of today's slots are already due. */
  nowTime: string;
}

/** 14-day dose grid for one prescription: one row per reminder slot, one dot per day. */
export function AdherenceGrid({ rx, doseLogs, days, today, nowTime }: AdherenceGridProps) {
  const data = buildAdherence(rx, doseLogs, days, today, nowTime);
  const label = medLabel(rx);
  const range = `${formatDate(days[0], { omitCurrentYear: true })} – ${formatDate(days.at(-1), { omitCurrentYear: true })}`;

  if (!rx.times.length) {
    return (
      <Card variant="outline" style={styles.card}>
        <GridHeader title={label} right={null} />
        <AppText variant="small" tone="muted">
          Taken as needed · {pluralize(data.loggedInWindow, 'dose')} logged in the last {days.length} days.
        </AppText>
      </Card>
    );
  }

  const summary = [
    `${label}, last ${days.length} days (${range}).`,
    data.rate == null
      ? 'No doses due yet.'
      : `${formatPercent(data.rate)} adherence: ${data.taken} of ${data.due} doses taken.`,
    ...data.rows.map((row) => `${formatTime(row.slot)}: taken ${row.taken}, missed ${row.missed}.`),
  ].join(' ');

  return (
    <Card variant="outline">
      <View accessible accessibilityLabel={summary} style={styles.card}>
        <GridHeader
          title={label}
          right={
            <AppText variant="bodyStrong" tone={data.rate != null && data.rate < 0.7 ? 'warning' : 'default'}>
              {data.rate == null ? '—' : formatPercent(data.rate)}
              {data.due ? (
                <AppText variant="small" tone="muted">
                  {`  ${data.taken}/${data.due}`}
                </AppText>
              ) : null}
            </AppText>
          }
        />
        <View style={styles.row}>
          <View style={styles.label} />
          {days.map((date) => {
            const isToday = date === today;
            return (
              <View key={date} style={[styles.cell, isToday && styles.todayCol]}>
                <AppText
                  variant="caption"
                  tone={isToday ? 'default' : 'subtle'}
                  weight={isToday ? 'bold' : undefined}
                  style={styles.dayText}
                >
                  {formatWeekday(date).charAt(0)}
                </AppText>
                <AppText
                  variant="caption"
                  tone={isToday ? 'default' : 'subtle'}
                  weight={isToday ? 'bold' : undefined}
                  style={styles.dayText}
                >
                  {Number(date.slice(8))}
                </AppText>
              </View>
            );
          })}
        </View>
        {data.rows.map((row) => (
          <View key={row.slot} style={styles.row}>
            <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.label}>
              {formatTime(row.slot)}
            </AppText>
            {row.cells.map((cell) => (
              <View key={cell.date} style={[styles.cell, cell.date === today && styles.todayCol]}>
                <Dot state={cell.state} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

function GridHeader({ title, right }: { title: string; right: ReactNode }) {
  return (
    <View style={styles.header}>
      <AppText variant="bodyStrong" numberOfLines={1} style={styles.flex}>
        {title}
      </AppText>
      {right}
    </View>
  );
}

function Dot({ state }: { state: DoseCellState }) {
  switch (state) {
    case 'taken':
      return (
        <View style={[styles.dot, styles.taken]}>
          <Ionicons name="checkmark" size={11} color={colors.black} />
        </View>
      );
    case 'missed':
      return <View style={[styles.dot, styles.missed]} />;
    case 'upcoming':
      return <View style={[styles.dot, styles.upcoming]} />;
    default:
      return <View style={styles.inactive} />;
  }
}

/** Legend for the dose grids. */
export function AdherenceLegend() {
  return (
    <View style={styles.legend} accessible accessibilityLabel="Legend: yellow check, taken. Gray, missed. Empty circle, upcoming.">
      <LegendItem state="taken" label="Taken" />
      <LegendItem state="missed" label="Missed" />
      <LegendItem state="upcoming" label="Upcoming" />
    </View>
  );
}

function LegendItem({ state, label }: { state: DoseCellState; label: string }) {
  return (
    <View style={styles.legendItem}>
      <Dot state={state} />
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 26 },
  label: { width: LABEL_WIDTH, paddingRight: spacing.xs },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 3, minWidth: 18 },
  todayCol: { backgroundColor: colors.yellowLighter, borderRadius: radius.sm },
  dayText: { fontSize: 10, lineHeight: 13 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' },
  taken: { backgroundColor: colors.yellow, borderWidth: 1, borderColor: colors.yellowPressed },
  missed: { backgroundColor: colors.textSubtle, opacity: 0.45 },
  upcoming: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  inactive: { width: 6, height: 2, borderRadius: 1, backgroundColor: colors.border },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
});
