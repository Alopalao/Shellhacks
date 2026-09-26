// Triage banner shown above an answer: red for emergencies (911 / 988 / Poison Help quick-dial),
// amber for urgent, subtle for routine/info.
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, EMERGENCY_CONTACTS, Markdown, type IoniconName } from '@/components/ui';
import type { Triage, TriageAction, TriageLevel } from '@/lib/contracts';
import { colors, radius, spacing } from '@/theme';

interface LevelStyle {
  bg: string;
  border: string;
  accent: string;
  icon: IoniconName;
  eyebrow: string;
}

const LEVELS: Record<TriageLevel, LevelStyle> = {
  emergency: {
    bg: colors.dangerLight,
    border: colors.danger,
    accent: colors.danger,
    icon: 'alert-circle',
    eyebrow: 'Emergency — act now',
  },
  urgent: {
    bg: colors.warningLight,
    border: colors.warning,
    accent: colors.warning,
    icon: 'warning',
    eyebrow: 'Get care soon',
  },
  routine: {
    bg: colors.yellowLighter,
    border: colors.yellowBorder,
    accent: colors.text,
    icon: 'information-circle-outline',
    eyebrow: 'Good to know',
  },
  info: {
    bg: colors.surfaceMuted,
    border: colors.border,
    accent: colors.textMuted,
    icon: 'information-circle-outline',
    eyebrow: 'Note',
  },
};

interface ResolvedAction {
  key: string;
  label: string;
  /** Visible number/host (web can't dial, so the number must be readable). */
  detail?: string;
  href: string;
  icon: IoniconName;
  primary: boolean;
}

function digits(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function hostOf(url: string): string | undefined {
  const match = /^https?:\/\/([^/?#]+)/i.exec(url);
  return match?.[1]?.replace(/^www\./, '');
}

/** Server actions first; emergencies always get 911, 988 and Poison Help as well. */
function resolveActions(triage: Triage): ResolvedAction[] {
  const out: ResolvedAction[] = [];
  const seen = new Set<string>();
  const push = (action: ResolvedAction) => {
    if (seen.has(action.key)) return;
    seen.add(action.key);
    out.push(action);
  };
  triage.actions.forEach((action: TriageAction) => {
    if (action.phone) {
      const dial = digits(action.phone);
      if (!dial) return;
      push({
        key: `tel:${dial}`,
        label: action.label,
        detail: action.label.includes(action.phone) ? undefined : action.phone,
        href: `tel:${dial}`,
        icon: 'call',
        primary: dial === '911',
      });
    } else if (action.url) {
      push({
        key: action.url,
        label: action.label,
        detail: hostOf(action.url),
        href: action.url,
        icon: 'open-outline',
        primary: false,
      });
    }
  });
  if (triage.level === 'emergency') {
    EMERGENCY_CONTACTS.forEach((contact) => {
      const label = contact.dial === '911' ? 'Call 911' : contact.dial === '988' ? 'Call or text 988' : `Call ${contact.label}`;
      push({
        key: `tel:${contact.dial}`,
        label,
        detail: label.includes(contact.number) ? contact.label : contact.number,
        href: `tel:${contact.dial}`,
        icon: contact.icon,
        primary: contact.dial === '911',
      });
    });
    // 911 first.
    out.sort((a, b) => Number(b.primary) - Number(a.primary));
  }
  return out;
}

export interface TriageBannerProps {
  triage: Triage;
}

export function TriageBanner({ triage }: TriageBannerProps) {
  const level = LEVELS[triage.level] ?? LEVELS.info;
  const serious = triage.level === 'emergency' || triage.level === 'urgent';
  const actions = resolveActions(triage);
  if (!triage.title && !triage.message && !actions.length) return null;

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: level.bg, borderColor: level.border },
        serious ? styles.boxSerious : styles.boxSubtle,
      ]}
      accessibilityRole={serious ? 'alert' : 'summary'}
      accessibilityLiveRegion={triage.level === 'emergency' ? 'assertive' : 'none'}
    >
      <View style={styles.head}>
        <View style={[styles.iconCircle, serious && { backgroundColor: level.accent }]}>
          <Ionicons name={level.icon} size={serious ? 18 : 20} color={serious ? colors.white : level.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" color={level.accent} weight="bold" style={styles.eyebrow}>
            {level.eyebrow.toUpperCase()}
          </AppText>
          {triage.title ? (
            <AppText variant={serious ? 'title3' : 'bodyStrong'} accessibilityRole="header">
              {triage.title}
            </AppText>
          ) : null}
        </View>
      </View>
      {triage.message ? <Markdown text={triage.message} variant={serious ? 'body' : 'small'} /> : null}
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              onPress={() => {
                Linking.openURL(action.href).catch(() => undefined);
              }}
              accessibilityRole={action.href.startsWith('tel:') ? 'button' : 'link'}
              accessibilityLabel={action.detail ? `${action.label}, ${action.detail}` : action.label}
              style={({ pressed }) => [
                styles.action,
                action.primary && triage.level === 'emergency' ? styles.actionPrimary : styles.actionSecondary,
                !serious && styles.actionSubtle,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={action.icon}
                size={16}
                color={action.primary && triage.level === 'emergency' ? colors.white : level.accent}
              />
              <View style={styles.actionText}>
                <AppText
                  variant="label"
                  color={action.primary && triage.level === 'emergency' ? colors.white : colors.text}
                  numberOfLines={2}
                >
                  {action.label}
                </AppText>
                {action.detail ? (
                  <AppText
                    variant="caption"
                    color={action.primary && triage.level === 'emergency' ? colors.white : colors.textMuted}
                    numberOfLines={1}
                  >
                    {action.detail}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  boxSerious: { borderWidth: 1.5 },
  boxSubtle: { borderWidth: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  eyebrow: { letterSpacing: 0.6 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  action: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  actionPrimary: { backgroundColor: colors.danger, borderColor: colors.danger },
  actionSecondary: { backgroundColor: colors.white, borderColor: colors.border },
  actionSubtle: { minHeight: 44 },
  actionText: { flexShrink: 1 },
  pressed: { opacity: 0.82 },
});
