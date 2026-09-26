import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText, ProgressBar } from '@/components/ui';
import { formatDate, formatPercent, formatTime, formatWeekday } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { AdherenceGrid as Grid, GridCell } from '../schedule';

export interface AdherenceGridProps {
  grid: Grid;
}

/** Compact dose history: one row per reminder time, one column per day (oldest → today). */
export function AdherenceGrid({ grid }: AdherenceGridProps) {
  const { days, rows, taken, due, rate } = grid;
  const summary =
    rate == null
      ? 'No doses were due in the last 14 days.'
      : `${taken} of ${due} doses logged in the last 14 days (${formatPercent(rate)}).`;
  const first = days[0];
  const last = days[days.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <AppText variant="title2">{rate == null ? '—' : formatPercent(rate)}</AppText>
        <AppText variant="small" tone="muted" style={styles.flex}>
          {rate == null ? 'Nothing due yet' : `${taken} of ${due} doses logged`}
        </AppText>
      </View>
      {rate != null ? (
        <ProgressBar value={rate} height={8} accessibilityLabel={`Adherence ${formatPercent(rate)}`} />
      ) : null}

      <View accessible accessibilityRole="image" accessibilityLabel={`Dose history. ${summary}`} style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.rowLabel} />
          {days.map((day, i) => (
            <View key={day} style={styles.cellBox}>
              <AppText variant="caption" tone={i === days.length - 1 ? 'default' : 'subtle'} style={styles.dayLetter}>
                {formatWeekday(day).charAt(0)}
              </AppText>
            </View>
          ))}
        </View>
        {rows.map((row) => (
          <View key={row.slot} style={styles.row}>
            <View style={styles.rowLabel}>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {formatTime(row.slot).replace(':00', '')}
              </AppText>
            </View>
            {row.cells.map((cell, i) => (
              <View key={days[i]} style={styles.cellBox}>
                <View style={[styles.cell, CELL_STYLE[cell], i === days.length - 1 && styles.today]}>
                  {cell === 'taken' ? <Ionicons name="checkmark" size={11} color={colors.textOnYellow} /> : null}
                </View>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <View style={styles.rowLabel} />
          <View style={styles.rangeRow}>
            <AppText variant="caption" tone="subtle">
              {first ? formatDate(first, { omitCurrentYear: true }) : ''}
            </AppText>
            <AppText variant="caption" tone="subtle">
              {last ? 'Today' : ''}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LegendItem cell="taken" label="Taken" />
        <LegendItem cell="missed" label="Not logged" />
        <LegendItem cell="pending" label="Later today" />
        <LegendItem cell="off" label="Not scheduled" />
      </View>
    </View>
  );
}

function LegendItem({ cell, label }: { cell: GridCell; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.cell, styles.legendCell, CELL_STYLE[cell]]} />
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const CELL_STYLE: Record<GridCell, ViewStyle> = {
  taken: { backgroundColor: colors.yellow, borderColor: colors.yellowPressed },
  missed: { backgroundColor: colors.border, borderColor: colors.border },
  pending: { backgroundColor: colors.white, borderColor: colors.textSubtle, borderStyle: 'dashed' },
  off: { backgroundColor: colors.white, borderColor: colors.border },
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  flex: { flex: 1 },
  grid: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { width: 44, paddingRight: spacing.xs },
  cellBox: { flex: 1, alignItems: 'center', paddingHorizontal: 1.5 },
  cell: {
    width: '100%',
    maxWidth: 22,
    aspectRatio: 1,
    borderRadius: radius.sm - 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { borderColor: colors.black, borderWidth: 1.5 },
  dayLetter: { fontSize: 10, lineHeight: 14 },
  rangeRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendCell: { width: 12, height: 12, maxWidth: 12 },
});
