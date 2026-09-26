import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Chip, Input } from '@/components/ui';
import { formatTime, sortTimes } from '@/lib/format';
import { spacing } from '@/theme';
import { parseTimeInput, QUICK_TIMES } from '../format';

export interface TimeChipsEditorProps {
  label: string;
  /** `HH:mm` values. */
  times: readonly string[];
  onChange: (times: string[]) => void;
  hint?: string;
  error?: string | null;
  /** Max number of reminder times (server allows 12). */
  max?: number;
}

/** Reminder times as removable chips, with quick-add presets and a free-form "add time" field. */
export function TimeChipsEditor({ label, times, onChange, hint, error, max = 12 }: TimeChipsEditorProps) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const full = times.length >= max;

  const add = (value: string) => {
    if (times.includes(value)) {
      setDraftError(`${formatTime(value)} is already on the list.`);
      return false;
    }
    if (full) {
      setDraftError(`You can set up to ${max} times.`);
      return false;
    }
    onChange(sortTimes([...times, value]));
    setDraftError(null);
    return true;
  };

  const addDraft = () => {
    if (!draft.trim()) return;
    const parsed = parseTimeInput(draft);
    if (!parsed) {
      setDraftError('Try a time like 8:30 AM or 20:30.');
      return;
    }
    if (add(parsed)) setDraft('');
  };

  const quick = QUICK_TIMES.filter((q) => !times.includes(q.value));

  return (
    <View style={styles.container}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <View style={styles.chips} accessibilityLabel={`${label}: ${times.length ? times.map((t) => formatTime(t)).join(', ') : 'none'}`}>
        {times.length ? (
          times.map((t) => (
            <Chip
              key={t}
              label={formatTime(t)}
              icon="alarm-outline"
              selected
              onRemove={() => onChange(times.filter((x) => x !== t))}
              accessibilityLabel={`Reminder at ${formatTime(t)}`}
            />
          ))
        ) : (
          <AppText variant="small" tone="muted">
            No reminder times yet.
          </AppText>
        )}
      </View>
      {quick.length && !full ? (
        <View style={styles.chips}>
          {quick.map((q) => (
            <Chip
              key={q.value}
              label={formatTime(q.value)}
              icon="add"
              onPress={() => add(q.value)}
              accessibilityLabel={`Add ${q.label.toLowerCase()} reminder at ${formatTime(q.value)}`}
            />
          ))}
        </View>
      ) : null}
      <Input
        value={draft}
        onChangeText={(t) => {
          setDraft(t);
          if (draftError) setDraftError(null);
        }}
        placeholder="Add a time, e.g. 7:30 AM"
        accessibilityLabel="Add a reminder time"
        leftIcon="time-outline"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={addDraft}
        editable={!full}
        error={draftError ?? error}
        hint={hint}
        right={<Button title="Add" size="sm" variant="outline" onPress={addDraft} disabled={!draft.trim() || full} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { marginLeft: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
