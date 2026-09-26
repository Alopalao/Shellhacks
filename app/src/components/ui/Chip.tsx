import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export interface ChipProps {
  label: string;
  /** Selected chips are yellow with a black label. */
  selected?: boolean;
  /** Makes the chip a toggle/filter button. */
  onPress?: () => void;
  /** Shows a remove (×) button with its own 44 pt target. */
  onRemove?: () => void;
  icon?: IoniconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Filter/selection chip or removable tag. */
export function Chip({ label, selected = false, onPress, onRemove, icon, disabled, accessibilityLabel, style }: ChipProps) {
  const fg = colors.text;
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={15} color={fg} /> : null}
      <AppText variant="label" color={fg} numberOfLines={1}>
        {label}
      </AppText>
    </>
  );
  const chipStyle = [
    styles.base,
    selected ? styles.selected : styles.unselected,
    onRemove ? styles.withRemove : null,
    disabled && styles.disabled,
  ];

  return (
    <View style={[styles.row, style]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ selected, disabled: !!disabled }}
          hitSlop={{ top: 6, bottom: 6 }}
          style={({ pressed }) => [...chipStyle, pressed && !selected && styles.pressed]}
        >
          {content}
          {onRemove ? <RemoveButton label={label} onRemove={onRemove} /> : null}
        </Pressable>
      ) : (
        <View style={chipStyle} accessible={!onRemove} accessibilityLabel={accessibilityLabel ?? label}>
          {content}
          {onRemove ? <RemoveButton label={label} onRemove={onRemove} /> : null}
        </View>
      )}
    </View>
  );
}

function RemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label}`}
      hitSlop={10}
      style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
    >
      <Ionicons name="close" size={14} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: 36,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  withRemove: { paddingRight: spacing.xs },
  unselected: { backgroundColor: colors.white, borderColor: colors.border },
  selected: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  pressed: { backgroundColor: colors.yellowLighter },
  disabled: { opacity: 0.45 },
  remove: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  removePressed: { backgroundColor: colors.border },
});
