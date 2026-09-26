import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Avatar, Badge, Card, Chip, Divider, IconButton } from '@/components/ui';
import type { User, VisitNote } from '@/lib/contracts';
import { displayName, formatDate, formatTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { JargonMatch } from './glossary';
import { HighlightedNoteText } from './HighlightedNoteText';

export interface NoteCardProps {
  note: VisitNote;
  /** The note's author, when known. */
  doctor?: User | null;
  highlight: boolean;
  onToggleHighlight: () => void;
  /** Currently selected jargon term (shows its meaning under the note). */
  selected: JargonMatch | null;
  onSelectTerm: (match: JargonMatch | null) => void;
}

/** Clean clinical card: title, author, date, the verbatim note (jargon highlighted) and a term callout. */
export function NoteCard({ note, doctor, highlight, onToggleHighlight, selected, onSelectTerm }: NoteCardProps) {
  const author = doctor ? displayName(doctor) : 'Your doctor';
  const credentials = doctor?.doctor?.credentials?.trim();
  const authorLine = [doctor?.doctor?.specialty, doctor?.doctor?.clinic].filter(Boolean).join(' · ');
  const date = formatDate(note.createdAt, { weekday: true, long: true });
  const time = formatTime(note.createdAt);

  return (
    <Card variant="default" padding="xl" style={styles.card}>
      <View style={styles.topRow}>
        <Badge label="Visit note" tone="yellow" icon="document-text" size="md" />
        <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.date}>
          {date}
          {time ? ` · ${time}` : ''}
        </AppText>
      </View>

      <AppText variant="title2">{note.title}</AppText>

      <View style={styles.author} accessible accessibilityLabel={`Written by ${author}${credentials ? `, ${credentials}` : ''}${authorLine ? `, ${authorLine}` : ''}`}>
        <Avatar user={doctor} name={author} size={40} accessibilityLabel="" />
        <View style={styles.flex}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {author}
            {credentials ? `, ${credentials}` : ''}
          </AppText>
          {authorLine ? (
            <AppText variant="small" tone="muted" numberOfLines={1}>
              {authorLine}
            </AppText>
          ) : null}
        </View>
      </View>

      <Divider spacing="xs" />

      <View style={styles.labelRow}>
        <AppText variant="label" tone="muted">
          WHAT YOUR DOCTOR WROTE
        </AppText>
        <Chip
          label={highlight ? 'Highlighting jargon' : 'Highlight jargon'}
          icon={highlight ? 'color-wand' : 'color-wand-outline'}
          selected={highlight}
          onPress={onToggleHighlight}
          accessibilityLabel="Highlight medical shorthand in the note"
        />
      </View>

      <HighlightedNoteText
        body={note.body}
        highlight={highlight}
        selectedKey={selected?.key ?? null}
        onSelectTerm={(m) => onSelectTerm(selected?.key === m.key ? null : m)}
      />

      {selected ? (
        <View style={styles.callout} accessibilityLiveRegion="polite">
          <View style={styles.calloutText} accessible accessibilityLabel={`${selected.term} means ${selected.plain}. ${selected.definition ?? ''}`}>
            <View style={styles.calloutTitle}>
              <Ionicons name="bulb-outline" size={16} color={colors.text} />
              <AppText variant="bodyStrong" style={styles.flex}>
                {selected.term} = {selected.plain}
              </AppText>
            </View>
            {selected.definition ? (
              <AppText variant="small" tone="muted">
                {selected.definition}
              </AppText>
            ) : null}
          </View>
          <IconButton icon="close" accessibilityLabel="Close definition" size={36} iconSize={18} onPress={() => onSelectTerm(null)} />
        </View>
      ) : highlight ? (
        <AppText variant="caption" tone="subtle">
          Tap a highlighted word to see what it means.
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  date: { flexShrink: 1 },
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLight,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  calloutText: { flex: 1, gap: 2 },
  calloutTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
});
