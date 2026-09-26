import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, type IoniconName } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface QuickAction {
  key: string;
  label: string;
  caption: string;
  icon: IoniconName;
  onPress: () => void;
  /** Small count shown on the tile (e.g. unread messages). */
  badge?: number;
}

/** Grid of large shortcut tiles (2 per row on phones, 4 on wide screens). */
export function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <View style={styles.grid}>
      {actions.map((a) => (
        <Pressable
          key={a.key}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.badge ? `${a.label}, ${a.badge} new` : a.label}
          accessibilityHint={a.caption}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.iconTile}>
            <Ionicons name={a.icon} size={22} color={colors.textOnYellow} />
            {a.badge ? (
              <View style={styles.badge}>
                <AppText variant="caption" weight="bold" tone="inverse" style={styles.badgeText}>
                  {a.badge > 99 ? '99+' : a.badge}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {a.label}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {a.caption}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 112,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pressed: { backgroundColor: colors.yellowLighter, borderColor: colors.yellowBorder },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.black,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
