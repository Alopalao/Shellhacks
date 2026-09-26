import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileIdentity } from '@/components/settings/ProfileIdentity';
import { AppFooter, DemoSection, LogoutButton, ServerSection } from '@/components/settings/SettingsSections';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  Disclaimer,
  ErrorState,
  Input,
  ListItem,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
  TagInput,
  useToast,
} from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { User } from '@/lib/contracts';
import { displayName, isValidDateKey, todayKey } from '@/lib/format';
import { usePresence } from '@/lib/socket';
import { spacing } from '@/theme';

const ALLERGY_SUGGESTIONS = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Ibuprofen', 'Codeine', 'Latex', 'Peanuts', 'Shellfish'];
const CONDITION_SUGGESTIONS = [
  'Hypertension',
  'Type 2 diabetes',
  'High cholesterol',
  'Asthma',
  'COPD',
  'Heart disease',
  'Depression',
  'Anxiety',
];

export default function PatientProfileScreen() {
  const { user, setUser } = useAuth();
  if (!user) return <LoadingState />;
  return (
    <Screen header={<ScreenHeader title="Profile" subtitle="Your details, doctor and settings" back showProfile={false} />}>
      <ProfileIdentity user={user} />
      <PatientDetailsForm user={user} onSaved={setUser} />
      <DoctorPicker user={user} onChanged={setUser} />
      <ServerSection />
      <DemoSection />
      <LogoutButton />
      <Disclaimer />
      <AppFooter />
    </Screen>
  );
}

function sameList(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function PatientDetailsForm({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const toast = useToast();
  const profile = user.patient;
  const [name, setName] = useState(user.name);
  const [dob, setDob] = useState(profile?.dateOfBirth ?? '');
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies ?? []);
  const [conditions, setConditions] = useState<string[]>(profile?.conditions ?? []);
  const [pharmacy, setPharmacy] = useState(profile?.pharmacy ?? '');
  const [saving, setSaving] = useState(false);

  const dobTrim = dob.trim();
  const dobError = !dobTrim
    ? null
    : !isValidDateKey(dobTrim)
      ? 'Use the format YYYY-MM-DD, e.g. 1986-04-12.'
      : dobTrim > todayKey()
        ? 'Date of birth can’t be in the future.'
        : null;
  const nameError = name.trim() ? null : 'Your name can’t be empty.';

  const dirty =
    name.trim() !== user.name ||
    dobTrim !== (profile?.dateOfBirth ?? '') ||
    !sameList(allergies, profile?.allergies ?? []) ||
    !sameList(conditions, profile?.conditions ?? []) ||
    pharmacy.trim() !== (profile?.pharmacy ?? '');

  const save = async () => {
    if (dobError || nameError) return;
    setSaving(true);
    try {
      const updated = await api.updateMe({
        name: name.trim(),
        patient: {
          allergies,
          conditions,
          // An empty string clears the field on the server.
          dateOfBirth: dobTrim,
          pharmacy: pharmacy.trim(),
        },
      });
      onSaved(updated);
      toast.success('Profile saved', 'Your doctor and BRIAN AI will use the updated details.');
    } catch (e) {
      toast.error('Couldn’t save your profile', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Your details"
        icon="person-outline"
        subtitle="BRIAN uses your allergies and conditions to tailor answers. Your doctor sees them too."
      />
      <Input label="Full name" value={name} onChangeText={setName} autoComplete="name" error={nameError} />
      <Input
        label="Date of birth"
        value={dob}
        onChangeText={setDob}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        autoComplete="birthdate-full"
        maxLength={10}
        error={dobError}
        hint="Format: YYYY-MM-DD"
      />
      <TagInput
        label="Allergies"
        values={allergies}
        onChange={setAllergies}
        placeholder="Add an allergy (e.g. Penicillin)"
        suggestions={ALLERGY_SUGGESTIONS}
        emptyText="No known allergies"
      />
      <TagInput
        label="Conditions"
        values={conditions}
        onChange={setConditions}
        placeholder="Add a condition"
        suggestions={CONDITION_SUGGESTIONS}
        emptyText="No conditions listed"
      />
      <Input
        label="Pharmacy"
        optional
        value={pharmacy}
        onChangeText={setPharmacy}
        placeholder="e.g. CVS Pharmacy — Main St"
        leftIcon="storefront-outline"
      />
      <Button
        title={dirty ? 'Save changes' : 'Saved'}
        icon={dirty ? 'save-outline' : 'checkmark'}
        onPress={save}
        loading={saving}
        disabled={!dirty || !!dobError || !!nameError}
        fullWidth
      />
    </Card>
  );
}

function DoctorPicker({ user, onChanged }: { user: User; onChanged: (u: User) => void }) {
  const toast = useToast();
  const { data: doctors, loading, error, reload } = useApiQuery(() => api.doctors(), []);
  const [choosing, setChoosing] = useState<string | null>(null);

  const choose = async (doctor: User) => {
    if (choosing || doctor.id === user.doctorId) return;
    setChoosing(doctor.id);
    try {
      const updated = await api.chooseDoctor(doctor.id);
      onChanged(updated);
      toast.success(`${displayName(doctor)} is now your doctor`, 'Your messages and records are shared with them.');
    } catch (e) {
      toast.error('Couldn’t change your doctor', errorMessage(e));
    } finally {
      setChoosing(null);
    }
  };

  return (
    <Card style={styles.card}>
      <SectionHeader title="Your doctor" icon="medkit-outline" subtitle="Choose the physician who manages your care." />
      {loading ? (
        <LoadingState label="Loading doctors…" fill={false} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} compact />
      ) : !doctors?.length ? (
        <AppText tone="muted">No doctors are registered on this server yet.</AppText>
      ) : (
        <View>
          {doctors.map((d) => (
            <DoctorOption
              key={d.id}
              doctor={d}
              selected={d.id === user.doctorId}
              busy={choosing === d.id}
              disabled={!!choosing}
              onChoose={() => void choose(d)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

function DoctorOption({
  doctor,
  selected,
  busy,
  disabled,
  onChoose,
}: {
  doctor: User;
  selected: boolean;
  busy: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const online = usePresence(doctor.id);
  const subtitle = [doctor.doctor?.specialty, doctor.doctor?.clinic].filter(Boolean).join(' · ');
  return (
    <ListItem
      title={displayName(doctor)}
      subtitle={subtitle || undefined}
      left={<Avatar user={doctor} size={44} online={online} />}
      chevron={false}
      accessibilityLabel={`${displayName(doctor)}${subtitle ? `, ${subtitle}` : ''}${selected ? ', your current doctor' : ''}`}
      right={
        selected ? (
          <Badge label="Your doctor" tone="yellow" icon="checkmark" size="md" />
        ) : (
          <Button
            title="Choose"
            size="sm"
            variant="outline"
            loading={busy}
            disabled={disabled}
            onPress={onChoose}
            accessibilityLabel={`Choose ${displayName(doctor)} as your doctor`}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
});
