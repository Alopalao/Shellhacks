import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Chip, Input, TextArea, type IoniconName } from '@/components/ui';
import type { Prescription, PrescriptionInput } from '@/lib/contracts';
import { colors, radius, spacing } from '@/theme';
import {
  FORM_OPTIONS,
  FREQUENCY_PRESETS,
  formOption,
  frequencyFor,
  frequencyPreset,
  presetForPrescription,
  type FrequencyPresetId,
} from '../format';
import { TimeChipsEditor } from './TimeChipsEditor';

/** The fields a patient can set on a self-reported medicine. */
export type MedFormValues = Pick<
  PrescriptionInput,
  'drugName' | 'strength' | 'form' | 'dose' | 'route' | 'frequency' | 'times' | 'instructions' | 'purpose'
>;

export interface MedFormProps {
  /** Existing medicine (edit mode). */
  initial?: Prescription;
  submitLabel: string;
  submitIcon?: IoniconName;
  /** Save the values. The parent reports errors (toast) and navigates; the form keeps its values. */
  onSubmit: (values: MedFormValues) => Promise<void>;
  onCancel?: () => void;
}

interface Suggestion {
  name: string;
  strength: string;
  form: string;
  preset: FrequencyPresetId;
  purpose: string;
}

/** Common over-the-counter items: tapping one pre-fills the usual label strength. */
const SUGGESTIONS: readonly Suggestion[] = [
  { name: 'Vitamin D3', strength: '1,000 IU', form: 'softgel', preset: 'once', purpose: 'Supplement' },
  { name: 'Multivitamin', strength: '', form: 'tablet', preset: 'once', purpose: 'Supplement' },
  { name: 'Fish oil (omega-3)', strength: '1,000 mg', form: 'softgel', preset: 'once', purpose: 'Supplement' },
  { name: 'Magnesium', strength: '250 mg', form: 'tablet', preset: 'once', purpose: 'Supplement' },
  { name: 'Melatonin', strength: '3 mg', form: 'tablet', preset: 'bedtime', purpose: 'Sleep' },
  { name: 'Loratadine', strength: '10 mg', form: 'tablet', preset: 'once', purpose: 'Allergies' },
  { name: 'Acetaminophen', strength: '500 mg', form: 'tablet', preset: 'prn', purpose: 'Pain or fever' },
  { name: 'Ibuprofen', strength: '200 mg', form: 'tablet', preset: 'prn', purpose: 'Pain or fever' },
];

const LIMITS = { drugName: 120, strength: 80, dose: 120, instructions: 2000, purpose: 200 } as const;

/** Add / edit form for self-reported OTC medicines and supplements. */
export function MedForm({ initial, submitLabel, submitIcon = 'checkmark', onSubmit, onCancel }: MedFormProps) {
  const initialPreset = initial ? presetForPrescription(initial) : 'once';
  const [drugName, setDrugName] = useState(initial?.drugName ?? '');
  const [strength, setStrength] = useState(initial?.strength ?? '');
  const [form, setForm] = useState(initial?.form || 'tablet');
  const [dose, setDose] = useState(initial?.dose ?? formOption('tablet')!.defaultDose);
  const [doseTouched, setDoseTouched] = useState(!!initial);
  const [preset, setPreset] = useState<FrequencyPresetId>(initialPreset);
  const [times, setTimes] = useState<string[]>(initial ? [...initial.times] : [...frequencyPreset('once').times]);
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [purpose, setPurpose] = useState(initial?.purpose ?? '');
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formChoices =
    initial?.form && !formOption(initial.form)
      ? [{ value: initial.form, label: initial.form, route: initial.route, defaultDose: initial.dose }, ...FORM_OPTIONS]
      : FORM_OPTIONS;

  const asNeeded = preset === 'prn';
  const errors = {
    drugName: !drugName.trim() ? 'Enter the name of the medicine or supplement.' : null,
    times: !asNeeded && times.length === 0 ? 'Add at least one time, or choose “As needed”.' : null,
  };
  const valid = !errors.drugName && !errors.times;

  const chooseForm = (value: string) => {
    setForm(value);
    const option = formChoices.find((f) => f.value === value);
    if (!doseTouched && option) setDose(option.defaultDose);
  };

  const choosePreset = (id: FrequencyPresetId) => {
    setPreset(id);
    setTimes([...frequencyPreset(id).times]);
  };

  const applySuggestion = (s: Suggestion) => {
    setDrugName(s.name);
    setStrength(s.strength);
    chooseForm(s.form);
    choosePreset(s.preset);
    setPurpose(s.purpose);
  };

  const submit = async () => {
    setShowErrors(true);
    if (!valid || submitting) return;
    const option = formChoices.find((f) => f.value === form);
    const route = initial && initial.form === form ? initial.route : (option?.route ?? 'by mouth');
    const finalTimes = asNeeded ? [] : times;
    setSubmitting(true);
    try {
      await onSubmit({
        drugName: drugName.trim(),
        strength: strength.trim(),
        form,
        dose: dose.trim() || option?.defaultDose || '',
        route,
        frequency: frequencyFor(preset, finalTimes),
        times: finalTimes,
        instructions: instructions.trim(),
        purpose: purpose.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Input
          label="Name"
          value={drugName}
          onChangeText={setDrugName}
          placeholder="e.g. Vitamin D3, Ibuprofen"
          maxLength={LIMITS.drugName}
          autoCapitalize="words"
          autoCorrect={false}
          error={showErrors ? errors.drugName : null}
          leftIcon="medkit-outline"
        />
        {!initial && !drugName.trim() ? (
          <View style={styles.suggestions}>
            <AppText variant="caption" tone="muted">
              Common picks
            </AppText>
            <View style={styles.chips}>
              {SUGGESTIONS.map((s) => (
                <Chip
                  key={s.name}
                  label={s.name}
                  onPress={() => applySuggestion(s)}
                  accessibilityLabel={`Fill in ${s.name}`}
                />
              ))}
            </View>
          </View>
        ) : null}
        <Input
          label="Strength"
          optional
          value={strength}
          onChangeText={setStrength}
          placeholder="e.g. 1,000 IU or 200 mg"
          maxLength={LIMITS.strength}
          autoCorrect={false}
        />
        <View style={styles.field}>
          <AppText variant="label" style={styles.fieldLabel}>
            Form
          </AppText>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Form">
            {formChoices.map((f) => (
              <Chip key={f.value} label={f.label} selected={form === f.value} onPress={() => chooseForm(f.value)} />
            ))}
          </View>
        </View>
        <Input
          label="Dose"
          value={dose}
          onChangeText={(t) => {
            setDose(t);
            setDoseTouched(true);
          }}
          placeholder="e.g. 1 tablet"
          maxLength={LIMITS.dose}
          hint="How much you take each time."
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.field}>
          <AppText variant="label" style={styles.fieldLabel}>
            How often
          </AppText>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="How often">
            {FREQUENCY_PRESETS.map((p) => (
              <Chip key={p.id} label={p.label} selected={preset === p.id} onPress={() => choosePreset(p.id)} />
            ))}
          </View>
        </View>
        {asNeeded ? (
          <View style={styles.note}>
            <AppText variant="small" tone="muted">
              As-needed medicines stay on your list but don’t appear in your daily dose checklist.
            </AppText>
          </View>
        ) : (
          <TimeChipsEditor
            label="Reminder times"
            times={times}
            onChange={setTimes}
            hint="These show up in your checklist on the Home tab."
            error={showErrors ? errors.times : null}
          />
        )}
      </Card>

      <Card style={styles.card}>
        <TextArea
          label="Instructions"
          optional
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g. Take with food"
          maxLength={LIMITS.instructions}
          minHeight={88}
        />
        <Input
          label="What it’s for"
          optional
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. Bone health"
          maxLength={LIMITS.purpose}
        />
      </Card>

      <View style={styles.actions}>
        {onCancel ? (
          <Button title="Cancel" variant="outline" onPress={onCancel} disabled={submitting} style={styles.flex} />
        ) : null}
        <Button
          title={submitLabel}
          icon={submitIcon}
          onPress={submit}
          loading={submitting}
          disabled={showErrors && !valid}
          style={styles.flex}
          fullWidth={!onCancel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  card: { gap: spacing.lg },
  field: { gap: spacing.sm },
  fieldLabel: { marginLeft: 2 },
  suggestions: { gap: spacing.xs + 2, marginTop: -spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  note: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
