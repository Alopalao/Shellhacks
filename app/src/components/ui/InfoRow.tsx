import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export interface InfoRowProps {
  label: string;
  /** Text value, or any node. Empty values render an em dash. */
  value?: ReactNode;
  icon?: IoniconName;
  style?: StyleProp<ViewStyle>;
}

/** Read-only "Label ........ value" row for detail screens. */
export function InfoRow({ label, value, icon, style }: InfoRowProps) {
  const isText = typeof value === 'string' || typeof value === 'number' || value == null || value === '';
  return (
    <View style={[styles.row, style]} accessible={isText} accessibilityLabel={isText ? `${label}: ${value || 'not set'}` : undefined}>
      <View style={styles.labelWrap}>
        {icon ? <Ionicons name={icon} size={16} color={colors.textMuted} /> : null}
        <AppText variant="small" tone="muted">
          {label}
        </AppText>
      </View>
      {isText ? (
        <AppText variant="bodyStrong" align="right" style={styles.value}>
          {value === '' || value == null ? '—' : value}
        </AppText>
      ) : (
        <View style={styles.valueNode}>{value}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    minHeight: 40,
    paddingVertical: spacing.xs,
  },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  value: { flex: 1 },
  valueNode: { flexShrink: 1, alignItems: 'flex-end' },
});
