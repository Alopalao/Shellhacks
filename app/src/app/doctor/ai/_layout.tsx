import { Stack } from 'expo-router';
import { nestedStackOptions } from '@/components/navigation/options';

export const unstable_settings = { initialRouteName: 'index' };

/** Evidence AI tab: chat (index) + conversation history. Headerless — screens render their own headers. */
export default function DoctorAiLayout() {
  return <Stack screenOptions={nestedStackOptions} />;
}
