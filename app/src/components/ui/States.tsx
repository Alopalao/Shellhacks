import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { errorMessage, isApiRequestError, isNetworkError } from '@/lib/api';
import { profileHrefForRole, useAuth } from '@/lib/auth';
import { useServerUrl } from '@/lib/server-url';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button, type IoniconName } from './Button';

export interface EmptyStateProps {
  icon?: IoniconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Smaller padding for use inside cards. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Friendly "nothing here yet" block with an optional call to action. */
export function EmptyState({ icon = 'leaf-outline', title, message, actionLabel, onAction, compact, style }: EmptyStateProps) {
  return (
    <View style={[styles.center, compact ? styles.compact : styles.roomy, style]}>
      <View style={[styles.iconCircle, compact && styles.iconCircleSmall]}>
        <Ionicons name={icon} size={compact ? 22 : 28} color={colors.text} />
      </View>
      <AppText variant={compact ? 'bodyStrong' : 'title3'} align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant={compact ? 'small' : 'body'} tone="muted" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} size={compact ? 'sm' : 'md'} style={styles.action} />
      ) : null}
    </View>
  );
}

export interface LoadingStateProps {
  label?: string;
  /** Fill the available space and center (default true). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Centered spinner with an optional label. */
export function LoadingState({ label = 'Loading…', fill = true, style }: LoadingStateProps) {
  return (
    <View
      style={[styles.center, fill ? styles.fill : styles.compact, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.spinnerRing}>
        <ActivityIndicator color={colors.black} />
      </View>
      {label ? (
        <AppText variant="small" tone="muted">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

export interface ErrorStateProps {
  /** The thrown error; network errors automatically show the server URL and a settings shortcut. */
  error?: unknown;
  title?: string;
  /** Overrides the message derived from `error`. */
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Error block with retry. Knows how to explain "server unreachable". */
export function ErrorState({ error, title, message, onRetry, retryLabel = 'Try again', compact, style }: ErrorStateProps) {
  const { status, user } = useAuth();
  const { url } = useServerUrl();
  const offline = isNetworkError(error);
  const notFound = isApiRequestError(error) && error.status === 404;
  const heading = title ?? (offline ? "Can't reach BRIAN" : notFound ? 'Not found' : 'Something went wrong');
  const body = message ?? errorMessage(error, 'Please try again.');
  return (
    <View
      style={[styles.center, compact ? styles.compact : styles.roomy, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.iconCircle, styles.iconCircleError, compact && styles.iconCircleSmall]}>
        <Ionicons name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'} size={compact ? 22 : 28} color={colors.danger} />
      </View>
      <AppText variant={compact ? 'bodyStrong' : 'title3'} align="center">
        {heading}
      </AppText>
      <AppText variant={compact ? 'small' : 'body'} tone="muted" align="center" style={styles.message}>
        {body}
      </AppText>
      {offline && !message?.includes(url) && !body.includes(url) ? (
        <AppText variant="caption" tone="subtle" align="center" selectable>
          Server: {url}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        {onRetry ? <Button title={retryLabel} icon="refresh" onPress={onRetry} size={compact ? 'sm' : 'md'} /> : null}
        {offline && status === 'signed-in' && user ? (
          <Button
            title="Server settings"
            variant="outline"
            icon="settings-outline"
            size={compact ? 'sm' : 'md'}
            onPress={() => router.push(profileHrefForRole(user.role))}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  fill: { flex: 1, paddingVertical: spacing.xxxl },
  roomy: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  compact: { paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconCircleSmall: { width: 48, height: 48 },
  iconCircleError: { backgroundColor: colors.dangerLight },
  spinnerRing: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { maxWidth: 420 },
  action: { marginTop: spacing.sm, alignSelf: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
