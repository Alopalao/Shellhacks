import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import type { VisitNote } from '@/lib/contracts';
import { formatDateTime } from '@/lib/format';
import { colors, spacing } from '@/theme';

const PREVIEW_CHARS = 180;

/** A visit note on the patient's chart; long notes expand in place. */
export function VisitNoteItem({ note, isNew }: { note: VisitNote; isNew?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const long = note.body.length > PREVIEW_CHARS || note.body.split('\n').length > 3;
  return (
    <Card variant="outline" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Ionicons name="document-text-outline" size={18} color={colors.text} />
        </View>
        <View style={styles.titles}>
          <AppText variant="bodyStrong">{note.title}</AppText>
          <AppText variant="caption" tone="muted">
            {formatDateTime(note.createdAt)}
            {isNew ? ' · New' : ''}
          </AppText>
        </View>
      </View>
      <AppText variant="small" numberOfLines={expanded || !long ? undefined : 3} selectable>
        {note.body}
      </AppText>
      {long ? (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? `Show less of ${note.title}` : `Read all of ${note.title}`}
          accessibilityState={{ expanded }}
          hitSlop={8}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
        >
          <AppText variant="label">{expanded ? 'Show less' : 'Read more'}</AppText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.text} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1, gap: 2 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 32 },
  pressed: { opacity: 0.7 },
});
