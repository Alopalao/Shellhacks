// Markdown-lite renderer (SPEC §6): paragraphs (blank-line separated), "- " bullets, "1. " numbered
// steps, **bold**, "### " headings, bare https:// links (tappable), [text](https://…) links, and
// [1]-style citation markers rendered as small yellow chips.
import { Fragment, useMemo, type ReactNode } from 'react';
import { Linking, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fontWeight, spacing } from '@/theme';
import { AppText, textTones, textVariants, type TextTone } from './AppText';

// ───────────────────────── Parsing ─────────────────────────

export type MarkdownBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'numbered'; items: { n: number; text: string }[] };

const HEADING_RE = /^\s{0,3}#{1,6}\s+(.*)$/;
const BULLET_RE = /^\s*[-*•]\s+(.*)$/;
const NUMBERED_RE = /^\s*(\d{1,3})[.)]\s+(.*)$/;

/** Split markdown-lite text into blocks. Exported for previews/tests. */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: MarkdownBlock | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = HEADING_RE.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: (heading[1] ?? '').replace(/\*\*/g, '') });
      continue;
    }
    const bullet = BULLET_RE.exec(line);
    if (bullet && !/^\s*\*\*/.test(line)) {
      flushParagraph();
      const current = list as MarkdownBlock | null;
      if (current?.type === 'bullets') current.items.push(bullet[1] ?? '');
      else {
        flushList();
        list = { type: 'bullets', items: [bullet[1] ?? ''] };
      }
      continue;
    }
    const numbered = NUMBERED_RE.exec(line);
    if (numbered) {
      flushParagraph();
      const current = list as MarkdownBlock | null;
      const item = { n: Number(numbered[1]), text: numbered[2] ?? '' };
      if (current?.type === 'numbered') current.items.push(item);
      else {
        flushList();
        list = { type: 'numbered', items: [item] };
      }
      continue;
    }
    // Continuation of a list item (no blank line in between).
    const current = list as MarkdownBlock | null;
    if (current?.type === 'bullets' && current.items.length) {
      current.items[current.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    if (current?.type === 'numbered' && current.items.length) {
      const last = current.items[current.items.length - 1]!;
      last.text += ` ${line.trim()}`;
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Plain-text version (for list previews): drops markers, bold, citations and link syntax. */
export function stripMarkdown(source: string): string {
  return source
    .replace(/\r\n?/g, '\n')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/\s?\[\d{1,2}(?:\s*[,–-]\s*\d{1,2})*\]/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

type InlineToken =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: InlineToken[] }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'citation'; ids: string[] };

// Order matters: bold, markdown link, citation, bare URL, inline code, italic.
const INLINE_RE =
  /\*\*(.+?)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\[(\d{1,2}(?:\s*[,–-]\s*\d{1,2})*)\]|(https?:\/\/[^\s<>"'`\])]+)|`([^`\n]+)`|\*([^*\s](?:[^*\n]*[^*\s])?)\*/g;

function expandCitationIds(raw: string): string[] {
  const ids: string[] = [];
  for (const part of raw.split(/\s*,\s*/)) {
    const range = /^(\d+)\s*[–-]\s*(\d+)$/.exec(part);
    if (range) {
      const a = Number(range[1]);
      const b = Number(range[2]);
      if (b >= a && b - a < 10) for (let i = a; i <= b; i++) ids.push(String(i));
      else ids.push(String(a), String(b));
    } else if (part.trim()) {
      ids.push(part.trim());
    }
  }
  return ids;
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  const re = new RegExp(INLINE_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push({ type: 'text', text: text.slice(last, m.index) });
    const [whole, bold, linkText, linkUrl, cite, url, code, italic] = m;
    if (bold !== undefined) {
      tokens.push({ type: 'bold', children: parseInline(bold) });
    } else if (linkText !== undefined && linkUrl !== undefined) {
      tokens.push({ type: 'link', text: linkText, url: linkUrl });
    } else if (cite !== undefined) {
      tokens.push({ type: 'citation', ids: expandCitationIds(cite) });
    } else if (url !== undefined) {
      // Trailing punctuation belongs to the sentence, not the URL.
      const trimmed = url.replace(/[.,;:!?]+$/, '');
      tokens.push({ type: 'link', text: trimmed, url: trimmed });
      const rest = url.slice(trimmed.length);
      if (rest) tokens.push({ type: 'text', text: rest });
    } else if (code !== undefined) {
      tokens.push({ type: 'code', text: code });
    } else if (italic !== undefined) {
      tokens.push({ type: 'italic', text: italic });
    } else {
      tokens.push({ type: 'text', text: whole });
    }
    last = m.index + whole.length;
  }
  if (last < text.length) tokens.push({ type: 'text', text: text.slice(last) });
  // Keep a citation chip on the same line as the word before it ("controlled [1]").
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i]!;
    if (t.type === 'text' && tokens[i + 1]!.type === 'citation') t.text = t.text.replace(/ +$/, NBSP);
  }
  return tokens;
}

const NBSP = '\u00A0';
/** Narrow no-break space: pads chips and separates adjacent chips without allowing a line break. */
const NNBSP = '\u202F';

// ───────────────────────── Rendering ─────────────────────────

/** Diameter of the yellow step number in numbered lists. */
const NUMBER_BADGE_SIZE = 22;

export interface MarkdownProps {
  /** Markdown-lite source. */
  text: string;
  /** Base text size. Default `body`. */
  variant?: 'body' | 'small' | 'lead';
  tone?: TextTone;
  /** Called with the citation id ("1") when a [1] chip is tapped. Without it chips are not pressable. */
  onCitationPress?: (id: string) => void;
  /** If given, only these ids render as chips; other [n] markers stay plain text. */
  citationIds?: readonly string[];
  /** Allow text selection (default true on web). */
  selectable?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Renders markdown-lite (lessons, AI replies, notes). */
export function Markdown({
  text,
  variant = 'body',
  tone = 'default',
  onCitationPress,
  citationIds,
  selectable,
  style,
}: MarkdownProps) {
  const blocks = useMemo(() => parseMarkdown(text ?? ''), [text]);
  const base: TextStyle = { ...textVariants[variant], color: textTones[tone] };
  const lineHeight = base.lineHeight ?? 22;
  const allowed = citationIds ? new Set(citationIds) : null;

  const renderTokens = (tokens: InlineToken[], keyPrefix: string): ReactNode[] =>
    tokens.map((t, i) => {
      const key = `${keyPrefix}-${i}`;
      switch (t.type) {
        case 'text':
          return <Fragment key={key}>{t.text}</Fragment>;
        case 'bold':
          return (
            <Text key={key} style={styles.bold}>
              {renderTokens(t.children, key)}
            </Text>
          );
        case 'italic':
          return (
            <Text key={key} style={styles.italic}>
              {t.text}
            </Text>
          );
        case 'code':
          return (
            <Text key={key} style={styles.code}>
              {t.text}
            </Text>
          );
        case 'link':
          return (
            <Text
              key={key}
              style={styles.link}
              accessibilityRole="link"
              onPress={() => {
                Linking.openURL(t.url).catch(() => undefined);
              }}
            >
              {t.text}
            </Text>
          );
        case 'citation': {
          const ids = allowed ? t.ids.filter((id) => allowed.has(id)) : t.ids;
          if (!ids.length) return <Fragment key={key}>{`[${t.ids.join(', ')}]`}</Fragment>;
          return (
            <Fragment key={key}>
              {ids.map((id, idx) => (
                <Fragment key={`${key}-${id}`}>
                  {idx > 0 ? NNBSP : null}
                  <Text
                    style={styles.citation}
                    accessibilityRole={onCitationPress ? 'button' : undefined}
                    accessibilityLabel={`Source ${id}`}
                    onPress={onCitationPress ? () => onCitationPress(id) : undefined}
                    suppressHighlighting
                  >
                    {`${NNBSP}${id}${NNBSP}`}
                  </Text>
                </Fragment>
              ))}
            </Fragment>
          );
        }
      }
    });

  const inline = (content: string, key: string) => (
    <Text style={base} selectable={selectable}>
      {renderTokens(parseInline(content), key)}
    </Text>
  );

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, bi) => {
        const key = `b${bi}`;
        switch (block.type) {
          case 'heading':
            return (
              <AppText key={key} variant="title3" style={bi > 0 ? styles.headingSpaced : null}>
                {block.text}
              </AppText>
            );
          case 'paragraph':
            return <View key={key}>{inline(block.text, key)}</View>;
          case 'bullets':
            return (
              <View key={key} style={styles.list} accessibilityRole="list">
                {block.items.map((item, ii) => (
                  <View key={`${key}-${ii}`} style={styles.listItem}>
                    <View style={[styles.bulletWrap, { height: lineHeight }]}>
                      <View style={styles.bullet} />
                    </View>
                    <View style={styles.flex}>{inline(item, `${key}-${ii}`)}</View>
                  </View>
                ))}
              </View>
            );
          case 'numbered':
            return (
              <View key={key} style={styles.list} accessibilityRole="list">
                {block.items.map((item, ii) => (
                  <View key={`${key}-${ii}`} style={styles.listItem}>
                    {/* Fixed first-line height (like bullets) so the badge sits on line 1 of long steps. */}
                    <View style={[styles.numberWrap, { height: Math.max(lineHeight, NUMBER_BADGE_SIZE) }]}>
                      <View style={styles.numberBadge}>
                        <Text style={styles.numberText}>{item.n}</Text>
                      </View>
                    </View>
                    <View style={styles.flex}>{inline(item.text, `${key}-${ii}`)}</View>
                  </View>
                ))}
              </View>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  flex: { flex: 1 },
  headingSpaced: { marginTop: spacing.xs },
  bold: { fontWeight: fontWeight.bold },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: 'monospace', backgroundColor: colors.surfaceMuted },
  link: { textDecorationLine: 'underline', fontWeight: fontWeight.semibold, color: colors.text },
  citation: {
    backgroundColor: colors.yellow,
    color: colors.textOnYellow,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: fontWeight.bold,
    borderRadius: 6,
    overflow: 'hidden',
  },
  list: { gap: spacing.sm },
  listItem: { flexDirection: 'row', gap: spacing.sm + 2 },
  bulletWrap: { width: 14, alignItems: 'center', justifyContent: 'center' },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.yellow,
    borderWidth: 1,
    borderColor: colors.black,
  },
  numberWrap: { justifyContent: 'center' },
  numberBadge: {
    minWidth: NUMBER_BADGE_SIZE,
    height: NUMBER_BADGE_SIZE,
    paddingHorizontal: 4,
    borderRadius: NUMBER_BADGE_SIZE / 2,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold, color: colors.textOnYellow },
});
