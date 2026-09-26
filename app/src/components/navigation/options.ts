import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';
import { useMemo } from 'react';
import { Platform, useWindowDimensions, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontWeight, maxContentWidth } from '@/theme';

const tabBarStyle: ViewStyle = {
  backgroundColor: colors.white,
  borderTopColor: colors.border,
  borderTopWidth: 1,
  minHeight: 64,
  paddingTop: 6,
};

/** Shared tab bar look: white bar, black active label, yellow icon pill (see TabIcon). */
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.text,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelPosition: 'below-icon',
  tabBarHideOnKeyboard: Platform.OS === 'android',
  tabBarStyle,
  tabBarLabelStyle: { fontSize: 11, fontWeight: fontWeight.semibold, marginTop: 2 },
  tabBarItemStyle: { minHeight: 52 },
  tabBarBadgeStyle: {
    backgroundColor: colors.black,
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    minWidth: 18,
    height: 18,
    lineHeight: 18,
  },
  sceneStyle: { backgroundColor: colors.background },
};

/**
 * `tabScreenOptions` sized to the window: on wide screens (web, tablets) the tab items are kept
 * within the same centred column as the page content (`maxContentWidth`) instead of spreading
 * across the whole window.
 */
export function useTabScreenOptions(): BottomTabNavigationOptions {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gutter = Math.max(insets.left, insets.right, Math.floor((width - maxContentWidth) / 2));
  return useMemo(() => ({ ...tabScreenOptions, tabBarStyle: { ...tabBarStyle, paddingHorizontal: gutter } }), [gutter]);
}

/**
 * Accessible name for a tab that includes its badge, e.g. "Care, 2 unread" — otherwise the count
 * is dropped (custom labels) or read run together with the title ("2Care").
 * Returns `label` unchanged without a badge, or undefined when there is nothing to add.
 */
export function tabAccessibilityLabel(
  title: string,
  badge: number | undefined,
  { label, noun = 'new' }: { label?: string; noun?: string } = {},
): string | undefined {
  if (!badge) return label;
  return `${label ?? title}, ${badge} ${noun}`;
}

/**
 * Options for the nested per-tab Stacks (patient/meds, doctor/messages, …): headerless — screens
 * render <ScreenHeader back />.
 */
export const nestedStackOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
} as const;
