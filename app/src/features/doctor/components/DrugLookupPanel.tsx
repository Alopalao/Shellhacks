import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import type { DrugInfo } from '@/lib/contracts';
import { colors, radius, spacing } from '@/theme';
import { topWarnings } from '../drug-info';
import { titleCase } from '../format';

export type DrugLookupState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'error'; query: string; error: unknown }
  | { status: 'done'; query: string; info: DrugInfo };

export interface DrugLookupPanelProps {
  state: DrugLookupState;
  onRetry: () => void;
  /** Offered when the label's generic name differs from what was typed. */
  onUseName?: (name: string) => void;
  currentName: string;
}

/** Inline result of "Look up": names, top label warnings and sources (openFDA via /api/drugs/info). */
export function DrugLookupPanel({ state, onRetry, onUseName, currentName }: DrugLookupPanelProps) {
  if (state.status === 'idle') return null;

  if (state.status === 'loading') {
    return (
      <Card variant="muted" padding="md" style={styles.row}>
        <ActivityIndicator color={colors.black} />
        <AppText variant="small" tone="muted" accessibilityLiveRegion="polite">
          Looking up “{state.query}” in FDA labeling…
        </AppText>
      </Card>
    );
  }

  if (state.status === 'error') {
    return (
      <Card variant="muted" padding="md" style={styles.gap}>
        <View style={styles.row} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
          <AppText variant="small" style={styles.flex}>
            Couldn't look up “{state.query}”. {errorMessage(state.error)}
          </AppText>
        </View>
        <Button title="Try again" icon="refresh" size="sm" variant="outline" onPress={onRetry} />
      </Card>
    );
  }

  const { info } = state;
  const warnings = topWarnings(info);
  const generic = info.genericName ? titleCase(info.genericName) : null;
  const offerGeneric = generic && onUseName && generic.toLowerCase() !== currentName.trim().toLowerCase();
  const sources = info.citations.slice(0, 2);

  return (
    <Card variant="yellow" padding="md" style={styles.gap}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{titleCase(info.name || state.query)}</AppText>
          <AppText variant="small" tone="muted">
            {generic ? `Generic: ${generic}` : 'Generic name not listed'}
          </AppText>
        </View>
        {info.mocked ? <Badge label="Demo data" tone="outline" icon="flask-outline" /> : null}
      </View>

      {info.brandNames.length ? (
        <AppText variant="small">
          <AppText variant="small" weight="semibold">
            Brands:{' '}
          </AppText>
          {info.brandNames.slice(0, 6).join(', ')}
          {info.brandNames.length > 6 ? ` +${info.brandNames.length - 6} more` : ''}
        </AppText>
      ) : null}

      {offerGeneric ? (
        <Button
          title={`Use “${generic}”`}
          icon="swap-horizontal"
          size="sm"
          variant="outline"
          onPress={() => onUseName?.(generic)}
          accessibilityLabel={`Use the generic name ${generic}`}
        />
      ) : null}

      {warnings.length ? (
        <View style={styles.warning} accessible accessibilityLabel={`Top label warnings: ${warnings.join('. ')}`}>
          <View style={styles.row}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <AppText variant="label" tone="warning">
              Top warnings
            </AppText>
          </View>
          {warnings.map((line) => (
            <View key={line} style={styles.bullet}>
              <AppText variant="small" tone="muted">
                •
              </AppText>
              <AppText variant="small" style={styles.flex}>
                {line}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="small" tone="muted">
          No warnings section was found in the label summary.
        </AppText>
      )}

      {sources.length ? (
        <View style={styles.sources}>
          {sources.map((c) => (
            <Pressable
              key={`${c.id}-${c.url}`}
              onPress={() => void Linking.openURL(c.url).catch(() => undefined)}
              accessibilityRole="link"
              accessibilityLabel={`Open source: ${c.title} (${c.source})`}
              hitSlop={6}
              style={({ pressed }) => [styles.source, pressed && styles.pressed]}
            >
              <Ionicons name="open-outline" size={14} color={colors.text} />
              <AppText variant="caption" numberOfLines={1} style={styles.flexShrink}>
                {c.source}: {c.title}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      <AppText variant="caption" tone="muted">
        Summary of FDA labeling for reference — confirm dosing and interactions against the full label.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gap: { gap: spacing.sm },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  warning: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  bullet: { flexDirection: 'row', gap: spacing.sm },
  sources: { gap: spacing.xs },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  pressed: { opacity: 0.7 },
});
