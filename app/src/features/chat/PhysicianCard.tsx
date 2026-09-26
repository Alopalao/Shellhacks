import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Avatar, Button, Card } from '@/components/ui';
import type { Thread, User } from '@/lib/contracts';
import { displayName, formatRelative } from '@/lib/format';
import { useNow } from '@/hooks/useInterval';
import { colors, radius, spacing } from '@/theme';
import { messagePreview, shortName } from './messages';
import { PresenceStatus } from './PresenceStatus';
import { UnreadCount } from './UnreadCount';
import { usePresenceDetails } from './usePresenceDetails';

export interface PhysicianCardProps {
  doctor: User;
  /** The patient's thread with this doctor (unread count + last message). */
  thread: Thread | null;
  /** Signed-in patient id. */
  me: string;
  typing: boolean;
  onMessage: () => void;
}

/** "Your physician" card: photo with online dot, name + credentials, specialty, clinic, live presence, message CTA. */
export function PhysicianCard({ doctor, thread, me, typing, onMessage }: PhysicianCardProps) {
  const { online, lastSeen } = usePresenceDetails(doctor.id);
  const now = useNow(60_000);
  const profile = doctor.doctor;
  const credentials = profile?.credentials?.trim();
  const name = `${displayName(doctor)}${credentials ? `, ${credentials}` : ''}`;
  const unread = thread?.unreadCount ?? 0;
  const last = thread?.lastMessage ?? null;
  const short = shortName(doctor);

  return (
    <Card variant="yellow" padding="lg" style={styles.card}>
      <AppText variant="label" tone="muted">
        YOUR PHYSICIAN
      </AppText>
      <View style={styles.identity}>
        <Avatar user={doctor} size={76} online={online} ring />
        <View style={styles.texts}>
          <AppText variant="title3" numberOfLines={2}>
            {name}
          </AppText>
          {profile?.specialty ? (
            <AppText variant="body" tone="muted" numberOfLines={1}>
              {profile.specialty}
            </AppText>
          ) : null}
          {profile?.clinic ? (
            <View style={styles.clinic}>
              <Ionicons name="business-outline" size={14} color={colors.textMuted} />
              <AppText variant="small" tone="muted" numberOfLines={1} style={styles.flexShrink}>
                {profile.clinic}
              </AppText>
            </View>
          ) : null}
          <PresenceStatus online={online} lastSeen={lastSeen} typing={typing} onlineLabel="Online now" />
        </View>
      </View>

      {last ? (
        <View
          style={styles.lastMessage}
          accessible
          accessibilityLabel={`Last message ${formatRelative(last.createdAt, now)}: ${messagePreview(last, me)}`}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.textMuted} />
          <AppText
            variant="small"
            tone={unread ? 'default' : 'muted'}
            weight={unread ? 'semibold' : undefined}
            numberOfLines={2}
            style={styles.flex}
          >
            {messagePreview(last, me)}
          </AppText>
          <AppText variant="caption" tone="subtle">
            {formatRelative(last.createdAt, now)}
          </AppText>
        </View>
      ) : null}

      <View>
        <Button
          title={`Message ${short}`}
          icon="chatbubble-ellipses"
          size="lg"
          fullWidth
          onPress={onMessage}
          accessibilityLabel={`Message ${short}${unread ? `, ${unread} unread ${unread === 1 ? 'message' : 'messages'}` : ''}`}
          accessibilityHint="Opens your secure chat"
        />
        {unread ? <UnreadCount count={unread} tone="dark" style={styles.buttonBadge} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  texts: { flex: 1, gap: 3 },
  clinic: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flexShrink: { flexShrink: 1 },
  flex: { flex: 1 },
  lastMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  buttonBadge: { position: 'absolute', top: -6, right: -4, minWidth: 24, height: 24, borderRadius: 12 },
});
