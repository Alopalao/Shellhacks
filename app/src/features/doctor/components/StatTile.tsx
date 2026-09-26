import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, type IoniconName } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface StatTileProps {
  icon: IoniconName;
  value: number | string;
  label: string;
  /** Full sentence for screen readers ("2 patients online"). */
  accessibilityLabel: string;
  /** Highlight (light-yellow surface) when the number needs attention. */
  highlight?: boolean;
  /** Small live dot next to the icon (e.g. presence). */
  live?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Compact dashboard number tile. Tappable when `onPress` is set. */
export function StatTile({
  icon,
  value,
  label,
  accessibilityLabel,
  highlight,
  live,
  onPress,
  accessibilityHint,
  style,
}: StatTileProps) {
  const content = (
    <>
      <View style={styles.top}>
        <View style={[styles.iconCircle, highlight && styles.iconCircleHighlight]}>
          <Ionicons name={icon} size={16} color={colors.text} />
        </View>
        {live ? <View style={styles.liveDot} /> : null}
      </View>
      <AppText variant="title1" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={2}>
        {label}
      </AppText>
    </>
  );
  const tileStyle = [styles.tile, highlight ? styles.highlight : styles.plain];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [...tileStyle, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={[...tileStyle, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 112,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  plain: { backgroundColor: colors.white, borderColor: colors.border },
  highlight: { backgroundColor: colors.yellowLight, borderColor: colors.yellowBorder },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellowLight,
  },
  iconCircleHighlight: { backgroundColor: colors.yellow },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.online },
});
