import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

export interface ProgressBarProps {
  /** 0..1 (clamped). */
  value: number;
  /** Bar color (default yellow). Track is light grey. */
  color?: string;
  height?: number;
  /** e.g. "Adherence 86 percent". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Horizontal progress bar (adherence, lesson progress). */
export function ProgressBar({ value, color = colors.yellow, height = 8, accessibilityLabel, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
    >
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.surfaceMuted, overflow: 'hidden', borderRadius: radius.pill },
  fill: { height: '100%' },
});
