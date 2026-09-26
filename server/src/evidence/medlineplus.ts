// MedlinePlus: the health-topics search web service (plain-language topic summaries) and
// MedlinePlus Connect (drug information pages keyed by RxNorm RxCUI).

import type { CitationDraft, MedlinePlusDrugPage, MedlinePlusTopic } from './types';
import { buildUrl, type HttpClient } from './http';
import { arr, asRecord, parseJson, rec, str } from './json';
import { collapseWhitespace, decodeEntities, htmlToBlocks, htmlToText, stripTracking, takeSentences } from './text';
import { findAll } from './xml';

const WSEARCH = 'https://wsearch.nlm.nih.gov/ws/query';
const CONNECT = 'https://connect.medlineplus.gov/service';
const RXNORM_OID = '2.16.840.1.113883.6.88';

export const MEDLINEPLUS_PUBLISHER = 'MedlinePlus (National Library of Medicine)';

export class MedlinePlusClient {
  constructor(private readonly http: HttpClient) {}

  async searchTopics(term: string, max = 3): Promise<MedlinePlusTopic[]> {
    const query = collapseWhitespace(term);
    if (!query) return [];
    const url = buildUrl(WSEARCH, { db: 'healthTopics', term: query, retmax: Math.min(Math.max(max, 1), 10) });
    const response = await this.http.get(url, { accept: 'text/xml' });
    if (response.status === 404) return [];
    return parseHealthTopicsXml(response.text).slice(0, max);
  }

  async drugPage(input: { name: string; rxcui?: string | null; form?: string | null }): Promise<MedlinePlusDrugPage | null> {
    const name = collapseWhitespace(input.name);
    if (!name && !input.rxcui) return null;
    const url = buildUrl(CONNECT, {
      'mainSearchCriteria.v.cs': RXNORM_OID,
      'mainSearchCriteria.v.c': input.rxcui ?? undefined,
      'mainSearchCriteria.v.dn': name || undefined,
      'informationRecipient.languageCode.c': 'en',
      knowledgeResponseType: 'application/json',
    });
    const response = await this.http.get(url);
    if (response.status === 404) return null;
    return parseConnectFeed(parseJson(response.text), input.form ?? null);
  }
}

/** Parses the wsearch `nlmSearchResult` XML. Highlight spans are stripped from all fields. */
export function parseHealthTopicsXml(xml: string): MedlinePlusTopic[] {
  const topics: MedlinePlusTopic[] = [];
  for (const doc of findAll(xml, 'document')) {
    const url = doc.attrs.url;
    if (!url) continue;
    const fields = new Map<string, string[]>();
    for (const content of findAll(doc.inner, 'content')) {
      const name = content.attrs.name ?? '';
      // Content is entity-encoded HTML (with <span class="qt0"> highlights): decode, then strip.
      const html = decodeEntities(content.inner);
      const list = fields.get(name) ?? [];
      list.push(html);
      fields.set(name, list);
    }
    const first = (name: string) => fields.get(name)?.[0] ?? '';
    const all = (name: string) => (fields.get(name) ?? []).map((html) => htmlToText(html)).filter(Boolean);
    const summaryHtml = first('FullSummary');
    topics.push({
      title: htmlToText(first('title')),
      url: stripTracking(url),
      altTitles: all('altTitle'),
      groups: all('groupName'),
      snippet: htmlToText(first('snippet')).replace(/\s*\.\.\.\s*$/, '…'),
      summary: htmlToText(summaryHtml),
      blocks: htmlToBlocks(summaryHtml),
      rank: Number.parseInt(doc.attrs.rank ?? '', 10) || topics.length,
    });
  }
  return topics.filter((t) => t.title);
}

/**
 * MedlinePlus Connect drug summaries are plain text whose bullet lists were flattened into
 * runs of spaces ("is used to   reduce the risk …  decrease the amount …"). Restore readable
 * punctuation: list runs become "; "-separated items after a colon.
 */
export function repairConnectSummary(raw: string, title: string): string {
  const text = raw.replace(/\u00a0/g, ' ');
  if (/<[a-z][^>]*>/i.test(text)) return htmlToText(text);
  const pieces = text.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
  let out = pieces[0] ?? '';
  for (const piece of pieces.slice(1)) {
    if (/^[a-z(]/.test(piece)) {
      if (/[:;,]$/.test(out)) out += ` ${piece}`;
      else if (/\bto$|\bfor$|\bwith$/.test(out)) out += `: ${piece}`;
      else out = `${out.replace(/\.$/, '')}; ${piece}`;
    }
    else out += /[.!?:]$/.test(out) ? ` ${piece}` : `. ${piece}`;
  }
  const name = title.split(/\s+/)[0] ?? '';
  if (name.length > 2) {
    out = out.replace(new RegExp(`([a-z)])\\s+(?=${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (?:is|are|comes|works|may|can)\\b)`, 'g'), '$1. ');
  }
  return collapseWhitespace(out);
}

const FORM_WORDS: Array<{ form: RegExp; title: RegExp }> = [
  { form: /inhal|hfa|aerosol|puff|diskus|respiclick/i, title: /oral inhalation|inhalation/i },
  { form: /nasal|nose/i, title: /nasal/i },
  { form: /cream|ointment|lotion|topical|gel/i, title: /topical/i },
  { form: /inject|pen|syringe|vial/i, title: /injection/i },
  { form: /eye|ophthalmic/i, title: /ophthalmic/i },
  { form: /patch|transdermal/i, title: /transdermal/i },
];
const QUALIFIED_TITLE = /nasal|topical|injection|ophthalmic|otic|transdermal|rectal|vaginal|inhalation/i;

export function parseConnectFeed(body: unknown, form: string | null = null): MedlinePlusDrugPage | null {
  const entries = arr(rec(body, 'feed'), 'entry')
    .map((entry) => {
      const title = collapseWhitespace(str(rec(entry, 'title'), '_value') ?? '');
      const link = arr(entry, 'link').map(asRecord).find((l) => l && typeof l.href === 'string');
      const href = link ? str(link, 'href') : null;
      const summaryRaw = str(rec(entry, 'summary'), '_value') ?? '';
      return { title, url: href ? stripTracking(href) : '', summary: repairConnectSummary(summaryRaw, title) };
    })
    .filter((e) => e.title && e.url);
  const drugPages = entries.filter((e) => e.url.includes('/druginfo/'));
  if (drugPages.length === 0) return null;
  const formRule = form ? FORM_WORDS.find((rule) => rule.form.test(form)) : undefined;
  const drug =
    (formRule && drugPages.find((e) => formRule.title.test(e.title))) ??
    (!formRule ? drugPages.find((e) => !QUALIFIED_TITLE.test(e.title)) : undefined) ??
    drugPages[0]!;
  return {
    title: drug.title,
    url: drug.url,
    summary: drug.summary,
    relatedTopics: entries.filter((e) => e !== drug),
  };
}

export function medlinePlusTopicCitation(topic: MedlinePlusTopic): CitationDraft {
  const firstParagraph = topic.blocks.find((b) => b.kind === 'paragraph')?.text ?? topic.snippet;
  return {
    source: 'MedlinePlus',
    title: topic.title,
    url: topic.url,
    publisher: MEDLINEPLUS_PUBLISHER,
    snippet: firstParagraph ? takeSentences(firstParagraph, 300, 3) : undefined,
  };
}

export function medlinePlusDrugCitation(page: MedlinePlusDrugPage): CitationDraft {
  return {
    source: 'MedlinePlus',
    title: `${page.title} — drug information`,
    url: page.url,
    publisher: MEDLINEPLUS_PUBLISHER,
    snippet: page.summary ? takeSentences(page.summary, 300, 3) : undefined,
  };
}
