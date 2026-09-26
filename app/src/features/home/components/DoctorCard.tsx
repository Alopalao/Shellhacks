import { StyleSheet, View } from 'react-native';
import { AppText, Avatar, Badge, Button, Card, EmptyState } from '@/components/ui';
import type { User } from '@/lib/contracts';
import { displayName, pluralize } from '@/lib/format';
import { usePresence } from '@/lib/socket';
import { colors, spacing } from '@/theme';

export interface DoctorCardProps {
  doctor: User | null;
  /** Presence from the dashboard, used until the socket reports. */
  onlineFallback: boolean;
  unreadMessages: number;
  onMessage: () => void;
  onChooseDoctor: () => void;
}

/** The patient's physician: photo with a live online dot, specialty and a "Message" button. */
export function DoctorCard({ doctor, onlineFallback, unreadMessages, onMessage, onChooseDoctor }: DoctorCardProps) {
  const online = usePresence(doctor?.id, onlineFallback);

  if (!doctor) {
    return (
      <Card>
        <EmptyState
          compact
          icon="person-add-outline"
          title="No doctor yet"
          message="Choose your physician to message them and request refills."
          actionLabel="Choose a doctor"
          onAction={onChooseDoctor}
        />
      </Card>
    );
  }

  const name = displayName(doctor);
  const specialty = [doctor.doctor?.specialty, doctor.doctor?.clinic].filter(Boolean).join(' · ');
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Avatar user={doctor} size={64} online={online} />
        <View style={styles.texts}>
          <AppText variant="caption" tone="muted">
            Your doctor
          </AppText>
          <AppText variant="title3" numberOfLines={1}>
            {name}
          </AppText>
          {specialty ? (
            <AppText variant="small" tone="muted" numberOfLines={1}>
              {specialty}
            </AppText>
          ) : null}
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: online ? colors.online : colors.textSubtle }]} />
            <AppText variant="caption" tone={online ? 'success' : 'subtle'}>
              {online ? 'Online now' : 'Offline · replies when back'}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          title="Message"
          icon="chatbubble-ellipses-outline"
          onPress={onMessage}
          style={styles.flex}
          accessibilityLabel={
            unreadMessages ? `Message ${name}, ${pluralize(unreadMessages, 'unread message')}` : `Message ${name}`
          }
        />
        {unreadMessages > 0 ? (
          <Badge label={`${unreadMessages} new`} tone="dark" icon="mail-unread-outline" size="md" />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1, gap: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
