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
import { useDraft } from '@/hooks/useDraft';
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

interface DoctorDraft {
  name: string;
  specialty: string;
  credentials: string;
  clinic: string;
  bio: string;
}

function doctorDraft(user: User): DoctorDraft {
  const d = user.doctor;
  return {
    name: user.name,
    specialty: d?.specialty ?? '',
    credentials: d?.credentials ?? '',
    clinic: d?.clinic ?? '',
    bio: d?.bio ?? '',
  };
}

/** Equal as far as saving goes (every field is trimmed on save). */
function sameDoctorDraft(a: DoctorDraft, b: DoctorDraft) {
  return (Object.keys(a) as (keyof DoctorDraft)[]).every((k) => a[k].trim() === b[k].trim());
}

function DoctorDetailsForm({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const toast = useToast();
  // Follows the saved profile (e.g. after "Reset demo data") unless there are unsaved edits.
  const [draft, setDraft] = useDraft(doctorDraft(user), sameDoctorDraft);
  const { name, specialty, credentials, clinic, bio } = draft;
  const edit = (key: keyof DoctorDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const [saving, setSaving] = useState(false);

  const nameError = name.trim() ? null : 'Your name can’t be empty.';
  const specialtyError = specialty.trim() ? null : 'Add a specialty (e.g. Internal Medicine).';
  const credentialsError = credentials.trim() ? null : 'Add your credentials (e.g. MD).';
  const invalid = !!(nameError || specialtyError || credentialsError);
  const dirty = !sameDoctorDraft(draft, doctorDraft(user));

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
      // Show exactly what the server stored (unless the user kept typing while it saved).
      setDraft((d) => (sameDoctorDraft(d, draft) ? doctorDraft(updated) : d));
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
      <Input label="Full name" value={name} onChangeText={edit('name')} autoComplete="name" error={nameError} />
      <Input
        label="Specialty"
        value={specialty}
        onChangeText={edit('specialty')}
        placeholder="Internal Medicine"
        error={specialtyError}
      />
      <Input
        label="Credentials"
        value={credentials}
        onChangeText={edit('credentials')}
        placeholder="MD"
        autoCapitalize="characters"
        error={credentialsError}
      />
      <Input
        label="Clinic"
        optional
        value={clinic}
        onChangeText={edit('clinic')}
        placeholder="BRIAN Health Clinic"
        leftIcon="business-outline"
      />
      <TextArea
        label="Bio"
        optional
        value={bio}
        onChangeText={edit('bio')}
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
