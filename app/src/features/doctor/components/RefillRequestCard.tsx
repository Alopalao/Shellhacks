import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, TextArea, useToast } from '@/components/ui';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { api, errorMessage, isApiRequestError, type ResolveRefillResponse } from '@/lib/api';
import type { Prescription, RefillRequest, ResolveRefillRequest } from '@/lib/contracts';
import { firstName, formatDateTime, formatRelative, pluralize } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { medLabel, relativePhrase } from '../format';
import { MAX_REFILLS } from '../prescription-form';
import { Stepper } from './Stepper';

export interface RefillRequestCardProps {
  refill: RefillRequest;
  /** The prescription being refilled (may be unknown while data loads). */
  rx?: Prescription;
  /** Show the patient's name (inbox); omitted on the patient's own chart. */
  patientName?: string;
  /** First name used in confirmations when `patientName` is not shown ("Maya has been notified"). */
  patientFirstName?: string;
  onOpenPatient?: () => void;
  /** Called with the server response after approve/deny. */
  onResolved: (result: ResolveRefillResponse) => void;
  /**
   * Called when the request turned out to be stale — already resolved (409) or handed to another
   * physician because the patient switched doctors (403) — reload.
   */
  onStale?: () => void;
  now?: Date;
}

type Mode = 'idle' | 'approve' | 'deny';

/** Pending refill request with inline approve (refills stepper) / deny (note) flows. */
export function RefillRequestCard({
  refill,
  rx,
  patientName,
  patientFirstName,
  onOpenPatient,
  onResolved,
  onStale,
  now,
}: RefillRequestCardProps) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('idle');
  const [refills, setRefills] = useState(1);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const drug = rx ? medLabel(rx) : 'Medication';
  const who = patientFirstName || (patientName ? firstName(patientName) : '') || 'Your patient';

  const resolve = useAsyncAction((body: ResolveRefillRequest) => api.resolveRefill(refill.id, body), {
    onError: (e) => {
      if (isApiRequestError(e) && (e.status === 409 || e.status === 403)) {
        toast.info(e.status === 409 ? 'Already handled' : 'No longer yours to decide', errorMessage(e));
        onStale?.();
        return;
      }
      toast.error("Couldn't update the refill request", errorMessage(e));
    },
  });

  const approve = async () => {
    const result = await resolve.run({ status: 'approved', refillsAdded: refills, doctorNote: note.trim() || null });
    if (!result) return;
    toast.success('Refill approved', `${pluralize(refills, 'refill')} added to ${drug}. ${who} has been notified.`);
    onResolved(result);
  };

  const deny = async () => {
    if (!note.trim()) {
      setNoteError(`Add a short note so ${who === 'Your patient' ? 'your patient' : who} knows what to do next.`);
      return;
    }
    const result = await resolve.run({ status: 'denied', doctorNote: note.trim() });
    if (!result) return;
    toast.success('Refill declined', `${who} has been notified with your note.`);
    onResolved(result);
  };

  const cancel = () => {
    setMode('idle');
    setNoteError(null);
  };

  return (
    <Card variant="yellow" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Ionicons name="refresh-circle" size={22} color={colors.black} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="bodyStrong">{drug}</AppText>
          {patientName ? (
            onOpenPatient ? (
              <Pressable
                onPress={onOpenPatient}
                accessibilityRole="link"
                accessibilityLabel={`Open ${patientName}'s chart`}
                hitSlop={8}
                style={({ pressed }) => [styles.patientLink, pressed && styles.pressed]}
              >
                <AppText variant="small" weight="semibold" style={styles.underline}>
                  {patientName}
                </AppText>
              </Pressable>
            ) : (
              <AppText variant="small" tone="muted">
                {patientName}
              </AppText>
            )
          ) : null}
          <AppText variant="caption" tone="muted" accessibilityLabel={`Requested ${formatDateTime(refill.createdAt)}`}>
            Requested {relativePhrase(refill.createdAt, now)}
            {rx && !rx.selfReported ? ` · ${pluralize(rx.refillsRemaining, 'refill')} left` : ''}
          </AppText>
        </View>
        <Badge label="Pending" tone="dark" />
      </View>

      {refill.patientNote ? (
        <View style={styles.quote} accessible accessibilityLabel={`Note from ${who}: ${refill.patientNote}`}>
          <AppText variant="small" style={styles.quoteText}>
            “{refill.patientNote}”
          </AppText>
        </View>
      ) : null}

      {mode === 'idle' ? (
        <View style={styles.actions}>
          <Button title="Approve" icon="checkmark" onPress={() => setMode('approve')} accessibilityLabel={`Approve refill of ${drug}`} />
          <Button
            title="Deny"
            icon="close"
            variant="outline"
            onPress={() => setMode('deny')}
            accessibilityLabel={`Deny refill of ${drug}`}
          />
        </View>
      ) : null}

      {mode === 'approve' ? (
        <View style={styles.panel}>
          <Stepper
            label="Refills to add"
            value={refills}
            min={1}
            max={MAX_REFILLS}
            onChange={setRefills}
            format={(n) => pluralize(n, 'refill')}
            disabled={resolve.pending}
          />
          <TextArea
            label="Note to patient"
            optional
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Approved — please schedule a check-in next month."
            minHeight={72}
            maxLength={1000}
          />
          <View style={styles.actions}>
            <Button
              title={`Approve ${pluralize(refills, 'refill')}`}
              icon="checkmark-done"
              loading={resolve.pending}
              onPress={approve}
            />
            <Button title="Cancel" variant="ghost" onPress={cancel} disabled={resolve.pending} />
          </View>
        </View>
      ) : null}

      {mode === 'deny' ? (
        <View style={styles.panel}>
          <TextArea
            label="Note to patient"
            value={note}
            onChangeText={(t) => {
              setNote(t);
              if (noteError && t.trim()) setNoteError(null);
            }}
            error={noteError}
            hint="Explain why, and what they should do next (e.g. book a visit, labs first)."
            placeholder="e.g. Let's check your labs before refilling — please book a visit this week."
            minHeight={88}
            maxLength={1000}
          />
          <View style={styles.actions}>
            <Button title="Deny request" icon="close-circle" variant="secondary" loading={resolve.pending} onPress={deny} />
            <Button title="Cancel" variant="ghost" onPress={cancel} disabled={resolve.pending} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

export interface ResolvedRefillRowProps {
  refill: RefillRequest;
  rx?: Prescription;
  patientName?: string;
  onPress?: () => void;
  now?: Date;
}

/** Compact history row for an approved/denied refill request. */
export function ResolvedRefillRow({ refill, rx, patientName, onPress, now }: ResolvedRefillRowProps) {
  const approved = refill.status === 'approved';
  const drug = rx ? medLabel(rx) : 'Medication';
  const detail = approved
    ? `Approved · +${pluralize(refill.refillsAdded ?? 1, 'refill')}`
    : 'Declined';
  const when = formatRelative(refill.resolvedAt ?? refill.createdAt, now);
  const label = [drug, patientName, detail, refill.doctorNote ? `Note: ${refill.doctorNote}` : null, when]
    .filter(Boolean)
    .join(', ');
  const body = (
    <>
      <View style={[styles.statusIcon, approved ? styles.statusApproved : styles.statusDenied]}>
        <Ionicons name={approved ? 'checkmark' : 'close'} size={16} color={approved ? colors.black : colors.textMuted} />
      </View>
      <View style={styles.headerText}>
        <View style={styles.rowTitle}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.flex}>
            {drug}
          </AppText>
          <AppText variant="caption" tone="subtle">
            {when}
          </AppText>
        </View>
        <AppText variant="small" tone="muted" numberOfLines={1}>
          {[patientName, detail].filter(Boolean).join(' · ')}
        </AppText>
        {refill.doctorNote ? (
          <AppText variant="small" tone="muted" numberOfLines={2}>
            Note: {refill.doctorNote}
          </AppText>
        ) : null}
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Opens the patient's chart"
        style={({ pressed }) => [styles.historyRow, pressed && styles.historyPressed]}
      >
        {body}
      </Pressable>
    );
  }
  return (
    <View style={styles.historyRow} accessible accessibilityLabel={label}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientLink: { alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
  quote: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderLeftWidth: 3,
    borderLeftColor: colors.yellow,
  },
  quoteText: { fontStyle: 'italic' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  panel: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  historyPressed: { backgroundColor: colors.yellowLighter },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statusApproved: { backgroundColor: colors.yellow },
  statusDenied: { backgroundColor: colors.surfaceMuted },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
