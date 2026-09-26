// "Mark complete" button, or a completed state with an undo.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

export interface LessonCompletionProps {
  /** ISO time the lesson was completed, or undefined. */
  completedAt?: string;
  onComplete: () => void;
  onUndo: () => void;
}

export function LessonCompletion({ completedAt, onComplete, onUndo }: LessonCompletionProps) {
  if (!completedAt) {
    return (
      <View style={styles.pending}>
        <Button
          title="Mark complete"
          icon="checkmark-circle-outline"
          size="lg"
          fullWidth
          onPress={onComplete}
          accessibilityHint="Saves this lesson as finished on this device"
        />
        <AppText variant="caption" tone="subtle" align="center">
          Finishing the quiz also marks the lesson complete.
        </AppText>
      </View>
    );
  }
  const when = formatDate(completedAt, { omitCurrentYear: true });
  return (
    <View style={styles.done} accessibilityLiveRegion="polite">
      <View style={styles.doneIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="checkmark" size={22} color={colors.white} />
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">Lesson completed</AppText>
        {when ? (
          <AppText variant="small" tone="muted">
            Finished {when}
          </AppText>
        ) : null}
      </View>
      <Button
        title="Undo"
        variant="ghost"
        size="sm"
        icon="arrow-undo-outline"
        onPress={onUndo}
        accessibilityLabel="Mark lesson as not completed"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pending: { gap: spacing.sm },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.successLight,
  },
  doneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
