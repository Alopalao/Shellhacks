// Create or edit a prescription: `/doctor/patients/prescribe?patientId=…[&rxId=…]`.
// Drug look-up (FDA label summary), allergy-aware warning, presets for form/route/frequency.
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  Chip,
  Disclaimer,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  TextArea,
  useToast,
} from '@/components/ui';
import {
  AllergyWarning,
  ChipGroup,
  CUSTOM_FREQUENCY,
  DEFAULT_ROUTE_FOR_FORM,
  doctorHrefs,
  DOSAGE_FORMS,
  DOSE_EXAMPLE_FOR_FORM,
  DrugLookupPanel,
  findAllergyAlerts,
  FREQUENCY_PRESETS,
  goBackOr,
  initialFormValues,
  isPatientUnavailable,
  MAX_REFILLS,
  medLabel,
  paramValue,
  PatientUnavailable,
  ROUTES,
  serverFieldErrors,
  Stepper,
  TagList,
  TimeChipsEditor,
  toPrescriptionInput,
  validatePrescription,
  type ChipOption,
  type DrugLookupState,
  type PrescriptionErrors,
  type PrescriptionField,
  type PrescriptionFormValues,
} from '@/features/doctor';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api, errorMessage, isApiRequestError } from '@/lib/api';
import type { PatientDetail, Prescription } from '@/lib/contracts';
import { addDays, firstName, formatDate, pluralize, todayKey } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';
import { colors, spacing } from '@/theme';

export default function PrescribeScreen() {
  const params = useLocalSearchParams<{ patientId?: string | string[]; rxId?: string | string[] }>();
  const patientId = paramValue(params.patientId);
  const rxId = paramValue(params.rxId);
  if (!patientId) {
    return (
      <Screen header={<ScreenHeader title="Prescription" back={doctorHrefs.patients} />}>
        <ErrorState title="No patient selected" message="Open a patient's chart and tap Prescribe." />
      </Screen>
    );
  }
  return <PrescribeLoader key={`${patientId}:${rxId ?? 'new'}`} patientId={patientId} rxId={rxId} />;
}

function PrescribeLoader({ patientId, rxId }: { patientId: string; rxId?: string }) {
  const q = useApiQuery(() => api.patient(patientId), [patientId]);
  const back = doctorHrefs.patient(patientId);

  // Keep allergies current while the form is open.
  useSocketEvent('user:updated', (u) => {
    if (u.id === patientId) q.setData((d) => (d ? { ...d, patient: u } : d));
  });

  if (q.loading) {
    return (
      <Screen header={<ScreenHeader title={rxId ? 'Edit prescription' : 'New prescription'} back={back} />} scroll={false}>
        <LoadingState label="Loading patient…" />
      </Screen>
    );
  }
  if (!q.data && isPatientUnavailable(q.error)) {
    return (
      <Screen header={<ScreenHeader title="Prescription" back={doctorHrefs.patients} />}>
        <PatientUnavailable error={q.error} />
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen header={<ScreenHeader title="Prescription" back={back} />} refreshing={q.refreshing} onRefresh={q.refresh}>
        <ErrorState error={q.error} onRetry={q.refresh} />
      </Screen>
    );
  }
  const rx = rxId ? q.data.prescriptions.find((p) => p.id === rxId) : undefined;
  if (rxId && !rx) {
    return (
      <Screen header={<ScreenHeader title="Edit prescription" back={back} />}>
        <ErrorState title="Prescription not found" message="It may have been removed. Go back to the chart and try again." />
      </Screen>
    );
  }
  return <PrescribeForm detail={q.data} rx={rx ?? null} />;
}

// ───────────────────────── Form ─────────────────────────

const FORM_LABELS: Record<string, string> = {
  tablet: 'Tablet',
  capsule: 'Capsule',
  liquid: 'Liquid',
  inhaler: 'Inhaler',
  injection: 'Injection',
  cream: 'Cream',
  drops: 'Drops',
};

const capitalize = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

function withCurrent(options: readonly string[], current: string, labels?: Record<string, string>): ChipOption[] {
  const list = options.map((value) => ({ value, label: labels?.[value] ?? capitalize(value) }));
  const c = current.trim();
  if (c && !options.includes(c)) list.push({ value: c, label: capitalize(c) });
  return list;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function PrescribeForm({ detail, rx }: { detail: PatientDetail; rx: Prescription | null }) {
  const toast = useToast();
  const { patient } = detail;
  const first = firstName(patient.name) || patient.name;
  const allergies = patient.patient?.allergies ?? [];
  const isEdit = !!rx;

  const [values, setValues] = useState<PrescriptionFormValues>(() => initialFormValues(rx));
  const [routeTouched, setRouteTouched] = useState(isEdit);
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<PrescriptionErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lookup, setLookup] = useState<DrugLookupState>({ status: 'idle' });
  // Editing an existing prescription the prescriber already reviewed: start acknowledged for the
  // same drug (a new name or label match produces a different key and asks again).
  const [ackKey, setAckKey] = useState<string | null>(() =>
    rx ? findAllergyAlerts([rx.drugName], allergies).map((a) => a.message).join('|') || null : null,
  );
  const lookupSeq = useRef(0);

  const clientErrors = attempted ? validatePrescription(values) : {};
  const errorFor = (field: PrescriptionField): string | undefined => clientErrors[field] ?? serverErrors[field];

  const update = (patch: Partial<PrescriptionFormValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    const touched = Object.keys(patch) as PrescriptionField[];
    if (touched.some((k) => serverErrors[k])) {
      setServerErrors((e) => {
        const next = { ...e };
        touched.forEach((k) => delete next[k]);
        return next;
      });
    }
    if (formError) setFormError(null);
  };

  // ── Drug look-up ──
  const lookupMatches = lookup.status !== 'idle' && sameName(lookup.query, values.drugName);
  const runLookup = async () => {
    const name = values.drugName.trim();
    if (!name) {
      setServerErrors((e) => ({ ...e, drugName: 'Type a medication name to look it up.' }));
      return;
    }
    const seq = ++lookupSeq.current;
    setLookup({ status: 'loading', query: name });
    try {
      const info = await api.drugInfo(name);
      if (seq === lookupSeq.current) setLookup({ status: 'done', query: name, info });
    } catch (error) {
      if (seq === lookupSeq.current) setLookup({ status: 'error', query: name, error });
    }
  };

  // ── Allergy check (typed name + label generic/brand names when looked up) ──
  const labelNames =
    lookup.status === 'done' && lookupMatches
      ? [lookup.info.name, lookup.info.genericName ?? '', ...lookup.info.brandNames]
      : [];
  const alerts = findAllergyAlerts([values.drugName, ...labelNames], allergies);
  const alertsKey = alerts.map((a) => a.message).join('|');
  const acknowledged = alerts.length > 0 && ackKey === alertsKey;
  const needsAck = alerts.length > 0 && !acknowledged;

  // ── Submit ──
  const submit = async () => {
    setAttempted(true);
    const errs = validatePrescription(values);
    const count = Object.keys(errs).length + (needsAck ? 1 : 0);
    if (count > 0) {
      setFormError(
        needsAck && count === 1
          ? 'Review the allergy alert before sending.'
          : `${pluralize(count, 'field')} ${count === 1 ? 'needs' : 'need'} attention.`,
      );
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const input = toPrescriptionInput(values);
      const saved = rx
        ? await api.updatePrescription(rx.id, input)
        : await api.createPrescription({ ...input, patientId: patient.id });
      toast.success(
        isEdit ? 'Prescription updated' : 'Prescription sent',
        `${medLabel(saved)} for ${first} — it's on their phone now.`,
      );
      goBackOr(doctorHrefs.patient(patient.id));
    } catch (e) {
      setServerErrors(isApiRequestError(e) ? serverFieldErrors(e.details) : {});
      setFormError(errorMessage(e));
      setSubmitting(false);
    }
  };

  const today = todayKey();
  const isPrn = values.frequencyPreset === 'prn';
  const frequencyOptions: ChipOption[] = [
    ...FREQUENCY_PRESETS.map((p) => ({ value: p.id, label: p.label })),
    { value: CUSTOM_FREQUENCY, label: 'Custom', icon: 'create-outline' },
  ];

  const footer = (
    <View style={styles.footer}>
      {formError ? (
        <AppText variant="small" tone="danger" align="center" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {formError}
        </AppText>
      ) : null}
      <Button
        title={isEdit ? 'Save changes' : 'Send prescription'}
        icon={isEdit ? 'checkmark' : 'paper-plane-outline'}
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
      header={
        <ScreenHeader
          title={isEdit ? `Edit ${rx.drugName}` : 'New prescription'}
          subtitle={`For ${patient.name}`}
          back={doctorHrefs.patient(patient.id)}
        />
      }
      footer={footer}
    >
      <Card variant="yellow" padding="md" style={styles.gapSm}>
        <AppText variant="label">{first}'s allergies</AppText>
        <TagList items={allergies} variant="allergy" size="sm" emptyText="No known allergies recorded" />
      </Card>

      {rx?.status === 'discontinued' ? (
        <Card variant="muted" padding="md">
          <AppText variant="small">This prescription is discontinued. Saving updates the record only; it stays discontinued.</AppText>
        </Card>
      ) : null}

      {/* Medication */}
      <Card style={styles.section}>
        <AppText variant="title3">Medication</AppText>
        <Input
          label="Drug name"
          value={values.drugName}
          onChangeText={(t) => update({ drugName: t })}
          placeholder="e.g. Amlodipine"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => void runLookup()}
          error={errorFor('drugName')}
          maxLength={120}
          right={
            <Button
              title="Look up"
              icon="search"
              size="sm"
              variant="secondary"
              onPress={() => void runLookup()}
              loading={lookup.status === 'loading' && lookupMatches}
              disabled={!values.drugName.trim()}
              accessibilityLabel="Look up this drug in FDA labeling"
            />
          }
        />
        {lookupMatches ? (
          <DrugLookupPanel
            state={lookup}
            currentName={values.drugName}
            onRetry={() => void runLookup()}
            onUseName={(name) => {
              update({ drugName: name });
              setLookup((l) => (l.status === 'done' ? { ...l, query: name } : l));
            }}
          />
        ) : null}

        <AllergyWarning
          alerts={alerts}
          patientFirstName={first}
          acknowledged={acknowledged}
          onAcknowledge={(v) => setAckKey(v ? alertsKey : null)}
          error={attempted && needsAck ? 'Confirm you have reviewed the allergy to continue.' : null}
        />

        <Input
          label="Strength"
          value={values.strength}
          onChangeText={(t) => update({ strength: t })}
          placeholder="e.g. 10 mg"
          autoCorrect={false}
          error={errorFor('strength')}
          maxLength={80}
        />
        <ChipGroup
          label="Form"
          options={withCurrent(DOSAGE_FORMS, values.form, FORM_LABELS)}
          value={values.form}
          onChange={(form) =>
            update({ form, route: routeTouched ? values.route : (DEFAULT_ROUTE_FOR_FORM[form] ?? values.route) })
          }
          error={errorFor('form')}
        />
      </Card>

      {/* Directions */}
      <Card style={styles.section}>
        <AppText variant="title3">Directions</AppText>
        <Input
          label="Dose"
          value={values.dose}
          onChangeText={(t) => update({ dose: t })}
          placeholder={`e.g. ${DOSE_EXAMPLE_FOR_FORM[values.form] ?? '1 tablet'}`}
          error={errorFor('dose')}
          maxLength={120}
        />
        <ChipGroup
          label="Route"
          options={withCurrent(ROUTES, values.route)}
          value={values.route}
          onChange={(route) => {
            setRouteTouched(true);
            update({ route });
          }}
          error={errorFor('route')}
        />
        <ChipGroup
          label="How often"
          options={frequencyOptions}
          value={values.frequencyPreset}
          onChange={(id) => {
            const preset = FREQUENCY_PRESETS.find((p) => p.id === id);
            update(preset ? { frequencyPreset: id, times: [...preset.times] } : { frequencyPreset: CUSTOM_FREQUENCY });
          }}
          error={values.frequencyPreset === CUSTOM_FREQUENCY ? undefined : errorFor('frequencyPreset')}
        />
        {values.frequencyPreset === CUSTOM_FREQUENCY ? (
          <Input
            label="Frequency (as the patient will see it)"
            value={values.customFrequency}
            onChangeText={(t) => update({ customFrequency: t })}
            placeholder="e.g. twice daily with meals"
            error={errorFor('frequencyPreset')}
            maxLength={120}
          />
        ) : null}
        {!isPrn ? (
          <TimeChipsEditor times={values.times} onChange={(times) => update({ times })} error={errorFor('times')} />
        ) : (
          <AppText variant="small" tone="muted">
            As-needed medications don't get dose reminders or count toward adherence.
          </AppText>
        )}
        <TextArea
          label="Instructions"
          optional
          value={values.instructions}
          onChangeText={(t) => update({ instructions: t })}
          placeholder="e.g. Take in the morning with water. Rise slowly if dizzy."
          minHeight={88}
          maxLength={2000}
          error={errorFor('instructions')}
        />
        <Input
          label="Purpose"
          optional
          value={values.purpose}
          onChangeText={(t) => update({ purpose: t })}
          placeholder="e.g. Blood pressure"
          hint="Shown to the patient in plain words."
          error={errorFor('purpose')}
          maxLength={200}
        />
      </Card>

      {/* Supply */}
      <Card style={styles.section}>
        <AppText variant="title3">Supply</AppText>
        <Input
          label="Quantity"
          optional
          value={values.quantity}
          onChangeText={(t) => update({ quantity: t.replace(/[^\d]/g, '') })}
          placeholder="e.g. 30"
          keyboardType="number-pad"
          inputMode="numeric"
          error={errorFor('quantity')}
          maxLength={5}
        />
        <Stepper
          label="Refills"
          value={values.refills}
          min={0}
          max={Math.max(MAX_REFILLS, rx?.refillsRemaining ?? 0)}
          onChange={(refills) => update({ refills })}
          format={(n) => (n === 0 ? 'No refills' : pluralize(n, 'refill'))}
          hint={errorFor('refills')}
        />
        <View style={styles.gapSm}>
          <Input
            label="Start date"
            value={values.startDate}
            onChangeText={(t) => update({ startDate: t.trim() })}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            error={errorFor('startDate')}
            hint={formatDate(values.startDate, { weekday: true, long: true }) || undefined}
          />
          <View style={styles.chips}>
            <Chip label="Today" selected={values.startDate === today} onPress={() => update({ startDate: today })} />
            <Chip
              label="Tomorrow"
              selected={values.startDate === addDays(today, 1)}
              onPress={() => update({ startDate: addDays(today, 1) })}
            />
          </View>
        </View>
      </Card>

      <Disclaimer text="Label summaries and allergy checks are aids, not a substitute for clinical judgment or a full interaction check." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  gapSm: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
