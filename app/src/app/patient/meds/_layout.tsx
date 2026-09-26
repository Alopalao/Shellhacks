// Meds tab stack: list → detail (/patient/meds/[id]) and add (/patient/meds/add). Screens render ScreenHeader.
import { Stack } from 'expo-router';
import { nestedStackOptions } from '@/components/navigation/options';

export const unstable_settings = { initialRouteName: 'index' };

export default function MedsLayout() {
  return <Stack screenOptions={nestedStackOptions} />;
}
