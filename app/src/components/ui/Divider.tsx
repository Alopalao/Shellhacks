import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';

export interface DividerProps {
  /** Vertical margin (spacing token). Default `none`. */
  spacing?: keyof typeof spacing | 'none';
  /** Left inset in px (e.g. to align with list text). */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

/** Hairline separator. */
export function Divider({ spacing: space = 'none', inset = 0, style }: DividerProps) {
  const margin = space === 'none' ? 0 : spacing[space];
  return <View style={[styles.line, { marginVertical: margin, marginLeft: inset }, style]} />;
}

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, alignSelf: 'stretch' },
});
