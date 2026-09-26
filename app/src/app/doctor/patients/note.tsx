// Visit-note composer: `/doctor/patients/note?patientId=…`. Notes are shared with the patient live.
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Chip,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  TextArea,
  useConfirm,
  useToast,
} from '@/components/ui';
import { doctorHrefs, goBackOr, NOTE_TEMPLATES, paramValue, type NoteTemplate } from '@/features/doctor';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api, errorMessage, isApiRequestError } from '@/lib/api';
import type { User } from '@/lib/contracts';
import { firstName } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

const TITLE_MAX = 200;
const BODY_MAX = 20_000;

const withCommas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function NewNoteScreen() {
  const params = useLocalSearchParams<{ patientId?: string | string[] }>();
  const patientId = paramValue(params.patientId);
  if (!patientId) {
    return (
      <Screen header={<ScreenHeader title="New visit note" back={doctorHrefs.patients} />}>
        <ErrorState title="No patient selected" message="Open a patient's chart and tap Write note." />
      </Screen>
    );
  }
  return <NoteLoader key={patientId} patientId={patientId} />;
}

function NoteLoader({ patientId }: { patientId: string }) {
  // The chart endpoint confirms access and gives us the patient's name.
  const q = useApiQuery(() => api.patient(patientId), [patientId], { refetchOnFocus: false });
  const back = doctorHrefs.patient(patientId);
  if (q.loading) {
    return (
      <Screen header={<ScreenHeader title="New visit note" back={back} />} scroll={false}>
        <LoadingState label="Loading patient…" />
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen header={<ScreenHeader title="New visit note" back={back} />} refreshing={q.refreshing} onRefresh={q.refresh}>
        <ErrorState error={q.error} onRetry={q.refresh} />
      </Screen>
    );
  }
  return <NoteComposer patient={q.data.patient} />;
}

function NoteComposer({ patient }: { patient: User }) {
  const toast = useToast();
  const confirm = useConfirm();
  const first = firstName(patient.name) || patient.name;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleError = attempted && !title.trim() ? 'Add a short title, e.g. "Follow-up visit".' : null;
  const bodyError = attempted && !body.trim() ? 'Write the note before sending.' : null;

  const applyTemplate = async (t: NoteTemplate) => {
    const hasContent = body.trim().length > 0 && body !== NOTE_TEMPLATES.find((x) => x.id === templateId)?.body;
    if (hasContent) {
      const ok = await confirm({
        title: `Use the “${t.label}” template?`,
        message: 'This replaces what you have written so far.',
        confirmLabel: 'Replace',
      });
      if (!ok) return;
    }
    setTemplateId(t.id);
    setBody(t.body);
    if (!title.trim() || NOTE_TEMPLATES.some((x) => x.title === title)) setTitle(t.title);
    setFormError(null);
  };

  const submit = async () => {
    setAttempted(true);
    if (!title.trim() || !body.trim()) {
      setFormError('Add a title and the note text.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createNote({ patientId: patient.id, title: title.trim(), body: body.trim() });
      toast.success('Note shared', `${first} can read it now in BRIAN.`);
      goBackOr(doctorHrefs.patient(patient.id));
    } catch (e) {
      setFormError(
        isApiRequestError(e) && e.status === 400 ? errorMessage(e, 'Check the title and note text.') : errorMessage(e),
      );
      setSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footer}>
      {formError ? (
        <AppText variant="small" tone="danger" align="center" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {formError}
        </AppText>
      ) : null}
      <Button
        title={`Share with ${first}`}
        icon="paper-plane-outline"
        size="lg"
        fullWidth
        loading={submitting}
        onPress={submit}
        accessibilityHint={`${first} is notified right away`}
      />
    </View>
  );

  return (
    <Screen
      header={<ScreenHeader title="New visit note" subtitle={`For ${patient.name}`} back={doctorHrefs.patient(patient.id)} />}
      footer={footer}
    >
      <View style={styles.gapSm}>
        <AppText variant="label">Quick templates</AppText>
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Note templates">
          {NOTE_TEMPLATES.map((t) => (
            <Chip
              key={t.id}
              label={t.label}
              icon={t.icon}
              selected={templateId === t.id}
              onPress={() => void applyTemplate(t)}
              accessibilityLabel={`Use the ${t.label} template`}
            />
          ))}
        </View>
      </View>

      <Input
        label="Title"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          if (formError) setFormError(null);
        }}
        placeholder="e.g. Follow-up: blood pressure"
        maxLength={TITLE_MAX}
        error={titleError}
      />
      <TextArea
        label="Note"
        value={body}
        onChangeText={(t) => {
          setBody(t);
          if (formError) setFormError(null);
        }}
        placeholder="Write as you normally would — clinical shorthand is fine."
        minHeight={240}
        maxLength={BODY_MAX}
        error={bodyError}
        hint={`${withCommas(body.length)} / ${withCommas(BODY_MAX)} characters`}
        autoCorrect
      />

      <View style={styles.hint} accessible accessibilityLabel={`Tip: Your patient can tap "Explain with BRIAN" to get a plain-language explanation.`}>
        <View style={styles.hintIcon}>
          <Ionicons name="sparkles" size={16} color={colors.black} />
        </View>
        <AppText variant="small" style={styles.flex}>
          Your patient can tap <AppText variant="small" weight="bold">"Explain with BRIAN"</AppText> to get a
          plain-language explanation.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gapSm: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLight,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  hintIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
