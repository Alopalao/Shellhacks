import type { ReactNode, Ref } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, maxContentWidth, spacing } from '@/theme';

export interface ScreenProps {
  children?: ReactNode;
  /** Wrap content in a ScrollView (default true). Use false for FlatList/chat layouts. */
  scroll?: boolean;
  /** Pull-to-refresh (scroll mode only): pass both. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Horizontal + vertical content padding (default true). */
  padded?: boolean;
  /** Vertical gap between direct children (spacing token, default `lg`). */
  gap?: keyof typeof spacing | 'none';
  /** Safe-area edges (default top/left/right — tab screens get the bottom from the tab bar). */
  edges?: readonly Edge[];
  /** Page background: white (default) or a subtle light-yellow band. */
  background?: 'white' | 'yellow';
  /** Fixed element above the scroll area (e.g. <ScreenHeader />); gets the same padding/max width. */
  header?: ReactNode;
  /** Fixed element below the scroll area (e.g. a chat composer); keyboard-aware. */
  footer?: ReactNode;
  /** Wrap in a KeyboardAvoidingView on iOS (default true). */
  keyboardAvoiding?: boolean;
  /** Content max width in px, or null for full width (default theme.maxContentWidth = 720). */
  maxWidth?: number | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollRef?: Ref<ScrollView>;
  testID?: string;
}

/**
 * Page wrapper: safe area, white background, centered max-width column, optional scroll with
 * pull-to-refresh, fixed header/footer slots.
 *
 *   <Screen header={<ScreenHeader title="Meds" />} refreshing={refreshing} onRefresh={refresh}>…</Screen>
 */
export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  padded = true,
  gap = 'lg',
  edges = ['top', 'left', 'right'],
  background = 'white',
  header,
  footer,
  keyboardAvoiding = true,
  maxWidth = maxContentWidth,
  contentContainerStyle,
  style,
  scrollRef,
  testID,
}: ScreenProps) {
  const bg = background === 'yellow' ? colors.yellowLighter : colors.background;
  const column: ViewStyle = {
    width: '100%',
    maxWidth: maxWidth ?? undefined,
    alignSelf: 'center',
    gap: gap === 'none' ? 0 : spacing[gap],
  };
  const pad: ViewStyle = padded ? { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl } : {};
  const slotPad: ViewStyle = padded ? { paddingHorizontal: spacing.lg } : {};

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, pad]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.black}
            colors={[colors.black]}
            progressBackgroundColor={colors.yellow}
          />
        ) : undefined
      }
    >
      <View style={[column, contentContainerStyle]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad, { paddingBottom: padded ? 0 : undefined }]}>
      <View style={[styles.flex, column, contentContainerStyle]}>{children}</View>
    </View>
  );

  const inner = (
    <>
      {header ? (
        <View style={[styles.slot, slotPad]}>
          <View style={[column, styles.headerSlot]}>{header}</View>
        </View>
      ) : null}
      {body}
      {footer ? (
        <View style={styles.slot}>
          <View style={[column, { gap: 0 }]}>{footer}</View>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: bg }, style]} testID={testID}>
      {keyboardAvoiding && Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  slot: { width: '100%' },
  headerSlot: { paddingTop: spacing.sm, paddingBottom: spacing.xs },
});
