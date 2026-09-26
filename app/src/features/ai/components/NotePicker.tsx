// "Which note should BRIAN explain?" — pick one of the patient's visit notes to attach.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, EmptyState, ErrorState, ListItem, LoadingState, stripMarkdown } from '@/components/ui';
import type { VisitNote } from '@/lib/contracts';
import { formatDate, truncate } from '@/lib/format';
import { spacing } from '@/theme';

const INITIAL_COUNT = 3;

export interface NotePickerProps {
  notes: VisitNote[] | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onSelect: (note: VisitNote) => void;
}

export function NotePicker({ notes, loading, error, onRetry, onSelect }: NotePickerProps) {
  const [showAll, setShowAll] = useState(false);
  const list = notes ?? [];
  const visible = showAll ? list : list.slice(0, INITIAL_COUNT);

  let body;
  if (loading && !notes) {
    body = <LoadingState label="Loading your visit notes…" fill={false} />;
  } else if (error && !notes) {
    body = <ErrorState error={error} compact title="Couldn't load your notes" onRetry={onRetry} />;
  } else if (!list.length) {
    body = (
      <EmptyState
        compact
        icon="document-text-outline"
        title="No visit notes yet"
        message="When your doctor writes a visit note, you can attach it here and BRIAN will explain it in plain language."
      />
    );
  } else {
    body = (
      <View style={styles.list}>
        {visible.map((note) => (
          <ListItem
            key={note.id}
            leftIcon="document-text-outline"
            title={note.title}
            subtitle={truncate(stripMarkdown(note.body).replace(/\s+/g, ' '), 140)}
            meta={formatDate(note.createdAt, { omitCurrentYear: true })}
            onPress={() => onSelect(note)}
            accessibilityLabel={`Attach visit note: ${note.title}, ${formatDate(note.createdAt)}`}
            accessibilityHint="Attaches this note so BRIAN can explain it"
          />
        ))}
        {list.length > INITIAL_COUNT ? (
          <Button
            title={showAll ? 'Show fewer notes' : `Show all ${list.length} notes`}
            variant="ghost"
            size="sm"
            icon={showAll ? 'chevron-up' : 'chevron-down'}
            onPress={() => setShowAll((v) => !v)}
          />
        ) : null}
      </View>
    );
  }

  return (
    <Card variant="outline" padding="md" style={styles.card}>
      <View style={styles.head}>
        <AppText variant="bodyStrong">Which note should BRIAN explain?</AppText>
        <AppText variant="small" tone="muted">
          Pick a visit note to attach. BRIAN translates the medical shorthand into plain language.
        </AppText>
      </View>
      {body}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  head: { gap: 2, paddingHorizontal: spacing.xs },
  list: { gap: spacing.xxs },
});
