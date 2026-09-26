import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { RoleGuard } from '@/components/navigation/RoleGuard';
import { tabIcon } from '@/components/navigation/TabIcon';
import { tabScreenOptions } from '@/components/navigation/options';
import { ConnectionBanner } from '@/components/ui';
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
  return (
    <View style={styles.flex}>
      <Tabs screenOptions={tabScreenOptions} backBehavior="history">
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: tabIcon('home-outline', 'home'), tabBarBadge: badges['patient/index'] }}
        />
        <Tabs.Screen
          name="meds"
          options={{ title: 'Meds', tabBarIcon: tabIcon('medkit-outline', 'medkit'), tabBarBadge: badges['patient/meds'] }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'BRIAN AI',
            tabBarAccessibilityLabel: 'BRIAN AI doctor',
            tabBarIcon: tabIcon('sparkles-outline', 'sparkles'),
            tabBarBadge: badges['patient/ai'],
          }}
        />
        <Tabs.Screen
          name="care"
          options={{
            title: 'Care',
            tabBarAccessibilityLabel: 'Care: your doctor, messages and visit notes',
            tabBarIcon: tabIcon('chatbubbles-outline', 'chatbubbles'),
            tabBarBadge: badges['patient/care'],
          }}
        />
        <Tabs.Screen
          name="lessons"
          options={{ title: 'Lessons', tabBarIcon: tabIcon('school-outline', 'school'), tabBarBadge: badges['patient/lessons'] }}
        />
        <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
      </Tabs>
      {/* Keeps the Care tab's unread badge live from app start (tabs mount lazily). */}
      <ChatBadgeSync />
      <ConnectionBanner />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
