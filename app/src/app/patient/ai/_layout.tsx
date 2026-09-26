import { Stack } from 'expo-router';
import { nestedStackOptions } from '@/components/navigation/options';

export const unstable_settings = { initialRouteName: 'index' };

/** BRIAN AI tab: chat (index) + conversation history. Headerless — screens render their own headers. */
export default function PatientAiLayout() {
  return <Stack screenOptions={nestedStackOptions} />;
}
