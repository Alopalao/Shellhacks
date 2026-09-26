import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';
import { Platform } from 'react-native';
import { colors, fontWeight } from '@/theme';

/** Shared tab bar look: white bar, black active label, yellow icon pill (see TabIcon). */
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.text,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelPosition: 'below-icon',
  tabBarHideOnKeyboard: Platform.OS === 'android',
  tabBarStyle: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    minHeight: 64,
    paddingTop: 6,
  },
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
 * Options for the nested per-tab Stacks (patient/meds, doctor/messages, …): headerless — screens
 * render <ScreenHeader back />.
 */
export const nestedStackOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
} as const;
