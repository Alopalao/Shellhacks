// An assistant answer: triage banner, markdown body with tappable [n] citation chips (tap → scroll to
// and highlight the source card), evidence cards, demo-mode footnote and a short disclaimer.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { AppText, Badge, BrandMark, Button, Disclaimer, Markdown } from '@/components/ui';
import type { AiMessage } from '@/lib/contracts';
import { formatMessageTime, pluralize } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { SourceCard } from './SourceCard';
import { TriageBanner } from './TriageBanner';

/** With more sources than this (+1), the list starts collapsed. */
const COLLAPSED_COUNT = 4;
const HIGHLIGHT_MS = 2400;

export interface AssistantMessageProps {
  message: AiMessage;
  assistantName: string;
  disclaimer: string;
  /** Scroll so that `y` (relative to this message's top) is visible. */
  onRequestScroll?: (y: number) => void;
}

export function AssistantMessage({ message, assistantName, disclaimer, onRequestScroll }: AssistantMessageProps) {
  const citations = message.citations ?? [];
  const citationIds = citations.map((c) => c.id);
  const [expanded, setExpanded] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const sourcesY = useRef(0);
  const cardY = useRef(new Map<string, number>());
  const pendingScrollId = useRef<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    },
    [],
  );

  const collapsible = citations.length > COLLAPSED_COUNT + 1;
  const visible = collapsible && !expanded ? citations.slice(0, COLLAPSED_COUNT) : citations;

  const scrollToCard = (id: string): boolean => {
    const y = cardY.current.get(id);
    if (y === undefined) return false;
    onRequestScroll?.(sourcesY.current + y);
    return true;
  };

  const handleCitationPress = (id: string) => {
    setHighlightId(id);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    const index = citations.findIndex((c) => c.id === id);
    if (collapsible && !expanded && index >= COLLAPSED_COUNT) {
      // Reveal the hidden card first; scroll once it has been laid out.
      pendingScrollId.current = id;
      setExpanded(true);
      return;
    }
    if (!scrollToCard(id)) pendingScrollId.current = id;
  };

  const handleCardLayout = (id: string, event: LayoutChangeEvent) => {
    cardY.current.set(id, event.nativeEvent.layout.y);
    if (pendingScrollId.current === id) {
      pendingScrollId.current = null;
      scrollToCard(id);
    }
  };

  const time = formatMessageTime(message.createdAt);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BrandMark variant="icon" size="sm" />
        <AppText variant="bodyStrong">{assistantName}</AppText>
        {time ? (
          <AppText variant="caption" tone="subtle">
            {time}
          </AppText>
        ) : null}
        {message.mocked ? (
          <Badge label="Demo mode" tone="outline" icon="flask-outline" accessibilityLabel="Demo mode answer" />
        ) : null}
      </View>

      {message.triage ? <TriageBanner triage={message.triage} /> : null}

      <Markdown
        text={message.content}
        citationIds={citationIds}
        onCitationPress={citationIds.length ? handleCitationPress : undefined}
        selectable
      />

      {citations.length ? (
        <View
          style={styles.sources}
          onLayout={(e) => {
            sourcesY.current = e.nativeEvent.layout.y;
          }}
          accessibilityRole="list"
          accessibilityLabel={`${pluralize(citations.length, 'source')} for this answer`}
        >
          <View style={styles.sourcesHead}>
            <Ionicons name="shield-checkmark" size={16} color={colors.text} />
            <AppText variant="label">Sources</AppText>
            <AppText variant="caption" tone="subtle" style={styles.flex}>
              {pluralize(citations.length, 'source')} · tap to open
            </AppText>
          </View>
          {visible.map((citation) => (
            <SourceCard
              key={citation.id}
              citation={citation}
              highlighted={highlightId === citation.id}
              onLayout={(e) => handleCardLayout(citation.id, e)}
            />
          ))}
          {collapsible ? (
            <Button
              title={expanded ? 'Show fewer sources' : `Show all ${citations.length} sources`}
              variant="ghost"
              size="sm"
              icon={expanded ? 'chevron-up' : 'chevron-down'}
              onPress={() => setExpanded((v) => !v)}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.noSources}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="muted" style={styles.flex}>
            No external sources were cited for this answer — treat it as general information.
          </AppText>
        </View>
      )}

      {message.mocked ? (
        <View style={styles.demoNote} accessible accessibilityRole="text">
          <Ionicons name="flask-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="muted" style={styles.flex}>
            Demo mode — this answer was assembled from evidence summaries without a language model. Add
            ANTHROPIC_API_KEY on the server for full AI answers.
          </AppText>
        </View>
      ) : null}

      <Disclaimer compact text={disclaimer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1 },
  sources: { gap: spacing.sm, marginTop: spacing.xs },
  sourcesHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  noSources: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs + 2 },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
});
