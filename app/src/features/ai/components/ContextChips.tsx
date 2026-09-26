// Removable chips for the context attached to the next question (visit note / medication / lesson).
import { StyleSheet, View } from 'react-native';
import { AppText, Chip, type IoniconName } from '@/components/ui';
import { spacing } from '@/theme';

export type ContextKind = 'note' | 'medication' | 'lesson';

export interface ContextChipItem {
  kind: ContextKind;
  /** Short visible label (keep ≤ ~26 characters so the remove button stays on screen). */
  label: string;
  icon: IoniconName;
}

export interface ContextChipsProps {
  items: readonly ContextChipItem[];
  onRemove: (kind: ContextKind) => void;
  disabled?: boolean;
}

const KIND_LABEL: Record<ContextKind, string> = { note: 'visit note', medication: 'medication', lesson: 'lesson' };

export function ContextChips({ items, onRemove, disabled }: ContextChipsProps) {
  if (!items.length) return null;
  return (
    <View style={styles.row}>
      <AppText variant="caption" tone="muted" style={styles.label}>
        Attached
      </AppText>
      {items.map((item) => (
        <Chip
          key={item.kind}
          label={item.label}
          icon={item.icon}
          selected
          onRemove={disabled ? undefined : () => onRemove(item.kind)}
          accessibilityLabel={`Attached ${KIND_LABEL[item.kind]}: ${item.label}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  label: { textTransform: 'uppercase', letterSpacing: 0.6 },
});
