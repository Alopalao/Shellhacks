import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { AllergyAlert } from '../allergies';
import { CheckboxRow } from './CheckboxRow';

export interface AllergyWarningProps {
  alerts: readonly AllergyAlert[];
  patientFirstName: string;
  acknowledged: boolean;
  onAcknowledge: (value: boolean) => void;
  error?: string | null;
}

/** Red-outlined allergy alert shown while prescribing; the prescriber must acknowledge it to submit. */
export function AllergyWarning({ alerts, patientFirstName, acknowledged, onAcknowledge, error }: AllergyWarningProps) {
  if (!alerts.length) return null;
  const strong = alerts.some((a) => a.level === 'match');
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <View style={styles.header}>
        <Ionicons name="warning" size={20} color={colors.danger} />
        <AppText variant="bodyStrong" tone="danger" style={styles.flex}>
          {strong ? `Allergy alert for ${patientFirstName}` : `Allergy caution for ${patientFirstName}`}
        </AppText>
      </View>
      {alerts.map((a) => (
        <AppText key={a.allergy} variant="small">
          {a.message}
        </AppText>
      ))}
      <CheckboxRow
        label="I've reviewed this allergy and still want to prescribe"
        checked={acknowledged}
        onChange={onAcknowledge}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
