import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Chip, Input } from '@/components/ui';
import { formatTime, sortTimes } from '@/lib/format';
import { spacing } from '@/theme';
import { MAX_TIMES, parseTimeInput } from '../prescription-form';

export interface TimeChipsEditorProps {
  times: readonly string[];
  onChange: (times: string[]) => void;
  error?: string | null;
  disabled?: boolean;
}

/** Reminder slots as removable chips plus an "add time" field (accepts 8am, 8:30 PM, 20:30…). */
export function TimeChipsEditor({ times, onChange, error, disabled }: TimeChipsEditorProps) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const sorted = sortTimes(times);
  const full = sorted.length >= MAX_TIMES;

  const add = () => {
    const parsed = parseTimeInput(draft);
    if (!parsed) {
      setDraftError('Try a time like 8:00 AM or 20:30.');
      return;
    }
    if (sorted.includes(parsed)) {
      setDraftError(`${formatTime(parsed)} is already on the schedule.`);
      return;
    }
    onChange(sortTimes([...sorted, parsed]));
    setDraft('');
    setDraftError(null);
  };

  return (
    <View style={styles.container}>
      <AppText variant="label">Reminder times</AppText>
      {sorted.length ? (
        <View style={styles.chips}>
          {sorted.map((t) => (
            <Chip
              key={t}
              label={formatTime(t)}
              icon="alarm-outline"
              selected
              disabled={disabled}
              onRemove={disabled ? undefined : () => onChange(sorted.filter((x) => x !== t))}
            />
          ))}
        </View>
      ) : (
        <AppText variant="small" tone="muted">
          No reminder times — the patient takes it as needed.
        </AppText>
      )}
      {!full ? (
        <View style={styles.addRow}>
          <Input
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              if (draftError) setDraftError(null);
            }}
            placeholder="Add a time, e.g. 1:00 PM"
            accessibilityLabel="Add a reminder time"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={add}
            editable={!disabled}
            error={draftError}
            leftIcon="time-outline"
            containerStyle={styles.flex}
          />
          <Button title="Add" icon="add" variant="outline" onPress={add} disabled={disabled || !draft.trim()} />
        </View>
      ) : (
        <AppText variant="small" tone="muted">
          That's the maximum of {MAX_TIMES} reminder times.
        </AppText>
      )}
      {error ? (
        <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
});
