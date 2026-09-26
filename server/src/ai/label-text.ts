// Helpers that turn FDA label language into something a patient can read.

import type { SectionSummary } from '../evidence/openfda';
import { collapseWhitespace } from '../evidence/text';

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\brenal impairment\b/gi, 'kidney problems'],
  [/\bdeterioration of renal function\b/gi, 'worsening kidney function'],
  [/\brenal (function|failure|disease)\b/gi, 'kidney $1'],
  [/\bacute renal failure\b/gi, 'sudden kidney failure'],
  [/\bantihypertensive (efficacy|effect)\b/gi, 'blood-pressure-lowering effect'],
  [/\bloss of antihypertensive efficacy\b/gi, 'blood pressure medicine not working as well'],
  [/\bhypotension\b/gi, 'low blood pressure'],
  [/\bhyperkalemia\b/gi, 'high potassium'],
  [/\bhypoglycemia\b/gi, 'low blood sugar'],
  [/\bhyperglycemia\b/gi, 'high blood sugar'],
  [/\bhepatic (failure|impairment|dysfunction)\b/gi, 'liver $1'],
  [/\bhepatic\b/gi, 'liver'],
  [/\bmyopathy\b/gi, 'muscle damage (myopathy)'],
  [/\brhabdomyolysis\b/gi, 'severe muscle breakdown (rhabdomyolysis)'],
  [/\bangioedema\b/gi, 'swelling of the face, lips, tongue or throat (angioedema)'],
  [/\bwith concomitant (use|administration) (with|of)\b/gi, 'when used with'],
  [/\b(the )?concomitant (use|administration) of\b/gi, 'using'],
  [/\bco-?administration of\b/gi, 'using'],
  [/\bconcomitant(ly)? (use|administration) with\b/gi, 'using it with'],
  [/\bconcomitant(ly)? (use|administration)\b/gi, 'using them together'],
  [/\bconcomitant(ly)?\b/gi, 'together'],
  [/\bco-?administration\b/gi, 'taking together'],
  [/\bgastrointestinal\b/gi, 'stomach and intestinal'],
  [/\bGI bleeding\b/g, 'stomach or intestinal bleeding'],
  [/\bfetal toxicity\b/gi, 'harm to an unborn baby'],
  [/\bdyspnea\b/gi, 'shortness of breath'],
  [/\bsyncope\b/gi, 'fainting'],
  [/\bpruritus\b/gi, 'itching'],
  [/\bnasopharyngitis\b/gi, 'cold-like symptoms (nasopharyngitis)'],
  [/\barthralgia\b/gi, 'joint pain'],
  [/\bmyalgia\b/gi, 'muscle pain'],
  [/\bdyspepsia\b/gi, 'indigestion'],
  [/\bflatulence\b/gi, 'gas'],
  [/\bsomnolence\b/gi, 'sleepiness'],
  [/\bthrombocytopenia\b/gi, 'low platelets'],
  [/\bneutropenia\b/gi, 'low white blood cells'],
  [/\bhypersensitivity\b/gi, 'allergic reaction'],
  [/\bserum potassium\b/gi, 'potassium level'],
  [/\bglycemic control\b/gi, 'blood sugar control'],
  [/\bacute myocardial infarction\b/gi, 'heart attack'],
  [/\bmyocardial infarction\b/gi, 'heart attack'],
  [/\bcerebrovascular accident\b/gi, 'stroke'],
  [/\bpediatric patients\b/gi, 'children'],
  [/\badult patients\b/gi, 'adults'],
  [/\bdiscontinue\b/gi, 'stop'],
  [/\binitiat(e|ing) (therapy|treatment)\b/gi, 'starting treatment'],
  [/\badjunct therapy\b/gi, 'add-on treatment'],
  // "indicated as an adjunct to diet and exercise" → "indicated along with diet and exercise".
  [/\bas (an )?adjunct to\b/gi, 'along with'],
  [/\ban adjunct to\b/gi, 'an addition to'],
  [/\badjunct to\b/gi, 'in addition to'],
  [/\bNSAIDS\b/g, 'NSAIDs'],
  [/\bpotentiates?\b/gi, 'strengthens'],
  [/\blactate metabolism\b/gi, 'lactic acid levels'],
];

/** Swaps common label jargon for plain words (keeps the original term where it helps). */
export function plainLabel(text: string): string {
  let out = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, (match: string, ...groups: unknown[]) => {
      const captures = groups.slice(0, -2).map((g) => (typeof g === 'string' ? g : ''));
      const value = replacement.replace(/\$(\d)/g, (_m, n: string) => captures[Number(n) - 1] ?? '');
      // Keep sentence-initial capitals ("Discontinue" → "Stop").
      return /^[A-Z][a-z]/.test(match) ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    });
  }
  return collapseWhitespace(
    out
      .replace(/\(incidence\s*[≥>]=?\s*(\d+(?:\.\d+)?)%\)/g, '(in $1% or more of people)')
      // Superscripts flattened by the label feed: "1.73 m 2" → "1.73 m²".
      .replace(/(\d\.\d+)\s?m\s?2\b/g, '$1 m²'),
  );
}

const BOILERPLATE_INTRO = /described (below|elsewhere)|elsewhere in (the )?label|following (important )?adverse reactions|see full prescribing/i;

/** The label's "most common side effects" sentence, when it has one. */
export function commonSideEffects(text: string | undefined): string | null {
  if (!text) return null;
  const match = text.match(/(?:The )?(?:most )?common adverse reactions?(?:[^.:•]|\.\d)*?(?:are|were|include|includes)\b(?:[^.]|\.\d)*\./i);
  if (!match) return null;
  return plainLabel(match[0].replace(/\s*\([^)]*placebo[^)]*\)/i, '').replace(/\s+\d+(\.\d+)?\.?$/, '.').trim());
}

/**
 * Renders a SectionSummary as one readable sentence/line. Items ending in ":" absorb the
 * short items that follow ("relieves minor aches due to: headache, toothache, backache").
 */
export function summaryToText(summary: SectionSummary, options: { plain?: boolean } = {}): string {
  const items = summary.items.map((i) => collapseWhitespace(i)).filter(Boolean);
  if (items.length === 0) return '';
  const parts: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (item.endsWith(':')) {
      const tail: string[] = [];
      while (i + 1 < items.length && items[i + 1]!.length < 60 && !items[i + 1]!.endsWith(':')) tail.push(items[++i]!);
      parts.push(tail.length > 0 ? `${item} ${tail.join(', ')}` : item.replace(/:$/, ''));
    } else parts.push(item);
  }
  const intro = summary.intro && !BOILERPLATE_INTRO.test(summary.intro) ? `${summary.intro} ` : '';
  const body = parts.map((p) => p.replace(/[.;,]$/, '')).join('; ');
  const joined = `${intro}${body}${/[…!?]$/.test(body) ? '' : '.'}`;
  const text = options.plain === false ? joined : plainLabel(joined);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Merges "heading:" items with the short items that follow ("due to: headache, toothache"). */
export function mergeColonItems(items: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!.trim();
    if (item.endsWith(':')) {
      const tail: string[] = [];
      while (i + 1 < items.length && items[i + 1]!.length < 70 && !items[i + 1]!.trim().endsWith(':')) tail.push(items[++i]!.trim());
      out.push(tail.length > 0 ? `${item} ${tail.map((t, n) => (n === 0 ? t.charAt(0).toLowerCase() + t.slice(1) : t.charAt(0).toLowerCase() + t.slice(1))).join(', ')}` : item.replace(/:$/, ''));
    } else out.push(item);
  }
  return out;
}

/** Summary items as "- " bullet lines (intro first, when present). */
export function summaryToLines(summary: SectionSummary, options: { plain?: boolean } = {}): string[] {
  const transform = (s: string) => {
    const t = options.plain === false ? s : plainLabel(s);
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  return mergeColonItems(summary.items.map((item) => collapseWhitespace(item).replace(/[;,]$/, ''))).map(transform);
}

/** True for label intros like "The following adverse reactions are described elsewhere…". */
export function isBoilerplateIntro(intro: string | null | undefined): boolean {
  return Boolean(intro && BOILERPLATE_INTRO.test(intro));
}

/**
 * Interaction items. PLR labels often print interactions as a table flattened to text
 * ("… Clinical Impact: … Intervention: …"); each clinical-impact sentence names the group.
 */
export function interactionItems(text: string | undefined, max = 5): string[] {
  if (!text) return [];
  if (!/Clinical Impact:/i.test(text)) return [];
  return text
    .split(/Clinical Impact:/i)
    .slice(1)
    .map((part) => collapseWhitespace(part.split(/Intervention:|Examples?:/i)[0] ?? ''))
    .map((part) => part.split(/(?<=\.)\s+/)[0] ?? part)
    .filter((part) => part.length > 20)
    .slice(0, max)
    .map((part) => plainLabel(part));
}

/** Removes near-duplicate items (same first 50 normalized characters). */
export function dedupeItems(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/areabiguanide/g, 'are').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
