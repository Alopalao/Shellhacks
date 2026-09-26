import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, ErrorState, LoadingState, TextArea, useToast, type BadgeTone, type IoniconName } from '@/components/ui';
import { api, errorMessage, isApiRequestError } from '@/lib/api';
import type { Prescription, RefillRequest } from '@/lib/contracts';
import { formatRelative, pluralize } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { medLabel, REFILL_STATUS_LABEL, refillsLabel } from '../format';

export interface RefillPanelProps {
  rx: Prescription;
  /** Refill requests for this prescription, newest first (undefined while loading). */
  refills: readonly RefillRequest[] | undefined;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** "Dr. Reyes" / "your doctor". */
  doctorName: string;
  /** Called with the created (or already-pending) request so the parent can update its list. */
  onRequested: (refill: RefillRequest) => void;
  /** True when the medication is discontinued or ended. */
  past?: boolean;
}

const MAX_NOTE = 500;

const STATUS_STYLE: Record<RefillRequest['status'], { tone: BadgeTone; icon: IoniconName; bg: string }> = {
  pending: { tone: 'yellow', icon: 'time-outline', bg: colors.yellowLight },
  approved: { tone: 'success', icon: 'checkmark-circle', bg: colors.successLight },
  denied: { tone: 'danger', icon: 'close-circle', bg: colors.dangerLight },
};

function conflictRefill(error: unknown): RefillRequest | null {
  if (!isApiRequestError(error) || error.status !== 409) return null;
  const details = error.details as { refillRequest?: RefillRequest } | undefined;
  return details?.refillRequest ?? null;
}

/** Refills left, the latest request's status (live), and a "request refill" composer. */
export function RefillPanel({ rx, refills, loading, error, onRetry, doctorName, onRequested, past = false }: RefillPanelProps) {
  const toast = useToast();
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const latest = refills?.[0];
  const pending = latest?.status === 'pending';
  const outOfRefills = rx.refillsRemaining === 0;
  const actionLabel = outOfRefills ? 'Request renewal' : 'Request refill';

  const send = async () => {
    setSending(true);
    try {
      const created = await api.createRefill({ prescriptionId: rx.id, patientNote: note.trim() || null });
      onRequested(created);
      setComposing(false);
      setNote('');
      toast.success('Refill requested', `We sent your request for ${medLabel(rx)} to ${doctorName}.`);
    } catch (e) {
      const existing = conflictRefill(e);
      if (existing) {
        onRequested(existing);
        setComposing(false);
        toast.info('Already requested', `A request for ${rx.drugName} is waiting for ${doctorName}.`);
      } else {
        toast.error("Couldn't send your request", errorMessage(e));
      }
    } finally {
      setSending(false);
    }
  };

  if (rx.selfReported) {
    return (
      <View style={styles.container}>
        <Notice icon="information-circle-outline">
          This is a self-reported medicine, so there's no prescription for your doctor to refill. Ask your
          pharmacist when you need more.
        </Notice>
        <Button title="Request refill" icon="refresh" disabled fullWidth accessibilityHint="Not available for self-reported medicines" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.countRow}>
        <View style={[styles.countTile, outOfRefills && styles.countTileEmpty]}>
          <AppText variant="title2">{rx.refillsRemaining}</AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{refillsLabel(rx.refillsRemaining)}</AppText>
          <AppText variant="small" tone="muted">
            {past
              ? 'This medication was stopped, so it can’t be refilled.'
              : outOfRefills
                ? `Ask ${doctorName} to renew your prescription before you run out.`
                : 'Your pharmacy can refill it. You can also ask for more.'}
          </AppText>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Checking refill requests…" fill={false} />
      ) : error && !refills ? (
        <ErrorState error={error} title="Couldn’t load refill requests" onRetry={onRetry} compact />
      ) : latest ? (
        <LatestRequest refill={latest} doctorName={doctorName} />
      ) : null}

      {past ? null : composing ? (
        <View style={styles.composer}>
          <TextArea
            label="Note for your doctor"
            optional
            value={note}
            onChangeText={(t) => setNote(t.slice(0, MAX_NOTE))}
            placeholder="e.g. I have 3 days left. Please send it to my usual pharmacy."
            minHeight={96}
            maxLength={MAX_NOTE}
            hint={`${note.length}/${MAX_NOTE}`}
            autoFocus
          />
          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" onPress={() => setComposing(false)} disabled={sending} style={styles.flex} />
            <Button title="Send request" icon="send" onPress={send} loading={sending} style={styles.flex} />
          </View>
        </View>
      ) : (
        <Button
          title={pending ? 'Request pending' : actionLabel}
          icon={pending ? 'time-outline' : 'refresh'}
          onPress={() => setComposing(true)}
          disabled={pending || loading}
          fullWidth
          accessibilityHint={pending ? `Waiting for ${doctorName} to respond` : `Asks ${doctorName} for a refill`}
        />
      )}
    </View>
  );
}

function LatestRequest({ refill, doctorName }: { refill: RefillRequest; doctorName: string }) {
  const s = STATUS_STYLE[refill.status];
  const when = formatRelative(refill.resolvedAt ?? refill.createdAt);
  const headline =
    refill.status === 'pending'
      ? `Requested ${when} · waiting for ${doctorName}`
      : refill.status === 'approved'
        ? `${doctorName} approved ${refill.refillsAdded ? pluralize(refill.refillsAdded, 'refill') : 'it'} · ${when}`
        : `${doctorName} declined · ${when}`;
  return (
    <View
      style={[styles.status, { backgroundColor: s.bg }]}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={[
        `Latest refill request: ${REFILL_STATUS_LABEL[refill.status]}`,
        headline,
        refill.patientNote ? `Your note: ${refill.patientNote}` : null,
        refill.doctorNote ? `Doctor's note: ${refill.doctorNote}` : null,
      ]
        .filter(Boolean)
        .join('. ')}
    >
      <View style={styles.statusHead}>
        <Badge label={REFILL_STATUS_LABEL[refill.status]} tone={s.tone} icon={s.icon} size="md" />
        <AppText variant="small" tone="muted" style={styles.flex}>
          {headline}
        </AppText>
      </View>
      {refill.patientNote ? (
        <AppText variant="small">
          <AppText variant="small" weight="semibold">
            You:{' '}
          </AppText>
          “{refill.patientNote}”
        </AppText>
      ) : null}
      {refill.doctorNote ? (
        <AppText variant="small">
          <AppText variant="small" weight="semibold">
            {doctorName}:{' '}
          </AppText>
          “{refill.doctorNote}”
        </AppText>
      ) : null}
      {refill.status === 'denied' ? (
        <Button
          title="Message your doctor"
          icon="chatbubble-ellipses-outline"
          variant="outline"
          size="sm"
          onPress={() => router.push('/patient/care/chat')}
        />
      ) : null}
    </View>
  );
}

function Notice({ icon, children }: { icon: IoniconName; children: string }) {
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <AppText variant="small" tone="muted" style={styles.flex}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  flex: { flex: 1 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  countTile: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTileEmpty: { backgroundColor: colors.warningLight },
  status: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  statusHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  composer: { gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
});
