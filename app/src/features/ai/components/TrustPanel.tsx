// Empty-state trust panel: where answers come from and what BRIAN is (an AI, not a clinician).
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { SOURCE_META } from '../config';

export interface TrustPanelProps {
  text: string;
}

const HIGHLIGHTED_SOURCES = [SOURCE_META.PubMed, SOURCE_META.MedlinePlus, SOURCE_META.openFDA];

export function TrustPanel({ text }: TrustPanelProps) {
  return (
    <Card variant="yellow" padding="lg" style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name="shield-checkmark" size={20} color={colors.textOnYellow} />
        </View>
        <AppText variant="title3" style={styles.flex}>
          Evidence-backed answers
        </AppText>
      </View>
      <AppText variant="body">{text}</AppText>
      <View style={styles.sources} accessibilityLabel="Sources: PubMed, NIH MedlinePlus, FDA drug labels">
        {HIGHLIGHTED_SOURCES.map((source) => (
          <View key={source.label} style={styles.source}>
            <Ionicons name={source.icon} size={14} color={colors.text} />
            <AppText variant="caption" weight="semibold">
              {source.label === 'FDA' ? 'FDA drug labels' : source.label === 'MedlinePlus' ? 'NIH MedlinePlus' : source.label}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
});
