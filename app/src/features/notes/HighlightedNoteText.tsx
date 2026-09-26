import { Fragment, useMemo } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, fontWeight } from '@/theme';
import { segmentNote, type JargonMatch } from './glossary';

export interface HighlightedNoteTextProps {
  body: string;
  /** Highlight recognised shorthand (default true). */
  highlight?: boolean;
  /** Key of the term currently selected in the decoder. */
  selectedKey?: string | null;
  onSelectTerm?: (match: JargonMatch) => void;
}

/**
 * The clinician's words, verbatim, with recognised shorthand softly highlighted.
 * Tapping a highlighted term selects it (the decoder shows its meaning).
 */
export function HighlightedNoteText({ body, highlight = true, selectedKey, onSelectTerm }: HighlightedNoteTextProps) {
  const segments = useMemo(() => segmentNote(body), [body]);
  return (
    <AppText variant="lead" selectable={Platform.OS === 'web'} style={styles.body}>
      {segments.map((segment, i) => {
        const match = segment.match;
        if (!match || !highlight) return <Fragment key={i}>{segment.text}</Fragment>;
        const selected = selectedKey === match.key;
        return (
          <Text
            key={i}
            onPress={onSelectTerm ? () => onSelectTerm(match) : undefined}
            suppressHighlighting
            style={[styles.term, selected && styles.termSelected]}
          >
            {segment.text}
          </Text>
        );
      })}
    </AppText>
  );
}

const styles = StyleSheet.create({
  body: { lineHeight: 28 },
  term: {
    backgroundColor: colors.yellowLight,
    fontWeight: fontWeight.semibold,
    textDecorationLine: 'underline',
    textDecorationColor: colors.yellowBorder,
  },
  termSelected: { backgroundColor: colors.yellow, textDecorationColor: colors.black },
});
