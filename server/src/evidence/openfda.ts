// openFDA drug labels (SPL). Finds the most useful current label for a drug name and
// returns cleaned section text plus a stable DailyMed link.

import type { CitationDraft, DrugLabel, EvidenceSettings, LabelSectionKey } from './types';
import { buildUrl, type HttpClient } from './http';
import { arr, asRecord, firstString, parseJson, rec, str, strings, type JsonRecord } from './json';
import { collapseWhitespace, extractYear, splitSentences, titleCase, truncateWords } from './text';

const LABEL_URL = 'https://api.fda.gov/drug/label.json';

const SECTION_FIELDS: Record<LabelSectionKey, string> = {
  purpose: 'purpose',
  indications: 'indications_and_usage',
  dosage: 'dosage_and_administration',
  boxedWarning: 'boxed_warning',
  warningsAndCautions: 'warnings_and_cautions',
  warnings: 'warnings',
  contraindications: 'contraindications',
  interactions: 'drug_interactions',
  adverseReactions: 'adverse_reactions',
  patientInfo: 'information_for_patients',
  doNotUse: 'do_not_use',
  askDoctor: 'ask_doctor',
  askDoctorOrPharmacist: 'ask_doctor_or_pharmacist',
  stopUse: 'stop_use',
  whenUsing: 'when_using',
  pregnancy: 'pregnancy_or_breast_feeding',
};

export class OpenFdaClient {
  constructor(
    private readonly http: HttpClient,
    private readonly settings: EvidenceSettings,
  ) {}

  private async query(search: string, limit: number): Promise<JsonRecord[]> {
    const url = buildUrl(LABEL_URL, { search, limit, api_key: this.settings.openFdaApiKey || undefined });
    const response = await this.http.get(url);
    if (response.status === 404) return [];
    return arr(parseJson(response.text), 'results')
      .map(asRecord)
      .filter((r): r is JsonRecord => r !== null);
  }

  /** Best label for `name` (generic or brand). Tries exact generic, brand, substance, then RxCUI. */
  async findLabel(
    name: string,
    options: { rxcui?: string | null; preferOtc?: boolean; form?: string | null; extendedRelease?: boolean } = {},
  ): Promise<DrugLabel | null> {
    const term = sanitizeTerm(name);
    if (!term) return null;
    const upper = term.toUpperCase();
    const route = routeForForm(options.form);
    const attempts = [
      ...(route ? [`openfda.generic_name:"${term}" AND openfda.route:"${route}"`] : []),
      ...(options.preferOtc ? [`openfda.generic_name.exact:"${upper}" AND openfda.product_type:"HUMAN OTC DRUG"`] : []),
      `openfda.generic_name.exact:"${upper}"`,
      `openfda.brand_name.exact:"${upper}"`,
      `openfda.substance_name.exact:"${upper}"`,
      ...(options.rxcui ? [`openfda.rxcui.exact:"${options.rxcui}"`] : []),
      `openfda.generic_name:"${term}"`,
      `openfda.brand_name:"${term}"`,
    ];
    const wantsExtended = options.extendedRelease ?? EXTENDED_WORDS.test(`${term} ${options.form ?? ''}`);
    // A later, broader search may find the right release type (the exact-name hits for
    // "metformin" are all extended-release): keep a mismatch only as the last resort.
    let fallback: JsonRecord | null = null;
    for (const search of attempts) {
      const results = await this.query(search, 10);
      const best = pickBestLabel(results, term, options.preferOtc ?? false, formWords(options.form), wantsExtended);
      if (!best) continue;
      if (isExtendedRelease(best) === wantsExtended) return toDrugLabel(best);
      fallback ??= best;
    }
    return fallback ? toDrugLabel(fallback) : null;
  }
}

/** openFDA route for a dosage form, when it narrows the search usefully. */
function routeForForm(form: string | null | undefined): string | null {
  const f = (form ?? '').toLowerCase();
  if (/inhal|hfa|aerosol|puff/.test(f)) return 'RESPIRATORY (INHALATION)';
  if (/nasal/.test(f)) return 'NASAL';
  if (/cream|ointment|lotion|topical|gel/.test(f)) return 'TOPICAL';
  if (/eye|ophthalmic/.test(f)) return 'OPHTHALMIC';
  if (/patch|transdermal/.test(f)) return 'TRANSDERMAL';
  return null;
}

/** Product-text words that indicate the dosage form a patient actually uses. */
function formWords(form: string | null | undefined): string[] | null {
  const f = (form ?? '').toLowerCase();
  if (!f) return null;
  if (/inhal|hfa|aerosol|puff/.test(f)) return ['aerosol', 'hfa', 'inhaler', 'metered'];
  if (/tab/.test(f)) return ['tablet'];
  if (/cap/.test(f)) return ['capsule'];
  if (/solution|liquid|syrup|suspension/.test(f)) return ['solution', 'suspension', 'liquid'];
  if (/cream|ointment|gel|topical/.test(f)) return ['cream', 'ointment', 'gel'];
  if (/patch/.test(f)) return ['patch', 'transdermal'];
  if (/inject|pen|syringe/.test(f)) return ['injection', 'pen', 'syringe'];
  return null;
}

/** Removes characters that would break an openFDA query string. */
export function sanitizeTerm(name: string): string {
  return collapseWhitespace(name.replace(/["\\:()[\]{}^~*?]/g, ' ')).slice(0, 80);
}

const USEFUL_FIELDS = [
  'indications_and_usage',
  'dosage_and_administration',
  'warnings',
  'warnings_and_cautions',
  'drug_interactions',
  'adverse_reactions',
  'ask_doctor',
  'stop_use',
];

/** openFDA returns some scalar fields as strings and most as string arrays. */
const scalar = (obj: unknown, key: string): string | null => str(obj, key) ?? firstString(obj, key);

/** A query or prescription that asks for the extended-release product. */
const EXTENDED_WORDS = /\b(er|xr|xl|sr|cr|la|extended|sustained|controlled|8 ?hr|12 ?hr|24 ?hr)\b/i;
/** Product text of an extended-release label ("Metformin … Extended-Release", "8 HR Arthritis Pain"). */
const EXTENDED_PRODUCT = /extended[- ]release|sustained[- ]release|controlled[- ]release|\b8 ?hr\b|\b8[- ]hour\b|arthritis pain/i;
const EXTENDED_ACRONYM = /\b(ER|XR|XL|SR|CR)\b/;

/** Brand, generic, ingredient box and principal display panel text: what the product actually is. */
function productText(result: JsonRecord, names: string[]): string {
  return [
    ...strings(result, 'spl_product_data_elements'),
    ...strings(result, 'active_ingredient'),
    ...strings(result, 'package_label_principal_display_panel').map((t) => t.slice(0, 400)),
    ...strings(result, 'dosage_forms_and_strengths').map((t) => t.slice(0, 200)),
    ...names,
  ].join(' ');
}

/** Extended-, sustained- or controlled-release product (from its names, ingredient box, display panel or directions). */
function isExtendedRelease(result: JsonRecord): boolean {
  const openfda = rec(result, 'openfda');
  const names = [...strings(openfda, 'brand_name'), ...strings(openfda, 'generic_name')];
  const indications = strings(result, 'indications_and_usage').join(' ');
  const directions = strings(result, 'dosage_and_administration').join(' ');
  return (
    EXTENDED_PRODUCT.test(`${productText(result, names)} ${indications}`) ||
    EXTENDED_ACRONYM.test(`${names.join(' ')} ${strings(result, 'spl_product_data_elements').join(' ')}`) ||
    /\bswallow\b[^.]{0,20}\bwhole\b[^.]{0,40}\b(do not|never) crush\b/i.test(directions)
  );
}

function scoreLabel(result: JsonRecord, term: string, preferOtc: boolean, formHint: string[] | null, wantsExtended = false): number {
  const openfda = rec(result, 'openfda');
  if (!openfda) return -Infinity; // unharmonized labels lack names/links we need
  const lower = term.toLowerCase();
  const generics = strings(openfda, 'generic_name').map((g) => g.toLowerCase());
  const brands = strings(openfda, 'brand_name').map((b) => b.toLowerCase());
  const substances = strings(openfda, 'substance_name');
  const productType = firstString(openfda, 'product_type') ?? '';

  let score = 0;
  score += USEFUL_FIELDS.filter((field) => arr(result, field).length > 0).length * 10;
  if (generics.some((g) => g === lower) || brands.some((b) => b === lower)) score += 25;
  else if (generics.some((g) => g.startsWith(lower))) score += 12;
  if (substances.length === 1) score += 15; // avoid combination products
  else if (substances.length > 1) score -= 10 * (substances.length - 1);
  if (arr(result, 'information_for_patients').length > 0) score += 3;
  const hasBullets = ['drug_interactions', 'indications_and_usage', 'warnings_and_cautions'].some((field) =>
    strings(result, field).some((t) => t.includes('•')),
  );
  if (hasBullets) score += 12; // readable highlights
  const directions = strings(result, 'dosage_and_administration').join(' ');
  const pediatricOnly =
    [...brands, ...generics].some((name) => /child|infant|junior|pediatric|kids|baby/.test(name)) ||
    /not contain (?:directions|complete) .*adult|for children only/i.test(directions);
  if (pediatricOnly) score -= 40;
  const indications = strings(result, 'indications_and_usage').join(' ');
  if (/\b(?:[0-9]|1[0-2]) (?:to|-) (?:[0-9]|1[0-2]) years of age\b/i.test(indications)) score -= 25;
  // Prefer the standard (immediate-release) product unless the query or prescription names ER/XR:
  // a patient on metformin 500 mg twice daily must not get extended-release directions.
  if (isExtendedRelease(result) !== wantsExtended) score -= 30;
  const product = productText(result, [...brands, ...generics]);
  if (formHint && formHint.some((word) => product.toLowerCase().includes(word))) score += 10;
  // With no form given, not a liquid or injectable version (Riomet solution for "metformin").
  if (!formHint && /\b(oral solution|oral suspension|for suspension|injection|syrup|elixir)\b/i.test(product)) score -= 15;
  if (preferOtc && productType.includes('OTC')) score += 8;
  if (!preferOtc && productType.includes('PRESCRIPTION')) score += 2;
  const effective = Number.parseInt(scalar(result, 'effective_time') ?? '0', 10);
  if (Number.isFinite(effective) && effective > 0) score += Math.min(Math.max((effective - 20150000) / 20000, 0), 6);
  return score;
}

function pickBestLabel(results: JsonRecord[], term: string, preferOtc: boolean, formHint: string[] | null, wantsExtended = false): JsonRecord | null {
  let best: JsonRecord | null = null;
  let bestScore = -Infinity;
  for (const result of results) {
    const score = scoreLabel(result, term, preferOtc, formHint, wantsExtended);
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
  }
  return best && bestScore > 0 ? best : null;
}

function toDrugLabel(result: JsonRecord): DrugLabel {
  const openfda = rec(result, 'openfda');
  const setId = scalar(result, 'set_id') ?? firstString(openfda, 'spl_set_id') ?? '';
  const sections: Partial<Record<LabelSectionKey, string>> = {};
  for (const [key, field] of Object.entries(SECTION_FIELDS) as Array<[LabelSectionKey, string]>) {
    const raw = strings(result, field).join(' ');
    const cleaned = cleanLabelText(raw, key);
    if (cleaned) sections[key] = cleaned;
  }
  return {
    setId,
    brandNames: dedupe(strings(openfda, 'brand_name').map(titleCase)),
    genericName: firstString(openfda, 'generic_name')?.toLowerCase() ?? null,
    substances: strings(openfda, 'substance_name'),
    manufacturer: firstString(openfda, 'manufacturer_name'),
    productType: firstString(openfda, 'product_type'),
    effectiveDate: scalar(result, 'effective_time'),
    rxcuis: strings(openfda, 'rxcui'),
    pharmClasses: strings(openfda, 'pharm_class_epc'),
    strength: productStrength(result),
    sections,
    dailyMedUrl: setId
      ? `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${encodeURIComponent(setId)}`
      : 'https://dailymed.nlm.nih.gov/dailymed/',
  };
}

const dedupe = (values: string[]): string[] => [...new Set(values.filter(Boolean))];

/** "Active ingredient (in each caplet) Acetaminophen 500 mg" → "500 mg caplet"; "(in each 5 mL) … 160 mg" → "160 mg per 5 mL". */
export function productStrength(result: JsonRecord): string | null {
  const active = collapseWhitespace(strings(result, 'active_ingredient').join(' '));
  const amount = active.match(/(\d[\d,]*(?:\.\d+)?)\s?(mg|mcg|g|%)(?![a-z])/i);
  if (!amount) return null;
  const unit = `${amount[1]} ${amount[2]!.toLowerCase()}`;
  const each = active.match(/in each ([a-z0-9 .-]{2,40}?)\)/i)?.[1]?.trim().toLowerCase();
  if (!each) return unit;
  return /^\d/.test(each) ? `${unit} per ${each.replace(/\bml\b/, 'mL')}` : `${unit} ${each}`;
}

const OTC_HEADINGS = /^(Uses|Directions|Warnings?|Purposes?|Other information)\b[:\s]*/;
const PLR_HEADING =
  /^(\d+(\.\d+)?\s+)?(INDICATIONS (AND|&) USAGE|DOSAGE (AND|&) ADMINISTRATION|DOSAGE FORMS (AND|&) STRENGTHS|CONTRAINDICATIONS|WARNINGS (AND|&) PRECAUTIONS|ADVERSE REACTIONS|DRUG INTERACTIONS|USE IN SPECIFIC POPULATIONS|PATIENT COUNSELING INFORMATION|OVERDOSAGE|PRECAUTIONS|WARNINGS)\b:?\s*/;

/** Removes section headings, cross-references and report-an-adverse-event boilerplate. */
export function cleanLabelText(raw: string, key?: LabelSectionKey): string {
  let text = collapseWhitespace(raw);
  if (!text) return '';
  // Leading numbered / upper-case section heading: "7 DRUG INTERACTIONS", "INDICATIONS AND USAGE".
  if (key !== 'boxedWarning') {
    text = text.replace(PLR_HEADING, '').trim();
    text = text.replace(/^(\d+(\.\d+)?\s+)?([A-Z][A-Z&,/\- ]{3,}?)(?=\s+(?:[•A-Z][a-z]|[•(]|\d+\.\d))/, '').trim();
  }
  if (key !== 'boxedWarning') {
    text = text.replace(OTC_HEADINGS, '').replace(/^(Drug Interactions|Adverse Reactions|Precautions|General|Clinical Trials Experience)\s+(?=[A-Z])/, '');
  }
  if (key === 'dosage') {
    // OTC "Directions" tables lose their row labels; turn them back into "adults …:" items.
    text = text.replace(
      /\s+((?:adults(?: and children)?(?: \d+ years(?: of age)?(?: and (?:older|over))?)?)|(?:children (?:under|\d+ to \d+) \d* ?years(?: of age)?))(?=\s*(?:•\s*)?(?:take|use|apply|chew|swallow|ask|do not|consult|dissolve|give|shake|spray|inhale|place|insert)\b)/g,
      ' • $1:',
    );
  }
  text = text
    .replace(/\[\s*see [^\]]*\]/gi, '')
    .replace(/\(\s*see [^)]*\)/gi, '')
    .replace(/\(\s*\d+(\.\d+)?(\s*,\s*\d+(\.\d+)?)*\s*\)/g, '')
    .replace(/To report SUSPECTED ADVERSE REACTIONS[\s\S]*?(?:medwatch|1-800-FDA-1088)\.?(\s*or\s+www\.fda\.gov\/medwatch\.?)?/gi, '')
    .replace(/See full prescribing information for complete boxed warning\.?/gi, '')
    .replace(/(\d\.\d+)\s?m\s?2\b/g, '$1 m²')
    .replace(/\b(mg|mcg|mL|g|units?)\/m\s?2\b/g, '$1/m²')
    .replace(/(^|\s)o\s+(?=[A-Z])/g, '; ')
    .replace(/:\s*;\s*/g, ': ')
    .replace(/\.\s*;\s*/g, '. ')
    .replace(/\s+([.,;:])/g, '$1');
  return collapseWhitespace(text);
}

const SUBSECTION = /\s\d+\.\d+\s+[A-Z]/;

/**
 * PLR-format labels open each section with "highlights" (usually "• Heading: text" bullets)
 * before the numbered subsections ("7.1 Diuretics …"). Returns those items, or null.
 */
export function highlightBullets(text: string): { intro: string | null; items: string[] } | null {
  const cut = text.search(SUBSECTION);
  const region = collapseWhitespace(cut > 0 ? text.slice(0, cut) : text);
  if (!region) return null;
  if (region.includes('•')) {
    const [head = '', ...rest] = region.split('•').map((part) => collapseWhitespace(part).replace(/[;,]$/, ''));
    const intro =
      head && head.length < 220 && /(:|\bif|\bwhile|\binclude|\bare|\bis|\bhave)$/i.test(head) ? head.replace(/:?$/, ':') : null;
    const items = (intro || !head ? rest : [head, ...rest])
      .map((item) => item.replace(/\s+[A-Z][A-Za-z ]{2,40}:$/, '').trim())
      .filter(
        (item) =>
          item.length > 2 &&
          !/^for .{2,40} label$/i.test(item) &&
          !/^see full prescribing information/i.test(item) &&
          !/:\s*see boxed warning\.?$/i.test(item),
      );
    return items.length > 0 ? { intro, items } : null;
  }
  // Some labels lost their bullet glyphs: split "Diuretics: … NSAIDS: … Lithium: …" on headings.
  if (cut > 0 && region.length < 1500) {
    const starts = headingStarts(region);
    if (starts.length >= 2) {
      const parts = starts.map((start, i) => region.slice(start, starts[i + 1] ?? region.length).trim()).filter(Boolean);
      const head = region.slice(0, starts[0]).trim();
      return { intro: head && head.length < 220 ? head : null, items: parts };
    }
  }
  return null;
}

const HEADING_JOINER = /^(and|of|or|the|in|with|to|for|on|a|an|&|\/|-|–)$/;

/**
 * Where each "Heading: text" item begins in flattened PLR highlights. A heading is the run of
 * Capitalized words (plus joiners like "and"/"of", and anything in parentheses) right before a
 * colon: "…discontinue treatment Lipid Abnormalities (hypertriglyceridemia, low HDL): Monitor…"
 * starts at "Lipid", and "…tetracyclines Serious Skin Reactions: Monitor…" at "Serious".
 */
function headingStarts(region: string): number[] {
  const starts: number[] = [];
  for (const colon of region.matchAll(/:\s/g)) {
    const words = [...region.slice(0, colon.index).matchAll(/\S+/g)];
    let depth = 0;
    let start: number | null = null;
    for (let i = words.length - 1; i >= 0 && words.length - i <= 16; i--) {
      const word = words[i]![0];
      const closes = (word.match(/\)/g) ?? []).length;
      const opens = (word.match(/\(/g) ?? []).length;
      depth += closes;
      const inParens = depth > 0;
      depth = Math.max(0, depth - opens);
      const bare = word.replace(/[()[\],]/g, '');
      if (i < words.length - 1 && /[.;:!?]$/.test(word)) break; // the previous sentence ended here
      if (!inParens && bare && !/^[A-Z0-9]/.test(bare) && !HEADING_JOINER.test(bare)) break;
      start = words[i]!.index;
    }
    if (start === null) continue;
    // Begin on a capitalized word ("and Serious Skin…" → "Serious Skin…").
    const rest = region.slice(start, colon.index);
    const first = rest.search(/(?:^|\s)[A-Z0-9]/);
    if (first < 0) continue;
    const at = start + first + (/\s/.test(rest[first] ?? '') ? 1 : 0);
    if (!starts.includes(at)) starts.push(at);
  }
  return starts.sort((a, b) => a - b);
}

/** A leftover heading fragment ("Prior", "Use of", "Hypertension (Pseudotumor") rather than an item. */
const isFragment = (item: string): boolean => item.split(/\s+/).length < 3 && !/[.:!?]$/.test(item.trim());

export interface SectionSummary {
  /** Lead-in such as "Lisinopril is an ACE inhibitor indicated for:" (only with highlight items). */
  intro: string | null;
  items: string[];
}

/** Readable excerpt of a label section: highlight items when present, else first sentences. */
export function summarizeSection(text: string | undefined, maxChars: number, maxItems = 5): SectionSummary {
  if (!text) return { intro: null, items: [] };
  const items: string[] = [];
  let used = 0;
  const highlights = highlightBullets(text);
  if (highlights) {
    for (const item of highlights.items.filter((i) => !isFragment(i))) {
      if (items.length >= maxItems || (items.length > 0 && used + item.length > maxChars)) break;
      items.push(truncateWords(item, Math.max(100, maxChars - used)));
      used += item.length;
    }
    if (items.length > 0) return { intro: highlights.intro, items };
  }
  const cut = text.search(SUBSECTION);
  const lead = cut > 0 ? text.slice(0, cut) : text;
  const seen = new Set<string>();
  for (const sentence of splitSentences(lead.length > 40 ? lead : text)) {
    const key = sentence.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    if (items.length >= Math.min(maxItems, 3)) break;
    if (items.length > 0 && used + sentence.length > maxChars) break;
    items.push(truncateWords(sentence, maxChars));
    used += sentence.length;
  }
  return { intro: null, items };
}

/**
 * OTC "Drug Facts" warnings: the first sentence after each named warning
 * ("Allergy alert:", "Stomach bleeding warning:", "Liver warning:" …).
 */
export function otcWarningHighlights(text: string | undefined, maxItems = 4): string[] {
  if (!text) return [];
  const clean = collapseWhitespace(text);
  const out: string[] = [];
  const pattern = /([A-Z][A-Za-z'’ ]{2,40}(?:warning|alert)):\s*/g;
  const matches = [...clean.matchAll(pattern)];
  matches.forEach((match, index) => {
    if (out.length >= maxItems || match.index === undefined) return;
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? clean.length;
    const body = clean.slice(start, end);
    const first = splitSentences(body)[0];
    if (first) out.push(`${match[1]}: ${truncateWords(first, 220)}`);
  });
  return out;
}

/** "Fetal toxicity" + de-duplicated key sentences of a boxed warning. */
export function summarizeBoxedWarning(text: string | undefined, maxChars = 420): { title: string | null; text: string } | null {
  if (!text) return null;
  let body = collapseWhitespace(text).replace(/^WARNINGS?:?\s*/i, '');
  // Upper-case runs are headings ("(A) PREMATURE DISCONTINUATION OF ELIQUIS …", "FETAL TOXICITY").
  const headingPattern = /(?:\(\s*[A-Z0-9]\s*\)\s*)?(?:WARNINGS?:\s*)?\b[A-Z][A-Z0-9,;&/'-]*(?:\s+(?:[-–—]\s+)?[A-Z0-9][A-Z0-9,;&/()'-]*){0,20}\b(?=\s+(?:•|[A-Z][a-z]|\([A-Z0-9]\))|\s*$)/g;
  const titles: string[] = [];
  body = body.replace(headingPattern, (match) => {
    const words = match.replace(/\(\s*[A-Z0-9]\s*\)|WARNINGS?:/g, ' ').trim();
    if (words.split(/\s+/).length < 2 && words.length < 8) return match; // a lone acronym, keep it
    const title = words.toLowerCase().replace(/\s+/g, ' ');
    if (title && !titles.includes(title)) titles.push(title);
    return ' ';
  });
  const seen = new Set<string>();
  const sentences: string[] = [];
  let used = 0;
  for (const raw of splitSentences(body.replace(/•/g, ' '))) {
    const sentence = raw.trim();
    const key = sentence.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (key.length < 8 || seen.has(key)) continue;
    seen.add(key);
    if (sentences.length > 0 && used + sentence.length > maxChars) break;
    sentences.push(sentence);
    used += sentence.length;
  }
  const joined = truncateWords(sentences.join(' '), maxChars);
  const title = titles.slice(0, 2).join('; ') || null;
  return joined ? { title: title ? title.charAt(0).toUpperCase() + title.slice(1) : null, text: joined } : null;
}

export function labelDisplayName(label: DrugLabel): string {
  const generic = label.genericName ? titleCase(label.genericName) : null;
  const brand = label.brandNames[0] ?? null;
  if (generic && brand && brand.toLowerCase() !== generic.toLowerCase()) return `${brand} (${generic})`;
  return generic ?? brand ?? 'Drug';
}

export function labelCitation(label: DrugLabel, snippet?: string): CitationDraft {
  const otc = label.productType?.includes('OTC') ?? false;
  const kind = otc ? 'Drug Facts label' : 'FDA prescribing information';
  // OTC directions count pills, so the strength they're written for matters ("…, 500 mg caplet").
  const strength = otc && label.strength ? `, ${label.strength}` : '';
  return {
    source: 'openFDA',
    title: `${labelDisplayName(label)}${strength} — ${kind}`,
    url: label.dailyMedUrl,
    publisher: 'U.S. Food and Drug Administration (openFDA / DailyMed)',
    year: extractYear(label.effectiveDate),
    snippet: snippet ? truncateWords(snippet, 300) : undefined,
  };
}
