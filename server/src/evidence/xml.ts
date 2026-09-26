// Minimal XML helpers for the well-formed, shallow documents returned by NCBI E-utilities
// and the MedlinePlus web service. Not a general XML parser: elements of the same name
// must not nest inside each other (true for every element we read).

import { collapseWhitespace, decodeEntities } from './text';

export interface XmlElement {
  attrs: Record<string, string>;
  /** Raw inner XML (entities still encoded, child tags intact). */
  inner: string;
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    const name = match[1];
    if (name) attrs[name] = decodeEntities(match[3] ?? match[4] ?? '');
  }
  return attrs;
}

/** All `<tag …>…</tag>` (and self-closing `<tag …/>`) elements, in document order. */
export function findAll(xml: string, tag: string): XmlElement[] {
  const name = escapeRegex(tag);
  const pattern = new RegExp(`<${name}(\\s[^>]*?)?(?:/>|>([\\s\\S]*?)</${name}\\s*>)`, 'g');
  const out: XmlElement[] = [];
  for (const match of xml.matchAll(pattern)) {
    out.push({ attrs: parseAttrs(match[1] ?? ''), inner: match[2] ?? '' });
  }
  return out;
}

export function findFirst(xml: string, tag: string): XmlElement | null {
  return findAll(xml, tag)[0] ?? null;
}

/** Text content of an element: tags removed, entities decoded, whitespace collapsed. */
export function textOf(element: XmlElement | null | undefined): string {
  if (!element) return '';
  const withoutInline = element.inner.replace(/<\/?\s*(i|b|u|em|strong|sup|sub|span|a|mml:[\w]+)(\s[^>]*)?\/?>/gi, '');
  return collapseWhitespace(decodeEntities(withoutInline.replace(/<[^>]*>/g, ' ')));
}

/** Text of the first `<tag>` inside `xml` ('' when missing). */
export function textAt(xml: string, tag: string): string {
  return textOf(findFirst(xml, tag));
}
