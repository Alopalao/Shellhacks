// "Sources" list: publisher + title, tappable (opens the page via Linking).
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SectionHeader, useToast } from '@/components/ui';
import type { LessonSource } from '@/lessons';
import { colors, radius, spacing } from '@/theme';
import { sourceHost } from './helpers';

export interface LessonSourcesProps {
  sources: readonly LessonSource[];
}

export function LessonSources({ sources }: LessonSourcesProps) {
  const toast = useToast();
  const valid = sources.filter((s) => /^https?:\/\//i.test(s.url.trim()));
  if (!valid.length) return null;

  const open = async (source: LessonSource) => {
    const url = source.url.trim();
    try {
      await Linking.openURL(url);
    } catch {
      toast.error("Couldn't open the link", url);
    }
  };

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Sources"
        icon="library-outline"
        subtitle="Trusted health organizations. Tap a source to read the original."
      />
      <View style={styles.list} accessibilityRole="list">
        {valid.map((source, i) => {
          const host = sourceHost(source.url);
          return (
            <Pressable
              key={`${source.url}-${i}`}
              onPress={() => {
                void open(source);
              }}
              accessibilityRole="link"
              accessibilityLabel={`Source ${i + 1}: ${source.publisher}, ${source.title}`}
              accessibilityHint={host ? `Opens ${host}` : 'Opens the source website'}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && styles.pressed]}
            >
              <View style={styles.number}>
                <AppText variant="caption" weight="bold" color={colors.textOnYellow}>
                  {i + 1}
                </AppText>
              </View>
              <View style={styles.texts}>
                <AppText variant="label" tone="muted" numberOfLines={1}>
                  {source.publisher}
                </AppText>
                <AppText variant="bodyStrong" numberOfLines={3} style={styles.title}>
                  {source.title}
                </AppText>
                {host ? (
                  <AppText variant="caption" tone="subtle" numberOfLines={1}>
                    {host}
                  </AppText>
                ) : null}
              </View>
              <Ionicons name="open-outline" size={18} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.yellowLighter },
  number: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  title: { textDecorationLine: 'underline' },
});
