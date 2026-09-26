import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { LiveHighlight } from '../useLiveHighlights';

/** Small black pill that pops in when a medication changes live ("Updated by Dr. Reyes"). */
export function LiveUpdateTag({ highlight }: { highlight: LiveHighlight }) {
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 90,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [anim, highlight.stamp]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessibilityLabel={highlight.label}
      style={[
        styles.tag,
        { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
      ]}
    >
      <Ionicons name="sparkles" size={13} color={colors.yellow} />
      <AppText variant="caption" tone="inverse" numberOfLines={1}>
        {highlight.label}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
});
