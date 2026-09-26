import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fontWeight } from '@/theme';
import { AppText } from './AppText';

export interface BrandMarkProps {
  /** `sm` 28 · `md` 40 (default) · `lg` 56 · `xl` 72 — the tile size. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** `full` = tile + "BRIAN" wordmark (default); `icon` = tile only; `wordmark` = text only. */
  variant?: 'full' | 'icon' | 'wordmark';
  /** Small tagline under the wordmark. */
  tagline?: string;
  style?: StyleProp<ViewStyle>;
}

const TILE = { sm: 28, md: 40, lg: 56, xl: 72 } as const;

/** BRIAN logo: black "B" on a sunny-yellow tile + wordmark with a yellow underline accent. */
export function BrandMark({ size = 'md', variant = 'full', tagline, style }: BrandMarkProps) {
  const tile = TILE[size];
  const wordSize = Math.round(tile * 0.62);
  return (
    <View
      style={[styles.row, { gap: Math.round(tile * 0.28) }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={tagline ? `BRIAN. ${tagline}` : 'BRIAN'}
    >
      {variant !== 'wordmark' ? (
        <View style={[styles.tile, { width: tile, height: tile, borderRadius: Math.round(tile * 0.28) }]}>
          <AppText
            color={colors.textOnYellow}
            style={{ fontSize: Math.round(tile * 0.64), lineHeight: Math.round(tile * 0.8), fontWeight: fontWeight.heavy }}
          >
            B
          </AppText>
        </View>
      ) : null}
      {variant !== 'icon' ? (
        <View>
          <View>
            <View style={[styles.underline, { height: Math.max(4, Math.round(wordSize * 0.3)), bottom: Math.round(wordSize * 0.12) }]} />
            <AppText
              style={{
                fontSize: wordSize,
                lineHeight: Math.round(wordSize * 1.2),
                fontWeight: fontWeight.heavy,
                letterSpacing: wordSize * 0.06,
              }}
            >
              BRIAN
            </AppText>
          </View>
          {tagline ? (
            <AppText variant="caption" tone="muted">
              {tagline}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  tile: { backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  underline: { position: 'absolute', left: -2, right: -2, backgroundColor: colors.yellow, borderRadius: 2 },
});
