// "Ask BRIAN" follow-up chips → BRIAN AI with the lesson as context (auto-sent).
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SectionHeader } from '@/components/ui';
import type { Lesson } from '@/lessons';
import { colors, radius, spacing } from '@/theme';
import { askBrianHref, lessonPrompts } from './helpers';

export interface AskBrianPromptsProps {
  lesson: Lesson;
}

export function AskBrianPrompts({ lesson }: AskBrianPromptsProps) {
  const prompts = lessonPrompts(lesson);
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Ask BRIAN"
        icon="sparkles-outline"
        subtitle="Your AI health guide answers in plain language, with sources."
      />
      <View style={styles.list}>
        {prompts.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => router.push(askBrianHref(lesson, prompt))}
            accessibilityRole="button"
            accessibilityLabel={`Ask BRIAN: ${prompt}`}
            accessibilityHint="Opens BRIAN AI and sends this question"
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <View style={styles.icon}>
              <Ionicons name="sparkles" size={14} color={colors.textOnYellow} />
            </View>
            <AppText variant="bodyStrong" style={styles.text}>
              {prompt}
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={colors.text} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  list: { gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.yellowBorder,
    backgroundColor: colors.yellowLighter,
  },
  pressed: { backgroundColor: colors.yellowLight, borderColor: colors.yellow },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
});
