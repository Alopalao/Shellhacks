// Numbered evidence sources shared by pre-retrieval, tool calls and the mock responder,
// plus the post-processing that keeps [n] markers honest.

import type { Citation } from '../shared/contracts';
import type { CitationDraft } from '../evidence/types';

export class SourceList {
  private readonly items: Citation[] = [];

  /** Adds (or finds, by URL) a source and returns its number as a string ("1", "2", …). */
  add(draft: CitationDraft): string {
    const key = normalizeUrl(draft.url);
    const existing = this.items.find((item) => normalizeUrl(item.url) === key);
    if (existing) return existing.id;
    const citation: Citation = { id: String(this.items.length + 1), ...stripUndefined(draft) };
    this.items.push(citation);
    return citation.id;
  }

  get(id: string): Citation | undefined {
    return this.items.find((item) => item.id === id);
  }

  has(id: string): boolean {
    return this.items.some((item) => item.id === id);
  }

  all(): Citation[] {
    return [...this.items];
  }

  get size(): number {
    return this.items.length;
  }

  /** Numbered list for prompts / tool results. */
  describe(ids?: string[]): string {
    const chosen = ids ? this.items.filter((item) => ids.includes(item.id)) : this.items;
    return chosen.map(describeCitation).join('\n\n');
  }
}

export function describeCitation(citation: Citation): string {
  const meta = [citation.source, citation.publisher, citation.year].filter(Boolean).join(' · ');
  const lines = [`[${citation.id}] ${citation.title}`, `    ${meta}${citation.authors ? ` · ${citation.authors}` : ''}`, `    ${citation.url}`];
  if (citation.snippet) lines.push(`    ${citation.snippet}`);
  return lines.join('\n');
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/^http:\/\//, 'https://').replace(/\/+$/, '').toLowerCase();
}

function stripUndefined(draft: CitationDraft): CitationDraft {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) if (value !== undefined && value !== '') out[key] = value;
  return out as unknown as CitationDraft;
}

/**
 * Normalizes citation groups ("[1, 2]", "[1-3]", "[1][2]") to single "[n]" markers,
 * drops markers that don't match a source, renumbers the cited sources 1..k in order
 * of first use, and returns only those. If nothing is cited, the text is left without
 * markers and the top `fallbackCount` retrieved sources are returned (numbered 1..k).
 */
export function finalizeCitations(
  text: string,
  sources: Citation[],
  fallbackCount = 3,
): { content: string; citations: Citation[] } {
  const known = new Map(sources.map((source) => [source.id, source]));

  // Expand groups like [1, 3] or [2-4] (ranges are capped to avoid abuse).
  const expanded = text.replace(/\[(\d+(?:\s*[-–,]\s*\d+)+)\]/g, (_match, body: string) => {
    const ids: number[] = [];
    for (const part of body.split(',')) {
      const range = part.split(/[-–]/).map((n) => Number.parseInt(n.trim(), 10));
      const [start, end] = range;
      if (start === undefined || Number.isNaN(start)) continue;
      if (end !== undefined && !Number.isNaN(end) && end >= start && end - start <= 10) {
        for (let n = start; n <= end; n++) ids.push(n);
      } else ids.push(start);
    }
    return ids.map((id) => `[${id}]`).join('');
  });

  const order: string[] = [];
  const withValidMarkers = expanded.replace(/\[(\d{1,3})\]/g, (match, id: string) => {
    // Leave obvious non-citations alone (e.g. "[1]" inside a URL or code is unlikely here).
    if (!known.has(id)) return '';
    if (!order.includes(id)) order.push(id);
    return match;
  });

  if (order.length === 0) {
    const fallback = sources.slice(0, fallbackCount).map((source, index) => ({ ...source, id: String(index + 1) }));
    return { content: tidy(withValidMarkers), citations: fallback };
  }

  const renumber = new Map(order.map((oldId, index) => [oldId, String(index + 1)]));
  const content = withValidMarkers.replace(/\[(\d{1,3})\]/g, (_match, id: string) => `[${renumber.get(id) ?? id}]`);
  const citations = order.map((oldId) => ({ ...(known.get(oldId) as Citation), id: renumber.get(oldId) as string }));
  return { content: tidy(dedupeAdjacent(content)), citations };
}

/** "[1][1]" → "[1]". */
function dedupeAdjacent(text: string): string {
  return text.replace(/(\[\d+\])(\s*\1)+/g, '$1');
}

/** Cleans spacing left behind by removed markers. */
function tidy(text: string): string {
  return text
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Removes [n] markers (used for prior assistant turns sent back to the model). */
export function stripCitationMarkers(text: string): string {
  return tidy(text.replace(/\[\d+(?:\s*[-–,]\s*\d+)*\]/g, ''));
}
