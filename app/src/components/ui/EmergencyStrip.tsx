import { Ionicons } from '@expo/vector-icons';
import { Linking, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export interface EmergencyContact {
  label: string;
  number: string;
  /** Short headline for tight layouts ("911", "988", "Poison Help"). */
  short: string;
  /** Second line for tight layouts. */
  shortCaption: string;
  /** Digits for the tel: link. */
  dial: string;
  icon: IoniconName;
  description: string;
}

/** US emergency numbers shown everywhere BRIAN gives medical guidance. */
export const EMERGENCY_CONTACTS: readonly EmergencyContact[] = [
  {
    label: 'Emergency',
    number: '911',
    short: '911',
    shortCaption: 'Emergency',
    dial: '911',
    icon: 'call',
    description: 'Life-threatening emergency',
  },
  {
    label: 'Crisis Lifeline',
    number: '988',
    short: '988',
    shortCaption: 'Crisis line',
    dial: '988',
    icon: 'heart',
    description: 'Suicide & mental-health crisis',
  },
  {
    label: 'Poison Help',
    number: '1-800-222-1222',
    short: 'Poison Help',
    shortCaption: '1-800-222-1222',
    dial: '18002221222',
    icon: 'flask',
    description: 'Poisoning or overdose',
  },
];

/** Open the phone dialer (no-op on web/desktop browsers that can't dial). */
export function callNumber(dial: string): void {
  Linking.openURL(`tel:${dial}`).catch(() => undefined);
}

export interface EmergencyStripProps {
  /** Heading above the buttons. */
  title?: string;
  /** Single-row compact layout without descriptions. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 911 / 988 / Poison Help (1-800-222-1222) quick-dial strip. Numbers are always visible (web can't dial). */
export function EmergencyStrip({ title = 'In an emergency', compact = false, style }: EmergencyStripProps) {
  const isWeb = Platform.OS === 'web';
  return (
    <View style={[styles.container, style]} accessibilityRole="summary" accessibilityLabel={title}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={18} color={colors.danger} />
        <AppText variant="label" tone="danger">
          {title}
        </AppText>
      </View>
      <View style={[styles.row, compact && styles.rowCompact]}>
        {EMERGENCY_CONTACTS.map((c) => (
          <Pressable
            key={c.dial}
            onPress={() => callNumber(c.dial)}
            accessibilityRole={isWeb ? 'link' : 'button'}
            accessibilityLabel={`Call ${c.label}, ${c.number}`}
            accessibilityHint={c.description}
            style={({ pressed }) => [
              styles.item,
              compact && styles.itemCompact,
              compact && c.short !== c.number && styles.itemCompactWide,
              pressed && styles.itemPressed,
            ]}
          >
            {compact ? (
              <>
                <View style={styles.compactHead}>
                  <Ionicons name={c.icon} size={14} color={colors.danger} />
                  <AppText variant="label" numberOfLines={1}>
                    {c.short}
                  </AppText>
                </View>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {c.shortCaption}
                </AppText>
              </>
            ) : (
              <>
                <View style={styles.iconCircle}>
                  <Ionicons name={c.icon} size={14} color={colors.white} />
                </View>
                <View style={styles.texts}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {c.number}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {c.label}
                  </AppText>
                </View>
              </>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerLight,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rowCompact: { flexWrap: 'nowrap' },
  item: {
    flexGrow: 1,
    flexBasis: 128,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  itemCompact: {
    flexBasis: 0,
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingHorizontal: spacing.xs,
  },
  itemCompactWide: { flexGrow: 1.45 },
  compactHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  itemPressed: { opacity: 0.8 },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flexShrink: 1 },
});
