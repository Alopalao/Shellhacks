import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { JARGON_CATEGORY_LABEL, type JargonMatch } from './glossary';

export interface JargonDecoderProps {
  /** Unique matches in reading order (`decodeJargon(note.body)`). */
  matches: readonly JargonMatch[];
  selectedKey?: string | null;
  /** Toggle a term (highlights it in the note). */
  onSelect?: (match: JargonMatch) => void;
}

/** "Jargon decoder": each abbreviation found in the note with its plain meaning. */
export function JargonDecoder({ matches, selectedKey, onSelect }: JargonDecoderProps) {
  return (
    <Card variant="default" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="book-outline" size={18} color={colors.text} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title3">Jargon decoder</AppText>
          <AppText variant="small" tone="muted">
            {matches.length
              ? `${matches.length} ${matches.length === 1 ? 'term' : 'terms'} from this note, in plain words. Tap one to find it in the note.`
              : 'Plain-language meanings of medical shorthand.'}
          </AppText>
        </View>
      </View>

      {matches.length === 0 ? (
        <View style={styles.none}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
          <AppText variant="small" tone="muted" style={styles.flex}>
            We didn&apos;t spot any medical shorthand in this note.
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {matches.map((m) => {
            const selected = selectedKey === m.key;
            const label = `${m.term} means ${m.plain}.${m.definition ? ` ${m.definition}` : ''}`;
            const content = (
              <>
                <View style={[styles.termPill, selected && styles.termPillSelected]}>
                  <AppText variant="label" numberOfLines={1}>
                    {m.term}
                  </AppText>
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{m.plain}</AppText>
                  {m.definition ? (
                    <AppText variant="small" tone="muted">
                      {m.definition}
                    </AppText>
                  ) : null}
                  <AppText variant="caption" tone="subtle">
                    {JARGON_CATEGORY_LABEL[m.category]}
                  </AppText>
                </View>
              </>
            );
            return onSelect ? (
              <Pressable
                key={m.key}
                onPress={() => onSelect(m)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint="Highlights this term in the note"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.rowPressed]}
              >
                {content}
              </Pressable>
            ) : (
              <View key={m.key} style={styles.row} accessible accessibilityLabel={label}>
                {content}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  none: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  list: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowSelected: { backgroundColor: colors.yellowLight },
  rowPressed: { backgroundColor: colors.yellowLighter },
  termPill: {
    minWidth: 64,
    maxWidth: 120,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.yellowLight,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  termPillSelected: { backgroundColor: colors.yellow, borderColor: colors.black },
});
