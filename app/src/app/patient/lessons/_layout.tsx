// Lessons tab stack: Learn home → topic → lesson reader. Headerless; screens render ScreenHeader.
import { Stack } from 'expo-router';
import { nestedStackOptions } from '@/components/navigation/options';

export const unstable_settings = { initialRouteName: 'index' };

export default function LessonsLayout() {
  return (
    <Stack screenOptions={nestedStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Learn' }} />
      <Stack.Screen name="category/[categoryId]" options={{ title: 'Topic' }} />
      <Stack.Screen name="[id]" options={{ title: 'Lesson' }} />
    </Stack>
  );
}
