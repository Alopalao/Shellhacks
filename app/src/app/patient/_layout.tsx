import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { renderAppTabBar } from '@/components/navigation/AppTabBar';
import { RoleGuard } from '@/components/navigation/RoleGuard';
import { tabIcon } from '@/components/navigation/TabIcon';
import { tabAccessibilityLabel, useTabScreenOptions } from '@/components/navigation/options';
import { ChatBadgeSync } from '@/features/chat';
import { useTabBadges } from '@/lib/tab-badges';

export default function PatientLayout() {
  return (
    <RoleGuard role="patient">
      <PatientTabs />
    </RoleGuard>
  );
}

function PatientTabs() {
  const badges = useTabBadges();
  const screenOptions = useTabScreenOptions();
  return (
    <View style={styles.flex}>
      {/* The tab bar carries the "Reconnecting…" banner above it (renderAppTabBar). */}
      <Tabs screenOptions={screenOptions} tabBar={renderAppTabBar} backBehavior="history">
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Home', badges['patient/index']),
            tabBarIcon: tabIcon('home-outline', 'home'),
            tabBarBadge: badges['patient/index'],
          }}
        />
        <Tabs.Screen
          name="meds"
          options={{
            title: 'Meds',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Meds', badges['patient/meds']),
            tabBarIcon: tabIcon('medkit-outline', 'medkit'),
            tabBarBadge: badges['patient/meds'],
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'BRIAN AI',
            tabBarAccessibilityLabel: tabAccessibilityLabel('BRIAN AI', badges['patient/ai'], {
              label: 'BRIAN AI doctor',
              noun: 'new answer',
            }),
            tabBarIcon: tabIcon('sparkles-outline', 'sparkles'),
            tabBarBadge: badges['patient/ai'],
          }}
        />
        <Tabs.Screen
          name="care"
          options={{
            title: 'Care',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Care', badges['patient/care'], {
              label: 'Care: your doctor, messages and visit notes',
              noun: 'unread',
            }),
            tabBarIcon: tabIcon('chatbubbles-outline', 'chatbubbles'),
            tabBarBadge: badges['patient/care'],
          }}
        />
        <Tabs.Screen
          name="lessons"
          options={{
            title: 'Lessons',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Lessons', badges['patient/lessons']),
            tabBarIcon: tabIcon('school-outline', 'school'),
            tabBarBadge: badges['patient/lessons'],
          }}
        />
        <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
      </Tabs>
      {/* Keeps the Care tab's unread badge live from app start (tabs mount lazily). */}
      <ChatBadgeSync />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
