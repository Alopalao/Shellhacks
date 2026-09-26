import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { medLabel } from '../format';
import type { TodayChecklist } from '../schedule';
import type { DoseToggle } from '../useDoseToggle';
import { DoseSlotRow } from './DoseSlotRow';

export interface DoseChecklistProps {
  checklist: TodayChecklist;
  doses: DoseToggle;
}

/** Today's doses grouped by Morning / Afternoon / Evening / Bedtime. */
export function DoseChecklist({ checklist, doses }: DoseChecklistProps) {
  return (
    <View style={styles.list}>
      {checklist.groups.map((group) => {
        const done = group.items.filter((i) => i.state === 'taken').length;
        return (
          <View key={group.period.id} style={styles.group}>
            <View style={styles.groupHeader} accessibilityRole="header">
              <Ionicons name={group.period.icon} size={16} color={colors.text} />
              <AppText variant="label" style={styles.groupTitle}>
                {group.period.label}
              </AppText>
              <AppText variant="caption" tone={done === group.items.length ? 'success' : 'subtle'}>
                {done}/{group.items.length}
              </AppText>
            </View>
            {group.items.map((item) => (
              <DoseSlotRow
                key={item.key}
                title={medLabel(item.rx)}
                subtitle={[item.rx.dose, item.rx.instructions].filter(Boolean).join(' · ')}
                slot={item.slot}
                state={item.state}
                takenAt={item.dose?.takenAt}
                pending={doses.isPending(item.rx.id, item.date, item.slot)}
                onToggle={() => void doses.toggle(item.rx, item.date, item.slot)}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  group: { gap: spacing.sm },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, paddingHorizontal: 2 },
  groupTitle: { flex: 1 },
});
