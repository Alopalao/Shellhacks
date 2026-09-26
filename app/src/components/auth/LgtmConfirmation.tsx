import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { firstName } from '@/lib/format';
import { colors, fontWeight, spacing } from '@/theme';

export interface LgtmConfirmationProps {
  name: string;
  isNewUser: boolean;
}

/** Full-screen "LGTM ✓" confirmation shown for ~900 ms after a successful sign-in. */
export function LgtmConfirmation({ name, isNewUser }: LgtmConfirmationProps) {
  const [backdrop] = useState(() => new Animated.Value(0));
  const [badge] = useState(() => new Animated.Value(0));
  const [text] = useState(() => new Animated.Value(0));
  const useNative = Platform.OS !== 'web';
  const who = firstName(name);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(backdrop, { toValue: 1, duration: 140, useNativeDriver: useNative }),
      Animated.parallel([
        Animated.spring(badge, { toValue: 1, friction: 5, tension: 140, useNativeDriver: useNative }),
        Animated.timing(text, {
          toValue: 1,
          duration: 260,
          delay: 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useNative,
        }),
      ]),
    ]).start();
    AccessibilityInfo.announceForAccessibility?.("LGTM. You're in.");
  }, [backdrop, badge, text, useNative]);

  return (
    <Animated.View
      style={[styles.overlay, { opacity: backdrop }]}
      accessibilityViewIsModal
      accessibilityLiveRegion="assertive"
      accessible
      accessibilityLabel={`LGTM. You're in${who ? `, ${who}` : ''}.`}
    >
      <Animated.View
        style={[
          styles.badge,
          {
            transform: [
              { scale: badge.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              { rotate: badge.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
            ],
          },
        ]}
      >
        <Ionicons name="checkmark" size={64} color={colors.textOnYellow} />
      </Animated.View>
      <Animated.View
        style={[
          styles.texts,
          {
            opacity: text,
            transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          },
        ]}
      >
        <AppText style={styles.lgtm}>LGTM ✓</AppText>
        <AppText variant="lead" weight="semibold" align="center">
          lgtm — you’re in
        </AppText>
        <AppText tone="muted" align="center">
          {isNewUser ? `Account created. Welcome to BRIAN${who ? `, ${who}` : ''}!` : `Welcome back${who ? `, ${who}` : ''}.`}
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.black,
  },
  texts: { alignItems: 'center', gap: spacing.xs },
  lgtm: { fontSize: 44, lineHeight: 52, fontWeight: fontWeight.heavy, letterSpacing: 1 },
});
