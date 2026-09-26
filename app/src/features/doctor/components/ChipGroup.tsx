import { StyleSheet, View } from 'react-native';
import { AppText, Chip, type IoniconName } from '@/components/ui';
import { spacing } from '@/theme';

export interface ChipOption {
  value: string;
  label: string;
  icon?: IoniconName;
}

export interface ChipGroupProps {
  label: string;
  options: readonly ChipOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
}

/** Labeled single-select group of chips (radio semantics). */
export function ChipGroup({ label, options, value, onChange, hint, error, disabled }: ChipGroupProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            icon={opt.icon}
            selected={opt.value === value}
            disabled={disabled}
            onPress={() => onChange(opt.value)}
            accessibilityLabel={`${label}: ${opt.label}`}
          />
        ))}
      </View>
      {error ? (
        <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
