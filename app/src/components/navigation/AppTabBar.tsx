import { BottomTabBar, type BottomTabBarProps, type BottomTabNavigationOptions } from 'expo-router/js-tabs';
import { PlatformPressable } from 'expo-router/react-navigation';
import { View } from 'react-native';
import { ConnectionBanner } from '@/components/ui';
import type { IoniconName } from '@/components/ui';
import { colors } from '@/theme';
import { tabIcon } from './TabIcon';
import { tabScreenOptions } from './options';

/**
 * `<Tabs tabBar={renderAppTabBar}>`: the standard tab bar with the connection banner stacked just
 * above it, in the layout flow — so the banner never covers screen headers, content or toasts.
 */
export function renderAppTabBar(props: BottomTabBarProps) {
  return (
    <View>
      <ConnectionBanner />
      <BottomTabBar {...props} />
    </View>
  );
}

/**
 * Options that keep a tab looking (and announcing itself as) selected while one of its hidden
 * sibling routes is on screen — e.g. "Patients" on /doctor/patients/[id].
 */
export function activeTabOptions(icon: IoniconName, focusedIcon?: IoniconName): BottomTabNavigationOptions {
  return {
    tabBarIcon: tabIcon(icon, focusedIcon, true),
    tabBarLabelStyle: [tabScreenOptions.tabBarLabelStyle, { color: colors.text }],
    tabBarButton: (buttonProps) => <PlatformPressable {...buttonProps} aria-selected />,
  };
}
