import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { Chip } from './Chip';
import { IconButton } from './IconButton';
import { Input } from './Input';

export interface TagInputProps {
  label: string;
  values: readonly string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: string;
  /** Quick-add chips (hidden once added). */
  suggestions?: readonly string[];
  /** Text shown when there are no values. */
  emptyText?: string;
  maxLength?: number;
  style?: StyleProp<ViewStyle>;
}

/** Chip editor for short lists (allergies, conditions). Dedupe is case-insensitive. */
export function TagInput({
  label,
  values,
  onChange,
  placeholder = 'Add…',
  hint,
  suggestions = [],
  emptyText = 'None added',
  maxLength = 60,
  style,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const has = (v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase());

  const add = (raw: string) => {
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const next = [...values];
    for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    if (next.length !== values.length) onChange(next);
    setDraft('');
  };

  const remaining = suggestions.filter((s) => !has(s));

  return (
    <View style={[styles.container, style]}>
      <Input
        label={label}
        hint={hint}
        value={draft}
        onChangeText={setDraft}
        placeholder={placeholder}
        maxLength={maxLength}
        returnKeyType="done"
        submitBehavior="submit"
        onSubmitEditing={() => add(draft)}
        autoCapitalize="sentences"
        right={
          <IconButton
            icon="add"
            variant={draft.trim() ? 'yellow' : 'muted'}
            size={36}
            accessibilityLabel={`Add to ${label}`}
            disabled={!draft.trim()}
            onPress={() => add(draft)}
          />
        }
      />
      {values.length ? (
        <View style={styles.chips}>
          {values.map((v) => (
            <Chip key={v} label={v} onRemove={() => onChange(values.filter((x) => x !== v))} />
          ))}
        </View>
      ) : (
        <AppText variant="small" tone="subtle">
          {emptyText}
        </AppText>
      )}
      {remaining.length ? (
        <View style={styles.chips}>
          {remaining.map((s) => (
            <Chip key={s} label={s} icon="add" onPress={() => add(s)} accessibilityLabel={`Add ${s}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
