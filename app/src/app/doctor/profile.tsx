import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { ProfileIdentity } from '@/components/settings/ProfileIdentity';
import { AppFooter, DemoSection, LogoutButton, ServerSection } from '@/components/settings/SettingsSections';
import {
  Button,
  Card,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
  TextArea,
  useToast,
} from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { User } from '@/lib/contracts';
import { spacing } from '@/theme';

export default function DoctorProfileScreen() {
  const { user, setUser } = useAuth();
  if (!user) return <LoadingState />;
  return (
    <Screen header={<ScreenHeader title="Profile" subtitle="Your practice details and settings" showProfile={false} />}>
      <ProfileIdentity user={user} />
      <DoctorDetailsForm user={user} onSaved={setUser} />
      <ServerSection />
      <DemoSection />
      <LogoutButton />
      <AppFooter />
    </Screen>
  );
}

function DoctorDetailsForm({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const toast = useToast();
  const d = user.doctor;
  const [name, setName] = useState(user.name);
  const [specialty, setSpecialty] = useState(d?.specialty ?? '');
  const [credentials, setCredentials] = useState(d?.credentials ?? '');
  const [clinic, setClinic] = useState(d?.clinic ?? '');
  const [bio, setBio] = useState(d?.bio ?? '');
  const [saving, setSaving] = useState(false);

  const nameError = name.trim() ? null : 'Your name can’t be empty.';
  const specialtyError = specialty.trim() ? null : 'Add a specialty (e.g. Internal Medicine).';
  const credentialsError = credentials.trim() ? null : 'Add your credentials (e.g. MD).';
  const invalid = !!(nameError || specialtyError || credentialsError);
  const dirty =
    name.trim() !== user.name ||
    specialty.trim() !== (d?.specialty ?? '') ||
    credentials.trim() !== (d?.credentials ?? '') ||
    clinic.trim() !== (d?.clinic ?? '') ||
    bio.trim() !== (d?.bio ?? '');

  const save = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      const updated = await api.updateMe({
        name: name.trim(),
        doctor: {
          specialty: specialty.trim(),
          credentials: credentials.trim(),
          // An empty string clears the field on the server.
          clinic: clinic.trim(),
          bio: bio.trim(),
        },
      });
      onSaved(updated);
      toast.success('Profile saved', 'Your patients will see the update.');
    } catch (e) {
      toast.error('Couldn’t save your profile', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <SectionHeader title="Practice details" icon="briefcase-outline" subtitle="Shown to your patients in BRIAN." />
      <Input label="Full name" value={name} onChangeText={setName} autoComplete="name" error={nameError} />
      <Input
        label="Specialty"
        value={specialty}
        onChangeText={setSpecialty}
        placeholder="Internal Medicine"
        error={specialtyError}
      />
      <Input
        label="Credentials"
        value={credentials}
        onChangeText={setCredentials}
        placeholder="MD"
        autoCapitalize="characters"
        error={credentialsError}
      />
      <Input
        label="Clinic"
        optional
        value={clinic}
        onChangeText={setClinic}
        placeholder="BRIAN Health Clinic"
        leftIcon="business-outline"
      />
      <TextArea
        label="Bio"
        optional
        value={bio}
        onChangeText={setBio}
        placeholder="A short introduction for your patients."
        maxLength={600}
        minHeight={110}
      />
      <Button
        title={dirty ? 'Save changes' : 'Saved'}
        icon={dirty ? 'save-outline' : 'checkmark'}
        onPress={save}
        loading={saving}
        disabled={!dirty || invalid}
        fullWidth
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
});
