import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { profileHrefForRole, useAuth } from '@/lib/auth';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { IconButton } from './IconButton';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Small label above the title ("Good morning"). */
  eyebrow?: string;
  /**
   * Show a back button. `true` → router.back(); an Href → go back if this stack can, else replace
   * with that route (deep links / web refresh).
   */
  back?: boolean | Href;
  /** Custom back handler (overrides `back` behaviour). */
  onBack?: () => void;
  /** Right-side slot (buttons, badges). Rendered before the profile avatar. */
  right?: ReactNode;
  /** Show the signed-in user's avatar button → profile (default: true when there is no back button). */
  showProfile?: boolean;
  /** Title size: `large` (title1, tab roots — default without back) or `default` (title2). */
  size?: 'large' | 'default';
  style?: StyleProp<ViewStyle>;
}

/** Screen title row with optional back button, right slot and avatar → profile. */
export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  back,
  onBack,
  right,
  showProfile,
  size,
  style,
}: ScreenHeaderProps) {
  const { user } = useAuth();
  const hasBack = !!back || !!onBack;
  const profile = showProfile ?? !hasBack;
  const large = (size ?? (hasBack ? 'default' : 'large')) === 'large';

  const handleBack = () => {
    if (onBack) return onBack();
    if (typeof back === 'string' || (typeof back === 'object' && back)) {
      if (router.canDismiss()) router.back();
      else router.replace(back);
      return;
    }
    if (router.canGoBack()) router.back();
    else if (user) router.replace(user.role === 'doctor' ? '/doctor' : '/patient');
  };

  return (
    <View style={[styles.row, style]}>
      {hasBack ? (
        <IconButton icon="chevron-back" accessibilityLabel="Back" variant="outline" onPress={handleBack} />
      ) : null}
      <View style={styles.titles}>
        {eyebrow ? (
          <AppText variant="small" tone="muted" numberOfLines={1}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant={large ? 'title1' : 'title2'} numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
      {profile && user ? (
        <Pressable
          onPress={() => router.push(profileHrefForRole(user.role))}
          accessibilityRole="button"
          accessibilityLabel="Open your profile and settings"
          hitSlop={4}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
        >
          <Avatar user={user} size={40} accessibilityLabel="" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 },
  titles: { flex: 1, gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  pressed: { opacity: 0.8 },
});
