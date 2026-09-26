// Inline error under a question that didn't get an answer: friendly reason + Retry / Edit.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { errorMessage, isApiRequestError, isNetworkError } from '@/lib/api';
import { profileHrefForRole } from '@/lib/auth';
import type { Role } from '@/lib/contracts';
import { colors, radius, spacing } from '@/theme';

export interface FailedTurnCardProps {
  error: unknown;
  role: Role;
  assistantName: string;
  onRetry: () => void;
  /** Put the question back into the composer to edit it. */
  onEdit: () => void;
}

/** Friendlier wording for AI-specific failures. */
export function aiErrorCopy(error: unknown, assistantName: string): { title: string; message: string } {
  if (isApiRequestError(error)) {
    if (error.kind === 'timeout') {
      return {
        title: `${assistantName} took too long`,
        message: 'The answer is taking longer than expected — evidence services may be slow right now. Please try again.',
      };
    }
    if (error.kind === 'network') {
      return { title: `Can't reach ${assistantName}`, message: errorMessage(error) };
    }
    if (error.status === 429) {
      return { title: 'Too many questions at once', message: 'Please wait a moment, then try again.' };
    }
    if (error.status >= 500) {
      return {
        title: `${assistantName} couldn't answer`,
        message: error.serverMessage || 'The server hit a problem while preparing your answer. Please try again.',
      };
    }
  }
  return { title: `${assistantName} couldn't answer`, message: errorMessage(error) };
}

export function FailedTurnCard({ error, role, assistantName, onRetry, onEdit }: FailedTurnCardProps) {
  const copy = aiErrorCopy(error, assistantName);
  const offline = isNetworkError(error);
  return (
    <View style={styles.card} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.head}>
        <Ionicons name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'} size={20} color={colors.danger} />
        <AppText variant="bodyStrong" style={styles.flex}>
          {copy.title}
        </AppText>
      </View>
      <AppText variant="small" tone="muted">
        {copy.message}
      </AppText>
      <View style={styles.actions}>
        <Button title="Retry" icon="refresh" size="sm" onPress={onRetry} />
        <Button title="Edit question" icon="create-outline" size="sm" variant="outline" onPress={onEdit} />
        {offline ? (
          <Button
            title="Server settings"
            icon="settings-outline"
            size="sm"
            variant="ghost"
            onPress={() => router.push(profileHrefForRole(role))}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerLight,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});
