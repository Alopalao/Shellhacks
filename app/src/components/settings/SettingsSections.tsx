import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, ConnectionStatus, Divider, SectionHeader, useConfirm, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { clearTabBadges } from '@/lib/tab-badges';
import { spacing } from '@/theme';
import { ServerSettingsForm } from './ServerSettingsForm';

/** "Server & connection" card: live socket status + server URL editor. */
export function ServerSection() {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Server & connection" icon="wifi-outline" />
      <ConnectionStatus />
      <Divider />
      <ServerSettingsForm />
    </Card>
  );
}

/** "Demo" card: wipe and re-seed demo data (with an in-app confirm), then refresh the session. */
export function DemoSection() {
  const confirm = useConfirm();
  const toast = useToast();
  const { refreshUser, user } = useAuth();
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset demo data?',
      message:
        'This wipes every account, message, prescription and note on the server and restores the original demo. Everyone connected will see the reset.',
      confirmLabel: 'Reset data',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.resetDemo();
      const fresh = await refreshUser();
      if (fresh) {
        toast.success('Demo data reset', 'Everything is back to the original demo.');
        router.replace(fresh.role === 'doctor' ? '/doctor' : '/patient');
      } else {
        toast.info('Demo data reset', 'Please sign in again.');
      }
    } catch (e) {
      toast.error('Reset failed', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={styles.card}>
      <SectionHeader title="Demo" icon="flask-outline" />
      <AppText variant="small" tone="muted">
        Restore the seeded patient ({user?.role === 'doctor' ? 'Maya Johnson and Jordan Lee' : 'you, Maya Johnson'}) and
        Dr. Reyes with their medications, messages and notes.
      </AppText>
      <Button title="Reset demo data" variant="outline" icon="refresh-circle-outline" onPress={reset} loading={busy} />
    </Card>
  );
}

/** Log out button with confirmation. */
export function LogoutButton() {
  const { logout } = useAuth();
  const confirm = useConfirm();
  return (
    <Button
      title="Log out"
      variant="secondary"
      icon="log-out-outline"
      fullWidth
      onPress={async () => {
        if (await confirm({ title: 'Log out of BRIAN?', confirmLabel: 'Log out' })) {
          clearTabBadges();
          await logout();
          router.replace('/');
        }
      }}
    />
  );
}

/** Small "BRIAN demo · version" footer. */
export function AppFooter() {
  return (
    <View style={styles.footer}>
      <AppText variant="caption" tone="subtle" align="center">
        BRIAN demo · Built for patients, connected to physicians.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  footer: { paddingVertical: spacing.md },
});
