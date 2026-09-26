import { Stack } from 'expo-router';
import { nestedStackOptions } from '@/components/navigation/options';

// Each screen is "singular": opening another patient (or another prescribe/note form) reuses the
// existing screen instead of stacking stale charts underneath when the doctor switches patients
// from the Patients tab, the Inbox or a notification.
const singular = (name: string) => name;

export default function DoctorPatientsLayout() {
  return (
    <Stack screenOptions={nestedStackOptions}>
      <Stack.Screen name="[id]" options={{ title: 'Patient' }} dangerouslySingular={singular} />
      <Stack.Screen name="prescribe" options={{ title: 'Prescription' }} dangerouslySingular={singular} />
      <Stack.Screen name="note" options={{ title: 'Visit note' }} dangerouslySingular={singular} />
    </Stack>
  );
}
