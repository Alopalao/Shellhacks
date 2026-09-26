// "Thinking" bubble while an answer is on its way: staged progress text (red-flag check → PubMed →
// MedlinePlus → FDA labels → writing), a step indicator, and a cancel button.
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { AppText, BrandMark, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { SLOW_ANSWER_MS, THINKING_STAGES } from '../config';

export interface ThinkingBubbleProps {
  /** Date.now() when the question was sent. */
  startedAt: number;
  assistantName: string;
  onCancel?: () => void;
}

function stageIndexFor(elapsed: number): number {
  let index = 0;
  THINKING_STAGES.forEach((stage, i) => {
    if (elapsed >= stage.at) index = i;
  });
  return index;
}

export function ThinkingBubble({ startedAt, assistantName, onCancel }: ThinkingBubbleProps) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, Date.now() - startedAt));
    tick();
    const timer = setInterval(tick, 400);
    return () => clearInterval(timer);
  }, [startedAt]);

  const index = stageIndexFor(elapsed);
  const stage = THINKING_STAGES[index]!;
  const slow = elapsed >= SLOW_ANSWER_MS;

  return (
    <View style={styles.row}>
      <BrandMark variant="icon" size="sm" />
      <View
        style={styles.bubble}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${assistantName} is working. ${stage.label}`}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.statusRow}>
          <TypingDots />
          <AppText variant="bodyStrong" style={styles.flex} numberOfLines={2}>
            {stage.label}
          </AppText>
        </View>
        <View style={styles.steps} importantForAccessibility="no-hide-descendants">
          {THINKING_STAGES.map((s, i) => (
            <View key={s.label} style={[styles.step, i <= index ? styles.stepDone : null]} />
          ))}
        </View>
        {slow ? (
          <AppText variant="small" tone="muted">
            Still working — evidence lookups can take up to a minute.
          </AppText>
        ) : null}
      </View>
      {onCancel ? (
        <Button
          title="Stop"
          variant="ghost"
          size="sm"
          icon="stop-circle-outline"
          onPress={onCancel}
          accessibilityLabel="Stop waiting for this answer"
          style={styles.cancel}
        />
      ) : null}
    </View>
  );
}

const useNativeDriver = Platform.OS !== 'web';

function TypingDots() {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View style={styles.dots} importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((i) => {
        const start = i * 0.2;
        const opacity = progress.interpolate({
          inputRange: [0, start, start + 0.2, start + 0.4, 1],
          outputRange: [0.25, 0.25, 1, 0.25, 0.25],
          extrapolate: 'clamp',
        });
        return <Animated.View key={i} style={[styles.dot, { opacity }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, flexWrap: 'wrap' },
  bubble: {
    flexShrink: 1,
    flexGrow: 1,
    maxWidth: 440,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    backgroundColor: colors.yellowLighter,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  dots: { flexDirection: 'row', gap: 4, paddingHorizontal: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.black },
  steps: { flexDirection: 'row', gap: 4 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.yellowBorder },
  stepDone: { backgroundColor: colors.black },
  cancel: { alignSelf: 'center' },
});
