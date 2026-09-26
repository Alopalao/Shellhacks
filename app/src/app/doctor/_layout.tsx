import { usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { activeTabOptions, renderAppTabBar } from '@/components/navigation/AppTabBar';
import { RoleGuard } from '@/components/navigation/RoleGuard';
import { tabIcon } from '@/components/navigation/TabIcon';
import { tabAccessibilityLabel, useTabScreenOptions } from '@/components/navigation/options';
import { ChatBadgeSync } from '@/features/chat';
import { useActivityRecorder } from '@/features/doctor';
import { useTabBadges } from '@/lib/tab-badges';

export default function DoctorLayout() {
  return (
    <RoleGuard role="doctor">
      <DoctorTabs />
    </RoleGuard>
  );
}

function DoctorTabs() {
  const badges = useTabBadges();
  const screenOptions = useTabScreenOptions();
  // A patient's chart, prescribe and note screens live in the hidden `patients` tab; keep
  // "Patients" highlighted there so the doctor doesn't lose their place.
  const onPatientRoute = usePathname().startsWith('/doctor/patients');
  // Keep the Inbox live for the whole session (activity feed + Inbox tab badge), not just once a tab has mounted.
  useActivityRecorder();
  return (
    <View style={styles.flex}>
      {/* The tab bar carries the "Reconnecting…" banner above it (renderAppTabBar). */}
      <Tabs screenOptions={screenOptions} tabBar={renderAppTabBar} backBehavior="history">
        <Tabs.Screen
          name="index"
          options={{
            title: 'Patients',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Patients', badges['doctor/index']),
            tabBarIcon: tabIcon('people-outline', 'people'),
            tabBarBadge: badges['doctor/index'],
            ...(onPatientRoute ? activeTabOptions('people-outline', 'people') : null),
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: 'Inbox',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Inbox', badges['doctor/inbox'], { noun: 'pending' }),
            tabBarIcon: tabIcon('file-tray-outline', 'file-tray'),
            tabBarBadge: badges['doctor/inbox'],
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Messages', badges['doctor/messages'], { noun: 'unread' }),
            tabBarIcon: tabIcon('chatbubbles-outline', 'chatbubbles'),
            tabBarBadge: badges['doctor/messages'],
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'Evidence AI',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Evidence AI', badges['doctor/ai'], {
              label: 'Evidence AI for clinicians',
              noun: 'new answer',
            }),
            tabBarIcon: tabIcon('flask-outline', 'flask'),
            tabBarBadge: badges['doctor/ai'],
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarAccessibilityLabel: tabAccessibilityLabel('Profile', badges['doctor/profile']),
            tabBarIcon: tabIcon('person-circle-outline', 'person-circle'),
            tabBarBadge: badges['doctor/profile'],
          }}
        />
        <Tabs.Screen name="patients" options={{ title: 'Patient', href: null, popToTopOnBlur: true }} />
      </Tabs>
      {/* Keeps the Messages tab's unread badge live from app start (tabs mount lazily). */}
      <ChatBadgeSync />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
