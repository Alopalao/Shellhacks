import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode, type Ref } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export interface InputProps extends TextInputProps {
  /** Visible label above the field (also used as the accessibility label). */
  label?: string;
  /** Helper text under the field. */
  hint?: string;
  /** Error text under the field (turns the border red). */
  error?: string | null;
  /** Ionicons name shown inside the field on the left. */
  leftIcon?: IoniconName;
  /** Element rendered inside the field on the right (e.g. an IconButton). */
  right?: ReactNode;
  /** Marks the label with "(optional)". */
  optional?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  ref?: Ref<TextInput>;
}

/** Labeled single-line text field. */
export function Input({
  label,
  hint,
  error,
  leftIcon,
  right,
  optional,
  containerStyle,
  style,
  onFocus,
  onBlur,
  editable = true,
  multiline,
  ref,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.borderStrong : colors.border;
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
          {optional ? <AppText variant="small" tone="subtle"> (optional)</AppText> : null}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          { borderColor },
          focused && styles.fieldFocused,
          !editable && styles.fieldDisabled,
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={colors.textMuted} style={multiline ? styles.iconTop : null} />
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={rest.accessibilityLabel ?? label ?? rest.placeholder}
          accessibilityHint={rest.accessibilityHint ?? hint}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.black}
          cursorColor={colors.black}
          editable={editable}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, webNoOutline, style]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <View style={styles.messageRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <AppText variant="small" tone="danger" style={styles.flex}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText variant="small" tone="muted" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export interface TextAreaProps extends InputProps {
  /** Minimum visible height in px (default 120). */
  minHeight?: number;
}

/** Multi-line text field (notes, messages to the doctor). */
export function TextArea({ minHeight = 120, style, ...rest }: TextAreaProps) {
  return <Input multiline textAlignVertical="top" style={[{ minHeight }, style]} {...rest} />;
}

// Removes the browser focus ring (we draw our own focused border).
const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as ViewStyle) : null;

const styles = StyleSheet.create({
  container: { gap: spacing.xs + 2 },
  label: { marginLeft: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.white,
  },
  fieldMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  fieldFocused: { backgroundColor: colors.white },
  fieldDisabled: { backgroundColor: colors.surfaceMuted },
  iconTop: { marginTop: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: fontSize.body,
    color: colors.text,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
  },
  inputMultiline: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: 2 },
  hint: { marginLeft: 2 },
  flex: { flex: 1 },
});
