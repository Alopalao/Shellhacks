// Callout at the top of a lesson. emergency = red card with call buttons; warning = amber;
// tip = light yellow.
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { AppText, Button, callNumber, type IoniconName } from '@/components/ui';
import type { LessonCallout as LessonCalloutData } from '@/lessons';
import { colors, radius, spacing } from '@/theme';

interface CalloutLook {
  title: string;
  icon: IoniconName;
  iconColor: string;
  bg: string;
  border: string;
  titleColor: string;
}

const LOOKS: Record<LessonCalloutData['kind'], CalloutLook> = {
  emergency: {
    title: 'Emergency',
    icon: 'alert-circle',
    iconColor: colors.danger,
    bg: colors.dangerLight,
    border: colors.danger,
    titleColor: colors.danger,
  },
  warning: {
    title: 'Important',
    icon: 'warning',
    iconColor: colors.warning,
    bg: colors.warningLight,
    border: colors.warning,
    titleColor: colors.warning,
  },
  tip: {
    title: 'Tip',
    icon: 'bulb',
    iconColor: colors.text,
    bg: colors.yellowLight,
    border: colors.yellowBorder,
    titleColor: colors.text,
  },
};

interface CallAction {
  title: string;
  dial: string;
  label: string;
  icon: IoniconName;
}

const CALL_911: CallAction = { title: 'Call 911', dial: '911', label: 'Call 911 for emergency help', icon: 'call' };
const CALL_988: CallAction = {
  title: 'Call or text 988',
  dial: '988',
  label: 'Call the 988 Suicide and Crisis Lifeline',
  icon: 'heart',
};
const CALL_POISON: CallAction = {
  title: 'Poison Help 1-800-222-1222',
  dial: '18002221222',
  label: 'Call Poison Help at 1-800-222-1222',
  icon: 'flask',
};

/**
 * Call buttons for a callout: emergencies always get 911, plus 988 / Poison Help when the text
 * mentions them. Warnings get buttons only for the numbers they mention.
 */
function callActions(kind: LessonCalloutData['kind'], text: string): CallAction[] {
  if (kind === 'tip') return [];
  const actions: CallAction[] = [];
  if (kind === 'emergency' || /\b911\b/.test(text)) actions.push(CALL_911);
  if (/\b988\b/.test(text)) actions.push(CALL_988);
  if (/1-?800-?222-?1222/.test(text)) actions.push(CALL_POISON);
  return actions;
}

export interface LessonCalloutProps {
  callout: LessonCalloutData;
}

export function LessonCallout({ callout }: LessonCalloutProps) {
  const look = LOOKS[callout.kind] ?? LOOKS.tip;
  const actions = callActions(callout.kind, callout.text);
  return (
    <View
      style={[styles.box, { backgroundColor: look.bg, borderColor: look.border }]}
      accessibilityRole={callout.kind === 'emergency' ? 'alert' : undefined}
    >
      <View style={styles.header}>
        <Ionicons name={look.icon} size={20} color={look.iconColor} />
        <AppText variant="label" color={look.titleColor}>
          {look.title}
        </AppText>
      </View>
      <AppText variant={callout.kind === 'emergency' ? 'bodyStrong' : 'body'}>{callout.text}</AppText>
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((a, i) => (
            <Button
              key={a.dial}
              title={a.title}
              icon={a.icon}
              variant={i === 0 && callout.kind === 'emergency' ? 'danger' : 'outline'}
              size="md"
              onPress={() => callNumber(a.dial)}
              accessibilityLabel={a.label}
              accessibilityHint={Platform.OS === 'web' ? 'Opens your phone app if this device can make calls' : undefined}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});
