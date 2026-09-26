import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, stripMarkdown } from '@/components/ui';
import type { VisitNote } from '@/lib/contracts';
import { formatDate, truncate } from '@/lib/format';
import { colors, spacing } from '@/theme';

export interface LatestNoteCardProps {
  note: VisitNote;
  /** "Dr. Daniel Reyes" */
  doctorName?: string;
  onExplain: () => void;
  onOpen: () => void;
}

/** Light-yellow card with the most recent visit note and "Explain with BRIAN". */
export function LatestNoteCard({ note, doctorName, onExplain, onOpen }: LatestNoteCardProps) {
  const excerpt = truncate(stripMarkdown(note.body).replace(/\s+/g, ' ').trim(), 180);
  const meta = [formatDate(note.createdAt, { omitCurrentYear: true }), doctorName].filter(Boolean).join(' · ');
  return (
    <Card variant="yellow" style={styles.card}>
      <View style={styles.eyebrow}>
        <Ionicons name="document-text-outline" size={16} color={colors.text} />
        <AppText variant="label" style={styles.flex}>
          Latest visit note
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </AppText>
      </View>
      <AppText variant="title3">{note.title}</AppText>
      <AppText variant="small" tone="muted" numberOfLines={4}>
        {excerpt}
      </AppText>
      <AppText variant="caption" tone="muted">
        Full of medical shorthand? BRIAN can put it in plain language.
      </AppText>
      <View style={styles.actions}>
        <Button
          title="Explain with BRIAN"
          icon="sparkles"
          onPress={onExplain}
          style={styles.flex}
          accessibilityHint="Opens BRIAN AI with a plain-language explanation of this note"
        />
        <Button title="Read note" variant="outline" onPress={onOpen} accessibilityLabel={`Read note: ${note.title}`} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  flex: { flexGrow: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});
