// Add a self-reported OTC medicine or supplement (POST /api/prescriptions with the patient's own id).
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Disclaimer, LoadingState, Screen, ScreenHeader, useToast } from '@/components/ui';
import { medLabel, MedForm, type MedFormValues } from '@/features/meds';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { todayKey } from '@/lib/format';
import { colors, spacing } from '@/theme';

const BACK = '/patient/meds';

export default function AddMedScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const header = <ScreenHeader title="Add a medicine" subtitle="Over-the-counter medicines and supplements" back={BACK} />;

  if (!user) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  const submit = async (values: MedFormValues) => {
    try {
      // Start today in the patient's local calendar (the server's date may differ).
      const rx = await api.createPrescription({ ...values, patientId: user.id, startDate: todayKey() });
      toast.success(`${medLabel(rx)} added`, 'It’s on your medication list. Your doctor can see it too.');
      if (router.canGoBack()) router.back();
      else router.replace(BACK);
    } catch (e) {
      toast.error('Couldn’t add it', errorMessage(e));
    }
  };

  return (
    <Screen header={header}>
      <Card variant="yellow" style={styles.intro}>
        <Ionicons name="leaf-outline" size={22} color={colors.text} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Keep your list complete</AppText>
          <AppText variant="small" tone="muted">
            Add vitamins, supplements and pharmacy medicines you take on your own. Prescriptions from your doctor
            show up automatically.
          </AppText>
        </View>
      </Card>
      <MedForm submitLabel="Add to my list" submitIcon="add" onSubmit={submit} />
      <Disclaimer text="Some supplements and OTC medicines interact with prescriptions. Ask your pharmacist or doctor before starting something new." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  flex: { flex: 1 },
});
