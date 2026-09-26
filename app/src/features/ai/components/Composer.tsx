// Question composer: multiline input + yellow send button. Enter sends on web (Shift+Enter = newline).
import { Ionicons } from '@expo/vector-icons';
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  type TextStyle,
} from 'react-native';
import { AppText } from '@/components/ui';
import { colors, fontSize, radius, spacing } from '@/theme';

export const MAX_QUESTION_LENGTH = 4000;
const MIN_INPUT_HEIGHT = 44;
const MAX_INPUT_HEIGHT = 148;

export interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  /** An answer is on its way: sending is disabled and the button shows a spinner. */
  pending?: boolean;
  /** Disable typing and sending (e.g. while a conversation loads). */
  disabled?: boolean;
  /** Small print under the input. */
  note?: string;
  /** Rendered above the input (attached-context chips). */
  top?: ReactNode;
  /** Ref to the input (e.g. to focus it after a suggestion prefills the text). */
  inputRef?: RefObject<TextInput | null>;
}

/** The DOM node behind TextInput on web (react-native-web renders a <textarea>). */
interface WebTextArea {
  scrollHeight: number;
  style: { height: string };
}

function clampHeight(height: number): number {
  return Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, Math.ceil(height)));
}

interface WebKeyEvent {
  shiftKey?: boolean;
  isComposing?: boolean;
  keyCode?: number;
}

export function Composer({
  value,
  onChangeText,
  onSend,
  placeholder,
  pending = false,
  disabled = false,
  note,
  top,
  inputRef,
}: ComposerProps) {
  const [focused, setFocused] = useState(false);
  const [webHeight, setWebHeight] = useState(MIN_INPUT_HEIGHT);
  const localRef = useRef<TextInput | null>(null);
  const ref = inputRef ?? localRef;

  // Web: grow/shrink the textarea with its content (native multiline inputs do this themselves).
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current as unknown as WebTextArea | null;
    if (!node || typeof node.scrollHeight !== 'number' || !node.style) return;
    const previous = node.style.height;
    node.style.height = `${MIN_INPUT_HEIGHT}px`;
    const next = clampHeight(node.scrollHeight);
    node.style.height = previous;
    setWebHeight(next);
  }, [value, ref]);
  const canSend = !!value.trim() && !pending && !disabled;
  const nearLimit = value.length > MAX_QUESTION_LENGTH - 400;

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (Platform.OS !== 'web' || event.nativeEvent.key !== 'Enter') return;
    const native = event.nativeEvent as unknown as WebKeyEvent;
    if (native.shiftKey || native.isComposing || native.keyCode === 229) return;
    event.preventDefault();
    if (canSend) onSend();
  };

  const webSizing: TextStyle | null =
    Platform.OS === 'web'
      ? ({ height: webHeight, outlineStyle: 'none', resize: 'none' } as unknown as TextStyle)
      : null;

  return (
    <View style={styles.container}>
      {top}
      <View style={styles.row}>
        <View style={[styles.field, focused && styles.fieldFocused, disabled && styles.fieldDisabled]}>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onKeyPress={handleKeyPress}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.black}
            cursorColor={colors.black}
            multiline
            maxLength={MAX_QUESTION_LENGTH}
            editable={!disabled}
            textAlignVertical="center"
            accessibilityLabel="Your question"
            accessibilityHint={Platform.OS === 'web' ? 'Press Enter to send, Shift+Enter for a new line' : undefined}
            style={[styles.input, webSizing]}
          />
        </View>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={pending ? 'Waiting for the answer' : 'Send question'}
          accessibilityState={{ disabled: !canSend, busy: pending }}
          style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && canSend && styles.sendPressed]}
        >
          {pending ? (
            <ActivityIndicator size="small" color={colors.textOnYellow} />
          ) : (
            <Ionicons name="arrow-up" size={22} color={colors.textOnYellow} />
          )}
        </Pressable>
      </View>
      {nearLimit ? (
        <AppText variant="caption" tone={value.length >= MAX_QUESTION_LENGTH ? 'danger' : 'muted'} align="right">
          {value.length} / {MAX_QUESTION_LENGTH}
        </AppText>
      ) : null}
      {note ? (
        <AppText variant="caption" tone="subtle" align="center" numberOfLines={2}>
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  field: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md + 2,
  },
  fieldFocused: { borderColor: colors.borderStrong, backgroundColor: colors.white },
  fieldDisabled: { opacity: 0.6 },
  input: {
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    fontSize: fontSize.body,
    lineHeight: 21,
    color: colors.text,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
  sendPressed: { backgroundColor: colors.yellowPressed },
});
