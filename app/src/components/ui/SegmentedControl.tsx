import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IoniconName;
  accessibilityLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Label for the whole group (screen readers). */
  accessibilityLabel?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Single-choice toggle (e.g. patient / doctor). Selected segment is yellow with a black label. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  size = 'md',
  disabled,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, disabled && styles.disabled, style]}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => !selected && onChange(opt.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            accessibilityState={{ checked: selected, selected, disabled: !!disabled }}
            // react-native-web ignores accessibilityState; aria-checked reaches the DOM (and native).
            aria-checked={selected}
            style={({ pressed }) => [
              styles.segment,
              { minHeight: size === 'sm' ? 36 : 44 },
              selected ? styles.selected : pressed ? styles.pressed : null,
            ]}
          >
            {opt.icon ? <Ionicons name={opt.icon} size={16} color={selected ? colors.textOnYellow : colors.textMuted} /> : null}
            <AppText
              variant={size === 'sm' ? 'caption' : 'label'}
              weight={selected ? 'bold' : 'semibold'}
              color={selected ? colors.textOnYellow : colors.textMuted}
              numberOfLines={1}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  selected: { backgroundColor: colors.yellow },
  pressed: { backgroundColor: colors.yellowLighter },
  disabled: { opacity: 0.5 },
});
