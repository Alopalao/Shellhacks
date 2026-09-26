import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge } from '@/components/ui';
import type { VisitNote } from '@/lib/contracts';
import { formatDate, truncate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

export interface NoteListItemProps {
  note: VisitNote;
  /** "Dr. Daniel Reyes" (omitted when unknown). */
  doctorName?: string | null;
  /** Arrived live during this session. */
  isNew?: boolean;
  onPress: () => void;
}

/** Visit-note row: icon tile, title (+ "New"), date · doctor, one-line preview. */
export function NoteListItem({ note, doctorName, isNew, onPress }: NoteListItemProps) {
  const date = formatDate(note.createdAt, { omitCurrentYear: true });
  const preview = truncate(note.body.replace(/\s+/g, ' ').trim(), 140);
  const meta = [date, doctorName].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isNew ? 'New visit note' : 'Visit note'}: ${note.title}. ${meta}`}
      accessibilityHint="Opens the note with a plain-language jargon decoder"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, isNew && styles.iconNew]}>
        <Ionicons name="document-text-outline" size={20} color={colors.text} />
      </View>
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
            {note.title}
          </AppText>
          {isNew ? <Badge label="New" tone="yellow" /> : null}
        </View>
        <AppText variant="small" tone="muted" numberOfLines={1}>
          {meta}
        </AppText>
        <AppText variant="small" tone="subtle" numberOfLines={1}>
          {preview}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.yellowLighter },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconNew: { backgroundColor: colors.yellow },
  texts: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1 },
});
