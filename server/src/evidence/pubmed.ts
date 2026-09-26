// PubMed via NCBI E-utilities: esearch (JSON) → efetch (XML with titles, journals,
// authors, publication types and abstracts). Reviews, guidelines and meta-analyses are
// preferred; plain relevance fills any remaining slots.

import type { CitationDraft, EvidenceSettings, PubMedArticle, PubMedSearchOptions } from './types';
import { buildUrl, type HttpClient, type RateLimiter } from './http';
import { arr, parseJson, rec } from './json';
import { extractYear, formatAuthors, splitSentences, takeSentences } from './text';
import { findAll, findFirst, textAt, textOf } from './xml';

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export const REVIEW_FILTER =
  '(review[pt] OR systematic[sb] OR meta-analysis[pt] OR guideline[pt] OR practice guideline[pt])';
/** Leaves out animal-only research (a veterinary CKD guideline is no answer for a person). */
export const HUMANS_FILTER = 'NOT (animals[mh] NOT humans[mh])';

export class PubMedClient {
  constructor(
    private readonly http: HttpClient,
    private readonly limiter: RateLimiter,
    private readonly settings: EvidenceSettings,
  ) {}

  private params(): Record<string, string | undefined> {
    return {
      tool: 'brian',
      email: this.settings.ncbiEmail || undefined,
      api_key: this.settings.ncbiApiKey || undefined,
    };
  }

  /** Ordered PMIDs for an E-utilities query. */
  async esearch(term: string, retmax: number): Promise<string[]> {
    const url = buildUrl(`${EUTILS}/esearch.fcgi`, {
      db: 'pubmed',
      retmode: 'json',
      sort: 'relevance',
      retmax,
      term,
      ...this.params(),
    });
    const response = await this.http.get(url, { limiter: this.limiter });
    const body = parseJson(response.text);
    return arr(rec(body, 'esearchresult'), 'idlist')
      .map((id) => (typeof id === 'string' ? id : null))
      .filter((id): id is string => id !== null && /^\d+$/.test(id));
  }

  async efetch(pmids: string[]): Promise<PubMedArticle[]> {
    if (pmids.length === 0) return [];
    const url = buildUrl(`${EUTILS}/efetch.fcgi`, {
      db: 'pubmed',
      retmode: 'xml',
      rettype: 'abstract',
      id: pmids.join(','),
      ...this.params(),
    });
    const response = await this.http.get(url, { limiter: this.limiter, accept: 'text/xml' });
    const articles = parsePubMedXml(response.text);
    const order = new Map(pmids.map((id, index) => [id, index]));
    return articles.sort((a, b) => (order.get(a.pmid) ?? 99) - (order.get(b.pmid) ?? 99));
  }

  async search(query: string, options: PubMedSearchOptions = {}): Promise<PubMedArticle[]> {
    const max = Math.min(Math.max(options.max ?? 5, 1), 10);
    const base = query.trim();
    if (!base) return [];
    const ids: string[] = [];
    const add = (list: string[]) => {
      for (const id of list) if (!ids.includes(id) && ids.length < max) ids.push(id);
    };
    if (options.preferReviews !== false) {
      add(await this.esearch(`(${base}) AND ${REVIEW_FILTER} AND english[la] AND hasabstract AND 2005:3000[dp] ${HUMANS_FILTER}`, max));
    }
    if (ids.length < max) {
      add(await this.esearch(`(${base}) AND english[la] AND hasabstract ${HUMANS_FILTER}`, max));
    }
    return this.efetch(ids);
  }
}

const CONCLUSION_LABEL = /conclusion|interpretation|summary|implications|recommendation/i;

export function parsePubMedXml(xml: string): PubMedArticle[] {
  const out: PubMedArticle[] = [];
  for (const article of findAll(xml, 'PubmedArticle')) {
    const body = article.inner;
    const pmid = textAt(body, 'PMID');
    const title = textAt(body, 'ArticleTitle').replace(/^\[(.*)\]\.?$/, '$1');
    if (!pmid || !title) continue;

    const journalEl = findFirst(body, 'Journal');
    const journal = journalEl ? textAt(journalEl.inner, 'ISOAbbreviation') || textAt(journalEl.inner, 'Title') : '';
    const pubDate = journalEl ? findFirst(journalEl.inner, 'PubDate') : null;
    const year =
      extractYear(pubDate ? textAt(pubDate.inner, 'Year') || textAt(pubDate.inner, 'MedlineDate') : null) ??
      extractYear(textAt(body, 'ArticleDate'));

    const authors = findAll(findFirst(body, 'AuthorList')?.inner ?? '', 'Author')
      .map((author) => {
        const collective = textAt(author.inner, 'CollectiveName');
        if (collective) return collective;
        const last = textAt(author.inner, 'LastName');
        const initials = textAt(author.inner, 'Initials');
        return last ? `${last}${initials ? ` ${initials}` : ''}` : '';
      })
      .filter(Boolean);

    const sections = findAll(findFirst(body, 'Abstract')?.inner ?? '', 'AbstractText').map((section) => ({
      label: section.attrs.Label ?? section.attrs.NlmCategory ?? '',
      text: textOf(section),
    }));
    const abstract = sections
      .filter((s) => s.text)
      .map((s) => (s.label && sections.length > 1 ? `${capitalizeLabel(s.label)}: ${s.text}` : s.text))
      .join(' ');
    const conclusionSection = [...sections].reverse().find((s) => CONCLUSION_LABEL.test(s.label) && s.text);

    out.push({
      pmid,
      title,
      journal: journal || null,
      year: year ?? null,
      authors,
      publicationTypes: findAll(body, 'PublicationType').map((el) => textOf(el)).filter(Boolean),
      abstract,
      conclusion: conclusionSection?.text ?? null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    });
  }
  return out;
}

const capitalizeLabel = (label: string): string => label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

/** A short label for the evidence type, e.g. "Systematic review". */
export function evidenceType(article: PubMedArticle): string | null {
  const types = article.publicationTypes.map((t) => t.toLowerCase());
  if (types.includes('practice guideline') || types.includes('guideline')) return 'Guideline';
  if (types.includes('meta-analysis')) return 'Meta-analysis';
  if (types.includes('systematic review')) return 'Systematic review';
  if (types.includes('review')) return 'Review';
  if (types.includes('randomized controlled trial')) return 'Randomized trial';
  if (types.includes('consensus statement')) return 'Consensus statement';
  return null;
}

/** A leading connective that only makes sense after the previous sentence ("As a consequence, …"). */
const CONNECTIVE =
  /^(in the meantime|meanwhile|as a (consequence|result)|consequently|therefore|thus|hence|however|moreover|furthermore|in addition|additionally|also|finally|in contrast|similarly|likewise|accordingly|nevertheless|nonetheless|in summary|in conclusion|overall|taken together|to conclude|in short|importantly|notably)\s*,?\s+/i;
/** Sentences that point back at earlier ones ("These findings, together with…"). */
const REFERENTIAL = /^(these|this|such|those|it|they|its|their|both|the latter|the former)\b/i;

const dropConnective = (sentence: string): string => {
  const rest = sentence.replace(CONNECTIVE, '');
  return rest === sentence ? sentence : rest.charAt(0).toUpperCase() + rest.slice(1);
};

/**
 * The article's key finding: the labelled conclusion when present, otherwise the closing
 * sentences of the abstract (where unstructured abstracts usually state their conclusion) —
 * without a dangling "As a consequence," and never starting on "These findings…".
 */
export function keyFinding(article: PubMedArticle, maxChars = 320): string | null {
  if (article.conclusion) return takeSentences(dropConnective(article.conclusion), maxChars, 3);
  const sentences = splitSentences(article.abstract.replace(/^[A-Z][A-Za-z ]{2,30}:\s/, '')).map(dropConnective);
  if (sentences.length === 0) return null;
  if (sentences.length <= 3) return takeSentences(sentences.join(' '), maxChars, 3);
  let closing = sentences.slice(-2);
  while (closing.length > 0 && REFERENTIAL.test(closing[0]!)) closing = closing.slice(1);
  if (closing.length > 0) return takeSentences(closing.join(' '), maxChars, 2);
  // The closing sentences lean on earlier ones: the opening sentence stands on its own.
  const opening = sentences.find((s) => !REFERENTIAL.test(s));
  return opening ? takeSentences(opening, maxChars, 1) : null;
}

export function pubmedCitation(article: PubMedArticle): CitationDraft {
  const finding = keyFinding(article);
  return {
    source: 'PubMed',
    title: article.title,
    url: article.url,
    publisher: article.journal ?? undefined,
    year: article.year ?? undefined,
    authors: formatAuthors(article.authors),
    snippet: finding ?? undefined,
    pmid: article.pmid,
  };
}
