import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileHrefForRole, useAuth } from '@/lib/auth';
import { useServerUrl } from '@/lib/server-url';
import { useSocket, type SocketStatus } from '@/lib/socket';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

/** Human label for a socket status. */
export function connectionLabel(status: SocketStatus): string {
  switch (status) {
    case 'connected':
      return 'Live — connected';
    case 'connecting':
      return 'Connecting…';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'unauthorized':
      return 'Session expired';
    default:
      return 'Offline';
  }
}

export interface ConnectionBannerProps {
  /** Grace period before showing (avoids flashes on startup/brief blips). Default 2500 ms. */
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Slim floating pill at the top of the screen while the realtime connection is down.
 * Rendered once by the patient/doctor tab layouts; tap → profile (server settings).
 */
export function ConnectionBanner({ delayMs = 2_500, style }: ConnectionBannerProps) {
  const { status: authStatus, user } = useAuth();
  const { status } = useSocket();
  const insets = useSafeAreaInsets();
  const problem = authStatus === 'signed-in' && status !== 'connected' && status !== 'idle';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!problem) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [problem, delayMs]);

  if (!visible || !problem || !user) return null;
  return (
    <View pointerEvents="box-none" style={[styles.floating, { top: insets.top + spacing.xs }, style]}>
      <Pressable
        onPress={() => router.push(profileHrefForRole(user.role))}
        accessibilityRole="button"
        accessibilityLabel={`${status === 'unauthorized' ? 'Session expired' : 'Reconnecting to the BRIAN server'}. Open server settings.`}
        accessibilityLiveRegion="polite"
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      >
        {status === 'unauthorized' ? (
          <Ionicons name="lock-closed" size={14} color={colors.yellow} />
        ) : (
          <ActivityIndicator size="small" color={colors.yellow} />
        )}
        <AppText variant="caption" tone="inverse" weight="semibold">
          {status === 'unauthorized' ? 'Session expired — sign in again' : 'Reconnecting to BRIAN…'}
        </AppText>
      </Pressable>
    </View>
  );
}

export interface ConnectionStatusProps {
  /** Also show the server URL under the status. Default true. */
  showUrl?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Inline status row (dot + label + server URL) for settings screens. */
export function ConnectionStatus({ showUrl = true, style }: ConnectionStatusProps) {
  const { status, lastError } = useSocket();
  const { url } = useServerUrl();
  const color =
    status === 'connected' ? colors.online : status === 'unauthorized' ? colors.danger : colors.warning;
  return (
    <View
      style={[styles.statusRow, style]}
      accessible
      accessibilityLabel={`Realtime connection: ${connectionLabel(status)}. Server ${url}`}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{connectionLabel(status)}</AppText>
        {showUrl ? (
          <AppText variant="small" tone="muted" selectable numberOfLines={1}>
            {url}
          </AppText>
        ) : null}
        {status !== 'connected' && lastError && lastError !== 'unauthorized' ? (
          <AppText variant="caption" tone="subtle" numberOfLines={2}>
            {lastError}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floating: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 900, elevation: 900 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  pressed: { opacity: 0.85 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  flex: { flex: 1 },
});
