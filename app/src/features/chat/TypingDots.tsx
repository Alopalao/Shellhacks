import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

/** True when the OS / browser asks for reduced motion. */
function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (!cancelled) setReduce(value);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
  return reduce;
}

export interface TypingDotsProps {
  /** Dot diameter (default 6). */
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const PEAKS = [0.25, 0.45, 0.65];

/** Three softly pulsing dots ("…" typing animation). Decorative — label the parent. */
export function TypingDots({ size = 6, color = colors.textMuted, style }: TypingDotsProps) {
  const reduceMotion = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1_200,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, reduceMotion]);

  return (
    <View
      style={[styles.row, { gap: Math.max(3, Math.round(size * 0.6)) }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {PEAKS.map((peak) => (
        <Animated.View
          key={peak}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: reduceMotion
              ? 0.7
              : progress.interpolate({
                  inputRange: [0, peak - 0.2, peak, peak + 0.2, 1],
                  outputRange: [0.3, 0.3, 1, 0.3, 0.3],
                }),
            transform: reduceMotion
              ? undefined
              : [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, peak - 0.2, peak, peak + 0.2, 1],
                      outputRange: [0, 0, -size * 0.35, 0, 0],
                    }),
                  },
                ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
