// Tappable example questions for the current mode.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface SuggestedPromptsProps {
  prompts: readonly string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  title?: string;
}

export function SuggestedPrompts({ prompts, onSelect, disabled, title = 'Try asking' }: SuggestedPromptsProps) {
  if (!prompts.length) return null;
  return (
    <View style={styles.container}>
      <AppText variant="label" tone="muted">
        {title}
      </AppText>
      <View style={styles.list}>
        {prompts.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => onSelect(prompt)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Ask: ${prompt}`}
            accessibilityState={{ disabled: !!disabled }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed, disabled && styles.disabled]}
          >
            <Ionicons name="sparkles-outline" size={16} color={colors.text} />
            <AppText variant="body" style={styles.flex}>
              {prompt}
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  list: { gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pressed: { backgroundColor: colors.yellowLighter, borderColor: colors.yellowBorder },
  disabled: { opacity: 0.5 },
  flex: { flex: 1 },
});
