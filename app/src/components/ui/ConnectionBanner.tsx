import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { profileHrefForRole, useAuth } from '@/lib/auth';
import { useServerUrl } from '@/lib/server-url';
import { useSocket, type SocketStatus } from '@/lib/socket';
import { colors, spacing } from '@/theme';
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
 * Slim black bar shown while the realtime connection is down; tap → profile (server settings).
 * The tab layouts render it in the layout flow right above the tab bar (see `renderAppTabBar`), so
 * it never covers screen headers, content or toasts.
 */
export function ConnectionBanner({ delayMs = 2_500, style }: ConnectionBannerProps) {
  const { status: authStatus, user } = useAuth();
  const { status } = useSocket();
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
  const expired = status === 'unauthorized';
  return (
    <Pressable
      onPress={() => router.push(profileHrefForRole(user.role))}
      accessibilityRole="button"
      accessibilityLabel={`${expired ? 'Session expired' : 'Reconnecting to the BRIAN server'}. Open server settings.`}
      accessibilityLiveRegion="polite"
      style={({ pressed }) => [styles.bar, pressed && styles.pressed, style]}
    >
      {expired ? (
        <Ionicons name="lock-closed" size={14} color={colors.yellow} />
      ) : (
        <ActivityIndicator size="small" color={colors.yellow} />
      )}
      <AppText variant="caption" tone="inverse" weight="semibold" numberOfLines={1} style={styles.barText}>
        {expired ? 'Session expired — sign in again' : 'Reconnecting to BRIAN…'}
      </AppText>
      <Ionicons name="chevron-forward" size={14} color={colors.textOnBlack} />
    </Pressable>
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
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.black,
  },
  barText: { flexShrink: 1 },
  pressed: { opacity: 0.85 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  flex: { flex: 1 },
});
