import { Stack } from 'expo-router';
import { nestedStackOptions } from '@/components/navigation/options';

export const unstable_settings = { initialRouteName: 'index' };

/** Care tab: physician + visit notes → chat with the doctor, note detail. */
export default function CareLayout() {
  return (
    <Stack screenOptions={nestedStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Care' }} />
      <Stack.Screen name="chat" options={{ title: 'Messages' }} />
      <Stack.Screen name="notes/[id]" options={{ title: 'Visit note' }} />
    </Stack>
  );
}
