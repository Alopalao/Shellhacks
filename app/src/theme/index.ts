// BRIAN design tokens. White background, black text, sunny-yellow buttons, light-yellow accents.
// Red is reserved for emergencies and errors.
import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F7F5', // neutral wells (inputs, skeletons)
  yellow: '#FFD400', // primary buttons, active tab, highlights
  yellowPressed: '#F0C400',
  yellowLight: '#FFF8D6', // light-yellow cards / sections
  yellowLighter: '#FFFBEA', // subtle page bands
  yellowBorder: '#F2DE8A',
  text: '#0A0A0A',
  textMuted: '#555555',
  textSubtle: '#6B6B6B', // ≥ 4.5:1 (WCAG AA) on white and every light surface below
  textOnYellow: '#0A0A0A',
  textOnBlack: '#FFFFFF',
  black: '#0A0A0A',
  white: '#FFFFFF',
  border: '#E7E7E4',
  borderStrong: '#0A0A0A',
  danger: '#D92D20',
  dangerLight: '#FEEDEB',
  warning: '#B54708',
  warningLight: '#FFF4E5',
  success: '#12805C',
  successLight: '#E8F6EF',
  online: '#12B76A',
  overlay: 'rgba(10,10,10,0.45)',
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const fontSize = {
  caption: 12,
  small: 13,
  body: 15,
  bodyLarge: 17,
  title3: 18,
  title2: 22,
  title1: 28,
  display: 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const lineHeight = (size: number) => Math.round(size * 1.45);

/** Soft card elevation that renders on iOS, Android and web. */
export const shadow: { card: ViewStyle; raised: ViewStyle } = {
  card: Platform.select<ViewStyle>({
    web: { boxShadow: '0 1px 2px rgba(10,10,10,0.06), 0 1px 8px rgba(10,10,10,0.04)' },
    default: { boxShadow: '0px 1px 6px rgba(10,10,10,0.08)' },
  })!,
  raised: Platform.select<ViewStyle>({
    web: { boxShadow: '0 6px 24px rgba(10,10,10,0.12)' },
    default: { boxShadow: '0px 6px 20px rgba(10,10,10,0.14)' },
  })!,
};

/** Max content width so web/tablet layouts stay readable. */
export const maxContentWidth = 720;

export const theme = { colors, spacing, radius, fontSize, fontWeight, lineHeight, shadow, maxContentWidth };
export type Theme = typeof theme;
