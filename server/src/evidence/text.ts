// Text helpers shared by the evidence clients: entity decoding, HTML → text/blocks,
// sentence-aware truncation and author formatting. Deliberately dependency-free.

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  hellip: '…',
  middot: '·',
  bull: '•',
  deg: '°',
  plusmn: '±',
  le: '≤',
  ge: '≥',
  micro: 'µ',
  reg: '®',
  trade: '™',
  copy: '©',
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

export function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/** Strips tags and decodes entities; block-level tags become spaces. */
export function htmlToText(html: string): string {
  const withBreaks = html.replace(/<\s*(br|\/p|\/li|\/h\d|\/div|\/tr)\s*\/?>/gi, ' ');
  return collapseWhitespace(decodeEntities(withBreaks.replace(/<[^>]*>/g, '')));
}

export type TextBlock = { kind: 'heading' | 'paragraph' | 'item'; text: string };

/**
 * Turns simple HTML (MedlinePlus summaries) into ordered blocks. Text outside <p>/<li>
 * becomes a heading (MedlinePlus puts section questions there, e.g. "What is a stroke?").
 */
export function htmlToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let current: { kind: TextBlock['kind']; parts: string[] } | null = null;
  let loose: string[] = [];

  const flushLoose = () => {
    const text = collapseWhitespace(decodeEntities(loose.join('')));
    loose = [];
    if (text) blocks.push({ kind: 'heading', text });
  };
  const flushCurrent = () => {
    if (!current) return;
    const text = collapseWhitespace(decodeEntities(current.parts.join('')));
    if (text) blocks.push({ kind: current.kind, text });
    current = null;
  };

  const token = /<\s*(\/?)\s*([a-z0-9]+)[^>]*>|([^<]+)/gi;
  for (const match of html.matchAll(token)) {
    const [, closing, rawTag, text] = match;
    if (text !== undefined) {
      if (current) current.parts.push(text);
      else loose.push(text);
      continue;
    }
    const tag = (rawTag ?? '').toLowerCase();
    if (tag === 'p' || tag === 'li') {
      if (closing) flushCurrent();
      else {
        flushLoose();
        flushCurrent();
        current = { kind: tag === 'p' ? 'paragraph' : 'item', parts: [] };
      }
    } else if (/^h\d$/.test(tag)) {
      if (!closing) {
        flushLoose();
        flushCurrent();
      } else {
        flushLoose();
      }
    } else if (tag === 'br' && current) {
      current.parts.push(' ');
    } else if ((tag === 'ul' || tag === 'ol') && !closing) {
      flushLoose();
    }
  }
  flushCurrent();
  flushLoose();
  return blocks;
}

const ABBREVIATIONS = /\b(e\.g|i\.e|vs|etc|approx|Dr|Mr|Mrs|Ms|No|Fig|St|U\.S|mg|mL|Inc|Co|al)\.$/i;

/** Splits prose into sentences (good enough for labels, abstracts and summaries). */
export function splitSentences(text: string): string[] {
  const clean = collapseWhitespace(text);
  if (!clean) return [];
  const pieces = clean.split(/(?<=[.!?])\s+(?=["“(]?[A-Z0-9•])/);
  const sentences: string[] = [];
  for (const piece of pieces) {
    const previous = sentences[sentences.length - 1];
    if (previous && ABBREVIATIONS.test(previous)) sentences[sentences.length - 1] = `${previous} ${piece}`;
    else sentences.push(piece);
  }
  return sentences.map((s) => s.trim()).filter(Boolean);
}

/** Cuts at a word boundary and appends an ellipsis when shortened. */
export function truncateWords(text: string, maxChars: number): string {
  const clean = collapseWhitespace(text);
  if (clean.length <= maxChars) return clean;
  const slice = clean.slice(0, Math.max(0, maxChars - 1));
  const cut = slice.lastIndexOf(' ');
  const base = (cut > maxChars * 0.6 ? slice.slice(0, cut) : slice).replace(/[\s,;:(–—-]+$/, '');
  return `${base}…`;
}

/** Whole sentences up to `maxChars` (always at least one, truncated if needed). */
export function takeSentences(text: string, maxChars: number, maxSentences = 6): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return '';
  const out: string[] = [];
  let length = 0;
  for (const sentence of sentences) {
    if (out.length >= maxSentences) break;
    const added = sentence.length + (out.length > 0 ? 1 : 0);
    if (out.length > 0 && length + added > maxChars) break;
    out.push(sentence);
    length += added;
  }
  const joined = out.join(' ');
  return joined.length > maxChars ? truncateWords(joined, maxChars) : joined;
}

/** "Smith J, et al." style author string from ["Smith J", "Doe A", …]. */
export function formatAuthors(names: string[]): string | undefined {
  const clean = names.map((n) => collapseWhitespace(n)).filter(Boolean);
  if (clean.length === 0) return undefined;
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]}, ${clean[1]}`;
  return `${clean[0]}, et al.`;
}

/** First four-digit year in a date-ish string ("2019 Jan-Feb", "20230818"). */
export function extractYear(value: string | null | undefined): string | undefined {
  const match = value?.match(/(19|20)\d{2}/);
  return match ? match[0] : undefined;
}

/** "lisinopril" → "Lisinopril"; keeps already-mixed-case words. */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join('');
}

/** Removes query strings/fragments used for tracking (utm_*) from a URL. */
export function stripTracking(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (key.startsWith('utm_')) parsed.searchParams.delete(key);
    }
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}
