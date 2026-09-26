import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Disclaimer, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import type { Citation, DrugInfoSection } from '@/lib/contracts';
import { colors, radius, spacing } from '@/theme';

export interface DrugInfoPanelProps {
  drugName: string;
}

/** Long FDA label sections are clipped until "Show more". */
const PREVIEW_CHARS = 600;

function openUrl(url: string) {
  Linking.openURL(url).catch(() => undefined);
}

/** FDA label highlights for a drug (GET /api/drugs/info) with collapsible sections and sources. */
export function DrugInfoPanel({ drugName }: DrugInfoPanelProps) {
  const name = drugName.trim();
  const q = useApiQuery(() => api.drugInfo(name), [name], {
    enabled: !!name,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]));

  if (q.loading || (q.refreshing && !q.data)) {
    return <LoadingState label={`Looking up ${name} on the FDA label…`} fill={false} />;
  }
  if (q.error && !q.data) {
    return (
      <ErrorState
        error={q.error}
        title="Drug info isn’t available right now"
        onRetry={() => void q.refresh()}
        compact
      />
    );
  }
  const info = q.data;
  if (!info) return null;

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const aka = info.brandNames.filter((b) => b.toLowerCase() !== info.name.toLowerCase());
  const hasLabel = info.sections.length > 0;
  return (
    <View style={styles.container}>
      <View style={styles.headRow}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{info.name}</AppText>
          {info.genericName && info.genericName.toLowerCase() !== info.name.toLowerCase() ? (
            <AppText variant="small" tone="muted">
              Generic: {info.genericName}
            </AppText>
          ) : null}
          {aka.length ? (
            <AppText variant="small" tone="muted" numberOfLines={2}>
              Also sold as {aka.slice(0, 4).join(', ')}
            </AppText>
          ) : null}
        </View>
        {info.mocked ? (
          <Badge label="Demo data" tone="warning" icon="flask-outline" accessibilityLabel="Demo data: sample information, not the live FDA label" />
        ) : hasLabel ? (
          <Badge label="FDA label" tone="outline" icon="shield-checkmark-outline" />
        ) : null}
      </View>

      {!hasLabel ? (
        <EmptyState
          compact
          icon="document-text-outline"
          title="No label details found"
          message={`We couldn’t find FDA labeling for “${name}”. Your pharmacist can answer questions about it.`}
        />
      ) : (
        <View style={styles.sections}>
          {info.sections.map((section, index) => (
            <InfoSection
              key={`${section.title}-${index}`}
              section={section}
              expanded={open.has(index)}
              onToggle={() => toggle(index)}
            />
          ))}
        </View>
      )}

      {info.citations.length ? (
        <View style={styles.sources}>
          <AppText variant="label" tone="muted">
            Sources
          </AppText>
          {info.citations.map((c) => (
            <SourceLink key={`${c.id}-${c.url}`} citation={c} />
          ))}
        </View>
      ) : null}

      <Disclaimer
        compact
        text={
          hasLabel
            ? "Summarized from official drug labeling. It doesn't replace advice from your doctor or pharmacist — don't change how you take a medicine without asking them."
            : "This doesn't replace advice from your doctor or pharmacist — don't change how you take a medicine without asking them."
        }
      />
    </View>
  );
}

function InfoSection({
  section,
  expanded,
  onToggle,
}: {
  section: DrugInfoSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [full, setFull] = useState(false);
  const text = section.text.trim();
  const long = text.length > PREVIEW_CHARS;
  const shown = long && !full ? `${text.slice(0, PREVIEW_CHARS).trimEnd()}…` : text;
  return (
    <View style={[styles.section, expanded && styles.sectionOpen]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={section.title}
        aria-expanded={expanded}
        accessibilityHint={expanded ? 'Collapses this section' : 'Expands this section'}
        style={({ pressed }) => [styles.sectionHead, pressed && styles.pressed]}
      >
        <AppText variant="bodyStrong" style={styles.flex}>
          {section.title}
        </AppText>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
      </Pressable>
      {expanded ? (
        <View style={styles.sectionBody}>
          <AppText variant="small" selectable>
            {shown}
          </AppText>
          {long ? (
            <Button
              title={full ? 'Show less' : 'Show more'}
              variant="ghost"
              size="sm"
              icon={full ? 'chevron-up' : 'chevron-down'}
              onPress={() => setFull((v) => !v)}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function SourceLink({ citation }: { citation: Citation }) {
  const meta = [citation.source, citation.publisher, citation.year].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={() => openUrl(citation.url)}
      accessibilityRole="link"
      accessibilityLabel={`${citation.title}, ${meta}`}
      accessibilityHint={Platform.OS === 'web' ? 'Opens in a new tab' : 'Opens in your browser'}
      style={({ pressed }) => [styles.source, pressed && styles.pressed]}
    >
      <Ionicons name="open-outline" size={16} color={colors.text} />
      <View style={styles.flex}>
        <AppText variant="small" weight="semibold" numberOfLines={2}>
          {citation.title}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  flex: { flex: 1 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  sections: { gap: spacing.sm },
  section: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionOpen: { borderColor: colors.yellowBorder, backgroundColor: colors.yellowLighter },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  sectionBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.xs },
  pressed: { opacity: 0.8 },
  sources: { gap: spacing.xs },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
});
