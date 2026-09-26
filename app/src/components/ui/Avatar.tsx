import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { User } from '@/lib/contracts';
import { initials } from '@/lib/format';
import { colors, fontWeight } from '@/theme';
import { AppText } from './AppText';

const doctorPhoto = require('@/assets/images/doctor-avatar.jpg');

export interface AvatarProps {
  /** Renders the bundled doctor photo when `user.avatar === 'doctor-photo'`, else initials on yellow. */
  user?: Pick<User, 'name' | 'avatar'> | null;
  /** Name for initials when no `user` is given. */
  name?: string;
  /** Diameter in px (default 44). */
  size?: number;
  /** true = green dot, false = grey dot, undefined/null = no dot. */
  online?: boolean | null;
  /** Adds a thin ring (useful on yellow backgrounds). */
  ring?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Circular avatar with optional online indicator. */
export function Avatar({ user, name, size = 44, online, ring, accessibilityLabel, style }: AvatarProps) {
  const displayName = user?.name ?? name ?? '';
  const label =
    accessibilityLabel ??
    `${displayName || 'User'}${online == null ? '' : online ? ', online' : ', offline'}`;
  const dot = Math.max(10, Math.round(size * 0.28));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[{ width: size, height: size }, style]}
    >
      {user?.avatar === 'doctor-photo' ? (
        <Image
          source={doctorPhoto}
          style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, ring && styles.ring]}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={[
            styles.circle,
            styles.initials,
            { width: size, height: size, borderRadius: size / 2 },
            ring && styles.ring,
          ]}
        >
          <AppText
            color={colors.textOnYellow}
            style={{ fontSize: Math.round(size * 0.38), lineHeight: Math.round(size * 0.46), fontWeight: fontWeight.bold }}
          >
            {initials(displayName)}
          </AppText>
        </View>
      )}
      {online == null ? null : (
        <OnlineDot online={online} size={dot} style={styles.dotPosition} />
      )}
    </View>
  );
}

export interface OnlineDotProps {
  online: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Green (online) / grey (offline) presence dot with a white ring. Decorative — label the parent. */
export function OnlineDot({ online, size = 10, style }: OnlineDotProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: online ? colors.online : colors.textSubtle,
          borderWidth: Math.max(2, Math.round(size / 5)),
          borderColor: colors.white,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: { overflow: 'hidden' },
  initials: { backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2, borderColor: colors.white },
  dotPosition: { position: 'absolute', right: -1, bottom: -1 },
});
