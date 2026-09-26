import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, Avatar, Badge, Card, ProgressBar } from '@/components/ui';
import type { PatientSummary } from '@/lib/contracts';
import { formatPercent, formatRelative, pluralize } from '@/lib/format';
import { colors, spacing } from '@/theme';
import { ageLabel } from '../format';
import { TagList } from './Tags';

/** Below this 7-day adherence the card shows a gentle "Low" flag. */
export const LOW_ADHERENCE = 0.7;

export interface PatientCardProps {
  summary: PatientSummary;
  online: boolean;
  onPress: () => void;
  now?: Date;
  style?: StyleProp<ViewStyle>;
}

/** Patient row on the doctor's list: presence, conditions, meds, adherence, refills & unread. */
export function PatientCard({ summary, online, onPress, now, style }: PatientCardProps) {
  const { patient, activePrescriptions, adherence7d, pendingRefills, unreadMessages, lastMessageAt } = summary;
  const conditions = patient.patient?.conditions ?? [];
  const allergies = patient.patient?.allergies ?? [];
  const age = ageLabel(patient, now);
  const low = adherence7d != null && adherence7d < LOW_ADHERENCE;

  const a11y = [
    patient.name,
    age,
    online ? 'online' : 'offline',
    conditions.length ? `Conditions: ${conditions.join(', ')}` : null,
    pluralize(activePrescriptions, 'active medication'),
    adherence7d == null ? 'No doses scheduled in the last 7 days' : `7-day adherence ${formatPercent(adherence7d)}`,
    pendingRefills ? pluralize(pendingRefills, 'pending refill request') : null,
    unreadMessages ? pluralize(unreadMessages, 'unread message') : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card onPress={onPress} accessibilityLabel={a11y} accessibilityHint="Opens the patient's chart" style={[styles.card, style]}>
      <View style={styles.header}>
        <Avatar user={patient} size={52} online={online} accessibilityLabel="" />
        <View style={styles.headerText}>
          <AppText variant="title3" numberOfLines={1}>
            {patient.name}
          </AppText>
          <View style={styles.metaRow}>
            <View style={[styles.presenceDot, { backgroundColor: online ? colors.online : colors.textSubtle }]} />
            <AppText variant="small" tone="muted" numberOfLines={1} style={styles.flexShrink}>
              {[age, online ? 'Online now' : 'Offline'].filter(Boolean).join(' · ')}
            </AppText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
      </View>

      {pendingRefills || unreadMessages || allergies.length ? (
        <View style={styles.badges}>
          {pendingRefills ? (
            <Badge
              tone="yellow"
              icon="refresh-circle"
              size="md"
              label={pendingRefills === 1 ? '1 refill request' : `${pendingRefills} refill requests`}
            />
          ) : null}
          {unreadMessages ? (
            <Badge tone="dark" icon="chatbubble" size="md" label={pluralize(unreadMessages, 'unread message')} />
          ) : null}
          {allergies.length ? (
            <Badge tone="danger" icon="warning-outline" size="md" label={pluralize(allergies.length, 'allergy', 'allergies')} />
          ) : null}
        </View>
      ) : null}

      <TagList items={conditions} size="sm" max={4} emptyText="No conditions recorded" />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="medkit-outline" size={16} color={colors.textMuted} />
          <AppText variant="small">
            <AppText variant="small" weight="bold">
              {activePrescriptions}
            </AppText>{' '}
            active {activePrescriptions === 1 ? 'med' : 'meds'}
          </AppText>
        </View>
        <View style={[styles.stat, styles.adherence]}>
          <AppText variant="small" tone="muted">
            7-day
          </AppText>
          <ProgressBar
            value={adherence7d ?? 0}
            height={6}
            style={styles.bar}
            accessibilityLabel={
              adherence7d == null ? 'No adherence data' : `7-day adherence ${formatPercent(adherence7d)}`
            }
          />
          <AppText variant="small" weight="bold" tone={low ? 'warning' : 'default'}>
            {formatPercent(adherence7d)}
          </AppText>
        </View>
      </View>
      {lastMessageAt ? (
        <AppText variant="caption" tone="subtle">
          Last message: {formatRelative(lastMessageAt, now)}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  presenceDot: { width: 8, height: 8, borderRadius: 4 },
  flexShrink: { flexShrink: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  adherence: { flex: 1, minWidth: 160 },
  bar: { flex: 1 },
});
