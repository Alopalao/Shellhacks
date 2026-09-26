import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
}

/** Full-width tappable checkbox with a label (44 pt target). */
export function CheckboxRow({ label, checked, onChange, error, style }: CheckboxRowProps) {
  return (
    <View style={style}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        aria-checked={checked}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={[styles.box, checked && styles.boxChecked, !!error && !checked && styles.boxError]}>
          {checked ? <Ionicons name="checkmark" size={16} color={colors.black} /> : null}
        </View>
        <AppText variant="body" style={styles.label}>
          {label}
        </AppText>
      </Pressable>
      {error && !checked ? (
        <AppText variant="small" tone="danger" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  pressed: { opacity: 0.8 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  boxChecked: { backgroundColor: colors.yellow, borderColor: colors.black },
  boxError: { borderColor: colors.danger },
  label: { flex: 1 },
  error: { marginLeft: 36 },
});
