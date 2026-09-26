import { Stack } from 'expo-router';
import { nestedStackOptions } from '@/components/navigation/options';

export const unstable_settings = { initialRouteName: 'index' };

/** Messages tab: thread list → real-time conversation. */
export default function DoctorMessagesLayout() {
  return (
    <Stack screenOptions={nestedStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Messages' }} />
      <Stack.Screen name="[threadId]" options={{ title: 'Conversation' }} />
    </Stack>
  );
}
