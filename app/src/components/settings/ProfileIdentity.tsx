import { StyleSheet, View } from 'react-native';
import { AppText, Avatar, Badge, Card } from '@/components/ui';
import type { User } from '@/lib/contracts';
import { ageFromDob, displayName, formatDate } from '@/lib/format';
import { useSocket } from '@/lib/socket';
import { spacing } from '@/theme';

/** Light-yellow identity card at the top of the profile screens. */
export function ProfileIdentity({ user }: { user: User }) {
  const { connected } = useSocket();
  const dob = user.patient?.dateOfBirth;
  const age = ageFromDob(dob);
  const detail =
    user.role === 'doctor'
      ? [user.doctor?.specialty, user.doctor?.clinic].filter(Boolean).join(' · ')
      : dob
        ? `Born ${formatDate(dob)}${age != null ? ` · ${age} years` : ''}`
        : 'Add your date of birth below';
  return (
    <Card variant="yellow" padding="lg" style={styles.card}>
      <Avatar user={user} size={72} online={connected} ring />
      <View style={styles.texts}>
        <AppText variant="title2" numberOfLines={2}>
          {displayName(user)}
          {user.role === 'doctor' && user.doctor?.credentials ? `, ${user.doctor.credentials}` : ''}
        </AppText>
        <AppText variant="small" tone="muted" numberOfLines={1} selectable>
          {user.email}
        </AppText>
        {detail ? (
          <AppText variant="small" numberOfLines={2}>
            {detail}
          </AppText>
        ) : null}
        <Badge
          label={user.role === 'doctor' ? 'Physician' : 'Patient'}
          tone="dark"
          icon={user.role === 'doctor' ? 'medkit' : 'person'}
          style={styles.badge}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  texts: { flex: 1, gap: 2 },
  badge: { marginTop: spacing.xs },
});
