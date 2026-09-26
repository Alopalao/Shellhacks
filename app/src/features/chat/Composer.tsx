import { useState, type Ref } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputKeyPressEventData,
  type ViewStyle,
} from 'react-native';
import { AppText, IconButton } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, fontSize, radius, spacing } from '@/theme';

/** Server limit for a message body. */
export const MAX_MESSAGE_LENGTH = 4000;

const MIN_INPUT_HEIGHT = 44;
const MAX_INPUT_HEIGHT = 132;
const isWeb = Platform.OS === 'web';

export interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** Disables typing and sending (e.g. while the realtime connection is down). */
  disabled?: boolean;
  placeholder: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  inputRef?: Ref<TextInput>;
}

/** Web: the DOM keyboard event behind RN-web's onKeyPress. */
interface WebKeyEvent {
  key: string;
  shiftKey?: boolean;
  isComposing?: boolean;
}

/**
 * Message composer: auto-growing multi-line input + yellow send button.
 * Web: Enter sends, Shift+Enter inserts a new line.
 */
export function Composer({ value, onChangeText, onSend, disabled, placeholder, autoFocus, onBlur, inputRef }: ComposerProps) {
  const { isWide } = useBreakpoint();
  const [focused, setFocused] = useState(false);
  const [webHeight, setWebHeight] = useState(MIN_INPUT_HEIGHT);
  const canSend = !disabled && value.trim().length > 0 && value.length <= MAX_MESSAGE_LENGTH;
  const remaining = MAX_MESSAGE_LENGTH - value.length;

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (!isWeb) return;
    const native = e.nativeEvent as unknown as WebKeyEvent;
    if (native.key !== 'Enter' || native.shiftKey || native.isComposing) return;
    e.preventDefault();
    if (canSend) onSend();
  };

  const handleContentSize = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    if (!isWeb) return;
    const next = Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, Math.ceil(e.nativeEvent.contentSize.height)));
    setWebHeight((prev) => (prev === next ? prev : next));
  };

  // RN-web textareas don't grow by themselves; size them from the measured content (reset when cleared).
  const webSize: ViewStyle | null = isWeb ? { height: value ? webHeight : MIN_INPUT_HEIGHT } : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.field, focused && styles.fieldFocused, disabled && styles.fieldDisabled]}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSubtle}
            editable={!disabled}
            multiline
            autoFocus={autoFocus}
            maxLength={MAX_MESSAGE_LENGTH}
            onKeyPress={handleKeyPress}
            onContentSizeChange={handleContentSize}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            accessibilityLabel="Message"
            accessibilityHint={isWeb ? 'Press Enter to send, Shift and Enter for a new line' : undefined}
            accessibilityState={{ disabled: !!disabled }}
            selectionColor={colors.black}
            cursorColor={colors.black}
            textAlignVertical="center"
            style={[styles.input, webSize, webNoOutline]}
          />
        </View>
        <IconButton
          icon="arrow-up"
          variant={canSend ? 'yellow' : 'muted'}
          accessibilityLabel="Send message"
          disabled={!canSend}
          onPress={onSend}
          size={48}
          iconSize={22}
        />
      </View>
      {remaining < 300 ? (
        <AppText variant="caption" tone={remaining < 0 ? 'danger' : 'subtle'} align="right" accessibilityLiveRegion="polite">
          {remaining} characters left
        </AppText>
      ) : isWeb && isWide && focused ? (
        <AppText variant="caption" tone="subtle">
          Enter to send · Shift + Enter for a new line
        </AppText>
      ) : null}
    </View>
  );
}

// Removes the browser focus ring (the field draws its own focused border).
const webNoOutline = isWeb ? ({ outlineStyle: 'none' } as unknown as ViewStyle) : null;

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  field: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  fieldFocused: { borderColor: colors.borderStrong, backgroundColor: colors.white },
  fieldDisabled: { opacity: 0.6 },
  input: {
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    fontSize: fontSize.body,
    lineHeight: 21,
    color: colors.text,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
  },
});
