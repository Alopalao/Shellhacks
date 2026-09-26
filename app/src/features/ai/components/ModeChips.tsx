// Mode selector: General · Explain my doctor's note · Medications & dosing · Symptoms (patient), or
// Literature · Drug label · Patient-education draft (doctor).
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { AiMode } from '@/lib/contracts';
import { spacing } from '@/theme';
import { visibleModes, type AiPersona } from '../config';

export interface ModeChipsProps {
  persona: AiPersona;
  value: AiMode;
  onChange: (mode: AiMode) => void;
  disabled?: boolean;
}

export function ModeChips({ persona, value, onChange, disabled }: ModeChipsProps) {
  const { width } = useBreakpoint();
  const wrap = width >= 600;
  const options = visibleModes(persona, value);
  const scrollRef = useRef<ScrollView | null>(null);
  const chipX = useRef(new Map<AiMode, number>());
  /** Latest selected mode (layout callbacks can fire with a stale closure on web). */
  const valueRef = useRef(value);
  /** The selected chip hasn't been laid out yet: scroll to it as soon as it is. */
  const pendingScroll = useRef(false);

  const scrollToChip = (x: number) => {
    scrollRef.current?.scrollTo({ x: Math.max(0, x - spacing.lg), animated: true });
  };

  // Keep the selected chip visible when the mode changes programmatically (deep links, restores).
  useEffect(() => {
    valueRef.current = value;
    if (wrap) return;
    const x = chipX.current.get(value);
    if (x === undefined) pendingScroll.current = true;
    else scrollToChip(x);
  }, [value, wrap]);

  const chips = options.map((option) => (
    <View
      key={option.mode}
      onLayout={(e) => {
        const x = e.nativeEvent.layout.x;
        chipX.current.set(option.mode, x);
        if (!wrap && pendingScroll.current && option.mode === valueRef.current) {
          pendingScroll.current = false;
          scrollToChip(x);
        }
      }}
    >
      <Chip
        label={option.label}
        icon={option.icon}
        selected={option.mode === value}
        disabled={disabled}
        onPress={() => onChange(option.mode)}
        accessibilityLabel={`${option.label} mode. ${option.description}`}
      />
    </View>
  ));

  if (wrap) {
    return (
      <View style={styles.wrap} accessibilityLabel="Question type">
        {chips}
      </View>
    );
  }
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={styles.scrollView}
      accessibilityLabel="Question type"
      keyboardShouldPersistTaps="handled"
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.xs },
  scrollView: { flexGrow: 0, marginHorizontal: -spacing.lg },
  scroll: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs + 2 },
});
