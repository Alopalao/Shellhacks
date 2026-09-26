import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Avatar, IconButton } from '@/components/ui';
import type { User } from '@/lib/contracts';
import { displayName } from '@/lib/format';
import { colors, spacing } from '@/theme';
import { PresenceStatus, presenceLabel } from './PresenceStatus';

export interface ChatHeaderProps {
  counterpart: User;
  online: boolean;
  lastSeen: string | null;
  typing: boolean;
  /** Where "Back" goes when this stack has nothing to go back to (deep link / web refresh). */
  backHref: Href;
  /** Extra actions on the right. */
  right?: ReactNode;
  /** Makes the avatar + name tappable (e.g. doctor → patient chart). */
  onPressCounterpart?: () => void;
  counterpartHint?: string;
}

/** Conversation header: back, counterpart avatar with online dot, name and live presence line. */
export function ChatHeader({
  counterpart,
  online,
  lastSeen,
  typing,
  backHref,
  right,
  onPressCounterpart,
  counterpartHint,
}: ChatHeaderProps) {
  const name = displayName(counterpart);
  const specialty = counterpart.role === 'doctor' ? counterpart.doctor?.specialty : undefined;

  const goBack = () => {
    if (router.canDismiss()) router.back();
    else router.replace(backHref);
  };

  const identity = (
    <>
      <Avatar user={counterpart} size={44} online={online} accessibilityLabel="" />
      <View style={styles.titles}>
        <AppText variant="title3" numberOfLines={1}>
          {name}
        </AppText>
        <View style={styles.statusRow}>
          <PresenceStatus online={online} lastSeen={lastSeen} typing={typing} />
          {specialty && !typing ? (
            <AppText variant="small" tone="subtle" numberOfLines={1} style={styles.specialty}>
              · {specialty}
            </AppText>
          ) : null}
        </View>
      </View>
    </>
  );

  const a11yLabel = `${name}${specialty ? `, ${specialty}` : ''}. ${presenceLabel({ online, lastSeen, typing })}`;

  return (
    <View style={styles.header}>
      <IconButton icon="chevron-back" accessibilityLabel="Back" variant="outline" onPress={goBack} />
      {onPressCounterpart ? (
        <Pressable
          onPress={onPressCounterpart}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityHint={counterpartHint}
          style={({ pressed }) => [styles.identity, pressed && styles.pressed]}
        >
          {identity}
        </Pressable>
      ) : (
        <View style={styles.identity} accessible accessibilityRole="header" accessibilityLabel={a11yLabel}>
          {identity}
        </View>
      )}
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
  },
  pressed: { backgroundColor: colors.yellowLighter },
  titles: { flex: 1, gap: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  specialty: { flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
