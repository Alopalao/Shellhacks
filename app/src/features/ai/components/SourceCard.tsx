// One evidence source under an answer: [n] marker, source label (PubMed / MedlinePlus / FDA / RxNorm…),
// title, publisher + year, authors, snippet; tap opens the link.
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { AppText } from '@/components/ui';
import type { Citation } from '@/lib/contracts';
import { colors, radius, spacing } from '@/theme';
import { sourceMeta } from '../config';

export interface SourceCardProps {
  citation: Citation;
  /** Briefly highlighted after its [n] chip was tapped. */
  highlighted?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}

function isHttpUrl(url: string | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

export function SourceCard({ citation, highlighted, onLayout }: SourceCardProps) {
  const meta = sourceMeta(citation.source);
  const byline = [citation.publisher, citation.year].filter(Boolean).join(' · ');
  const canOpen = isHttpUrl(citation.url);
  const a11yLabel = [
    `Source ${citation.id}`,
    meta.a11y,
    citation.title,
    byline,
    citation.authors,
  ]
    .filter(Boolean)
    .join('. ');

  const body = (
    <>
      <View style={styles.marker}>
        <AppText variant="caption" weight="bold" color={colors.textOnYellow}>
          {citation.id}
        </AppText>
      </View>
      <View style={styles.texts}>
        <View style={styles.sourceRow}>
          <Ionicons name={meta.icon} size={13} color={colors.textMuted} />
          <AppText variant="caption" tone="muted" weight="bold" style={styles.sourceLabel}>
            {meta.label.toUpperCase()}
          </AppText>
          {citation.pmid ? (
            <AppText variant="caption" tone="subtle" numberOfLines={1}>
              PMID {citation.pmid}
            </AppText>
          ) : null}
        </View>
        <AppText variant="bodyStrong" numberOfLines={3}>
          {citation.title}
        </AppText>
        {byline ? (
          <AppText variant="small" tone="muted" numberOfLines={1}>
            {byline}
          </AppText>
        ) : null}
        {citation.authors ? (
          <AppText variant="caption" tone="subtle" numberOfLines={1}>
            {citation.authors}
          </AppText>
        ) : null}
        {citation.snippet ? (
          <AppText variant="small" tone="muted" numberOfLines={3} style={styles.snippet}>
            {citation.snippet}
          </AppText>
        ) : null}
      </View>
      {canOpen ? <Ionicons name="open-outline" size={18} color={colors.text} style={styles.open} /> : null}
    </>
  );

  if (!canOpen) {
    return (
      <View
        onLayout={onLayout}
        style={[styles.card, highlighted && styles.highlighted]}
        accessible
        accessibilityLabel={a11yLabel}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onLayout={onLayout}
      onPress={() => {
        Linking.openURL(citation.url).catch(() => undefined);
      }}
      accessibilityRole="link"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Opens the source in your browser"
      style={({ pressed }) => [styles.card, highlighted && styles.highlighted, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  highlighted: { borderColor: colors.black, backgroundColor: colors.yellowLight },
  pressed: { backgroundColor: colors.yellowLighter },
  marker: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 7,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sourceLabel: { letterSpacing: 0.6 },
  snippet: { marginTop: spacing.xs },
  open: { marginTop: 2 },
});
