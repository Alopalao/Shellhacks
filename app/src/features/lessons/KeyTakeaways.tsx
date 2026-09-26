// Light-yellow "Key takeaways" card.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Markdown } from '@/components/ui';
import { colors, spacing } from '@/theme';

export interface KeyTakeawaysProps {
  items: readonly string[];
}

export function KeyTakeaways({ items }: KeyTakeawaysProps) {
  const takeaways = items.map((t) => t.trim()).filter(Boolean);
  if (!takeaways.length) return null;
  return (
    <Card variant="yellow" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="checkmark-done-circle" size={22} color={colors.text} />
        <AppText variant="title3">Key takeaways</AppText>
      </View>
      <View style={styles.list} accessibilityRole="list">
        {takeaways.map((item, i) => (
          <View key={`${i}-${item.slice(0, 16)}`} style={styles.item}>
            <View style={styles.check} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Ionicons name="checkmark" size={14} color={colors.textOnYellow} />
            </View>
            <Markdown text={item} style={styles.flex} />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  list: { gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm + 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginTop: 1,
    backgroundColor: colors.yellow,
    borderWidth: 1,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
