import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { IoniconName } from '@/components/ui';
import { colors, radius } from '@/theme';

export interface TabIconProps {
  focused: boolean;
  icon: IoniconName;
  /** Filled variant used while focused (defaults to `icon`). */
  focusedIcon?: IoniconName;
}

/** Tab bar icon: black icon on a yellow pill when active; muted outline icon otherwise. */
export function TabIcon({ focused, icon, focusedIcon }: TabIconProps) {
  return (
    <View style={[styles.pill, focused && styles.active]}>
      <Ionicons name={focused ? (focusedIcon ?? icon) : icon} size={20} color={focused ? colors.textOnYellow : colors.textMuted} />
    </View>
  );
}

/** Helper for `options={{ tabBarIcon: tabIcon('home-outline', 'home') }}`. */
export function tabIcon(icon: IoniconName, focusedIcon?: IoniconName) {
  function renderTabIcon({ focused }: { focused: boolean }) {
    return <TabIcon focused={focused} icon={icon} focusedIcon={focusedIcon} />;
  }
  return renderTabIcon;
}

const styles = StyleSheet.create({
  pill: { width: 52, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.yellow },
});
