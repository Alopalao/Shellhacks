import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { RoleGuard } from '@/components/navigation/RoleGuard';
import { tabIcon } from '@/components/navigation/TabIcon';
import { tabScreenOptions } from '@/components/navigation/options';
import { ConnectionBanner } from '@/components/ui';
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
  // Record the Inbox's live activity feed for the whole session, not just once a tab has mounted.
  useActivityRecorder();
  return (
    <View style={styles.flex}>
      <Tabs screenOptions={tabScreenOptions} backBehavior="history">
        <Tabs.Screen
          name="index"
          options={{ title: 'Patients', tabBarIcon: tabIcon('people-outline', 'people'), tabBarBadge: badges['doctor/index'] }}
        />
        <Tabs.Screen
          name="inbox"
          options={{ title: 'Inbox', tabBarIcon: tabIcon('file-tray-outline', 'file-tray'), tabBarBadge: badges['doctor/inbox'] }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: tabIcon('chatbubbles-outline', 'chatbubbles'),
            tabBarBadge: badges['doctor/messages'],
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'Evidence AI',
            tabBarAccessibilityLabel: 'Evidence AI for clinicians',
            tabBarIcon: tabIcon('flask-outline', 'flask'),
            tabBarBadge: badges['doctor/ai'],
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle-outline', 'person-circle'), tabBarBadge: badges['doctor/profile'] }}
        />
        <Tabs.Screen name="patients" options={{ title: 'Patient', href: null, popToTopOnBlur: true }} />
      </Tabs>
      {/* Keeps the Messages tab's unread badge live from app start (tabs mount lazily). */}
      <ChatBadgeSync />
      <ConnectionBanner />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
