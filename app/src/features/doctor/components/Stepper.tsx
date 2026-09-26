import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, IconButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Formats the value for display and screen readers (`2 refills`). */
  format?: (value: number) => string;
  hint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** − value + control with 44 pt buttons; exposed to screen readers as an adjustable control. */
export function Stepper({ label, value, min, max, onChange, format, hint, disabled, style }: StepperProps) {
  const text = format ? format(value) : String(value);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const dec = () => onChange(clamp(value - 1));
  const inc = () => onChange(clamp(value + 1));
  return (
    <View style={[styles.container, style]}>
      <AppText variant="label">{label}</AppText>
      <View
        style={styles.row}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text }}
        accessibilityState={{ disabled: !!disabled }}
        aria-disabled={!!disabled}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (disabled) return;
          if (e.nativeEvent.actionName === 'increment') inc();
          if (e.nativeEvent.actionName === 'decrement') dec();
        }}
      >
        <IconButton
          icon="remove"
          variant="outline"
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          onPress={dec}
          disabled={disabled || value <= min}
        />
        <View style={styles.value}>
          <AppText variant="title3" align="center" numberOfLines={1}>
            {text}
          </AppText>
        </View>
        <IconButton
          icon="add"
          variant="yellow"
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          onPress={inc}
          disabled={disabled || value >= max}
        />
      </View>
      {hint ? (
        <AppText variant="small" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs + 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  value: { minWidth: 96, paddingHorizontal: spacing.sm },
});
