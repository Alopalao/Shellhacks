import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fontSize, fontWeight } from '@/theme';

export type TextVariant =
  | 'display'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'lead'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'caption'
  | 'label';

export type TextTone = 'default' | 'muted' | 'subtle' | 'danger' | 'success' | 'warning' | 'inverse';

export interface AppTextProps extends TextProps {
  /** Typographic style. Default `body`. Headings (display/title*) get `accessibilityRole="header"`. */
  variant?: TextVariant;
  /** Semantic color. Default `default` (near-black). */
  tone?: TextTone;
  align?: TextStyle['textAlign'];
  /** Override font weight. */
  weight?: keyof typeof fontWeight;
  /** Raw color override (use sparingly; prefer `tone`). */
  color?: string;
}

export const textVariants: Record<TextVariant, TextStyle> = {
  display: { fontSize: fontSize.display, lineHeight: 42, fontWeight: fontWeight.heavy, letterSpacing: -0.8 },
  title1: { fontSize: fontSize.title1, lineHeight: 34, fontWeight: fontWeight.heavy, letterSpacing: -0.5 },
  title2: { fontSize: fontSize.title2, lineHeight: 28, fontWeight: fontWeight.bold, letterSpacing: -0.3 },
  title3: { fontSize: fontSize.title3, lineHeight: 24, fontWeight: fontWeight.bold, letterSpacing: -0.1 },
  lead: { fontSize: fontSize.bodyLarge, lineHeight: 25, fontWeight: fontWeight.regular },
  body: { fontSize: fontSize.body, lineHeight: 22, fontWeight: fontWeight.regular },
  bodyStrong: { fontSize: fontSize.body, lineHeight: 22, fontWeight: fontWeight.semibold },
  small: { fontSize: fontSize.small, lineHeight: 19, fontWeight: fontWeight.regular },
  caption: { fontSize: fontSize.caption, lineHeight: 16, fontWeight: fontWeight.medium },
  label: { fontSize: fontSize.small, lineHeight: 18, fontWeight: fontWeight.semibold, letterSpacing: 0.2 },
};

export const textTones: Record<TextTone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  danger: colors.danger,
  success: colors.success,
  warning: colors.warning,
  inverse: colors.textOnBlack,
};

const HEADINGS: ReadonlySet<TextVariant> = new Set(['display', 'title1', 'title2', 'title3']);

/** The app's only text primitive. `<AppText variant="title2">Today</AppText>` */
export function AppText({
  variant = 'body',
  tone = 'default',
  align,
  weight,
  color,
  style,
  accessibilityRole,
  ...rest
}: AppTextProps) {
  return (
    <Text
      accessibilityRole={accessibilityRole ?? (HEADINGS.has(variant) ? 'header' : undefined)}
      style={[
        styles.base,
        textVariants[variant],
        { color: color ?? textTones[tone] },
        align ? { textAlign: align } : null,
        weight ? { fontWeight: fontWeight[weight] } : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text },
});
