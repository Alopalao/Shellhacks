import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, type IoniconName } from '@/components/ui';
import type { MessageAttachment, Role } from '@/lib/contracts';
import { formatDate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { AttachmentLookup } from './useAttachmentLookup';

export interface AttachmentInfo {
  icon: IoniconName;
  /** "Visit note" / "Medication". */
  kind: string;
  title: string;
  detail: string | null;
  href: string;
}

/**
 * Where an attachment opens and how it is labelled, per viewer role:
 * visit note → patient note screen (doctors: the patient's chart);
 * prescription → patient med detail (doctors: the patient's chart).
 */
export function describeAttachment(
  attachment: MessageAttachment,
  viewerRole: Role,
  patientId: string,
  lookup: AttachmentLookup,
): AttachmentInfo {
  const chart = `/doctor/patients/${encodeURIComponent(patientId)}`;
  if (attachment.type === 'visit-note') {
    const note = lookup.note(attachment.noteId);
    return {
      icon: 'document-text',
      kind: 'Visit note',
      title: note?.title ?? 'Visit note',
      detail: note
        ? `${formatDate(note.createdAt, { omitCurrentYear: true })}${viewerRole === 'doctor' ? ' · Open chart' : ' · Tap to read'}`
        : viewerRole === 'doctor'
          ? 'Open chart'
          : 'Tap to read',
      href: viewerRole === 'doctor' ? chart : `/patient/care/notes/${encodeURIComponent(attachment.noteId)}`,
    };
  }
  const rx = lookup.prescription(attachment.prescriptionId);
  return {
    icon: 'medkit',
    kind: 'Medication',
    title: rx ? `${rx.drugName} ${rx.strength}`.trim() : 'Medication',
    detail: rx ? [rx.dose, rx.frequency].filter(Boolean).join(' · ') || null : viewerRole === 'doctor' ? 'Open chart' : 'View details',
    href: viewerRole === 'doctor' ? chart : `/patient/meds/${encodeURIComponent(attachment.prescriptionId)}`,
  };
}

export interface AttachmentCardProps {
  attachment: MessageAttachment;
  viewerRole: Role;
  patientId: string;
  lookup: AttachmentLookup;
  /** Rendered inside the viewer's own (yellow) bubble. */
  onYellow?: boolean;
}

/** Tappable card for a shared visit note or medication, shown inside a message bubble. */
export function AttachmentCard({ attachment, viewerRole, patientId, lookup, onYellow }: AttachmentCardProps) {
  const info = describeAttachment(attachment, viewerRole, patientId, lookup);
  return (
    <Pressable
      onPress={() => router.push(info.href)}
      accessibilityRole="button"
      accessibilityLabel={`${info.kind}: ${info.title}`}
      accessibilityHint={viewerRole === 'doctor' ? "Opens the patient's chart" : `Opens the ${info.kind.toLowerCase()}`}
      style={({ pressed }) => [styles.card, onYellow ? styles.cardOnYellow : styles.cardOnWhite, pressed && styles.pressed]}
    >
      <View style={[styles.icon, onYellow ? styles.iconOnYellow : styles.iconOnWhite]}>
        <Ionicons name={info.icon} size={18} color={colors.text} />
      </View>
      <View style={styles.texts}>
        <AppText variant="caption" tone="muted" weight="semibold">
          {info.kind.toUpperCase()}
        </AppText>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {info.title}
        </AppText>
        {info.detail ? (
          <AppText variant="small" tone="muted" numberOfLines={1}>
            {info.detail}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  cardOnYellow: { backgroundColor: colors.white, borderColor: colors.yellowBorder },
  cardOnWhite: { backgroundColor: colors.yellowLighter, borderColor: colors.yellowBorder },
  pressed: { opacity: 0.85 },
  icon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  iconOnYellow: { backgroundColor: colors.yellowLight },
  iconOnWhite: { backgroundColor: colors.yellow },
  texts: { flex: 1, gap: 1 },
});
