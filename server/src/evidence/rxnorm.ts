// RxNorm (RxNav REST) — normalizes a drug name or brand to its ingredient concept and
// collects single-ingredient brand names.

import type { NormalizedDrug } from './types';
import { buildUrl, type HttpClient } from './http';
import { arr, asRecord, parseJson, rec, str, strings } from './json';
import { collapseWhitespace } from './text';

const RXNAV = 'https://rxnav.nlm.nih.gov/REST';
const INGREDIENT_TTYS = new Set(['IN', 'PIN', 'MIN']);
/**
 * Term types that name a medicine: ingredients, brands, and clinical/branded drugs and packs.
 * Dose-form groups ("Pill" = DFG), dose forms ("Injection" = DF) and the like are not drugs.
 */
const DRUG_TTYS = new Set(['IN', 'PIN', 'MIN', 'BN', 'SCD', 'SBD', 'SCDC', 'SBDC', 'SCDF', 'SBDF', 'GPCK', 'BPCK']);

/** Words RxNorm knows as concepts that are almost never meant as a drug in chat. */
const NON_DRUG_WORDS = new Set([
  'water', 'sugar', 'salt', 'gold', 'alcohol', 'oxygen', 'air', 'coffee', 'tea', 'milk', 'honey', 'rice',
  'corn', 'wheat', 'egg', 'eggs', 'peanut', 'soy', 'fish', 'beef', 'pork', 'chicken', 'food', 'juice',
  'vinegar', 'glucose', 'protein', 'fiber', 'fat', 'sun', 'light', 'heat', 'ice', 'sleep', 'blood', 'urine',
  // Dose forms and generic words for medicine.
  'pill', 'pills', 'tablet', 'tablets', 'tab', 'tabs', 'capsule', 'capsules', 'cap', 'caps', 'caplet', 'caplets',
  'gelcap', 'gelcaps', 'softgel', 'softgels', 'cream', 'creams', 'ointment', 'lotion', 'gel', 'injection', 'injections',
  'shot', 'shots', 'drops', 'drop', 'patch', 'patches', 'spray', 'liquid', 'syrup', 'solution', 'suspension', 'powder',
  'gummy', 'gummies', 'vitamin', 'vitamins', 'medicine', 'medicines', 'medication', 'medications', 'meds', 'drug',
  'drugs', 'dose', 'doses', 'inhaler', 'lozenge', 'lozenges', 'suppository', 'chewable', 'oral', 'topical',
]);

export class RxNormClient {
  constructor(private readonly http: HttpClient) {}

  private async json(path: string, params: Record<string, string | number | undefined> = {}): Promise<unknown> {
    const response = await this.http.get(buildUrl(`${RXNAV}${path}`, params));
    return response.status === 404 ? null : parseJson(response.text);
  }

  /** RxCUI when `term` names a medicine concept (not a dose form such as "pills" or "injection"). */
  async exactRxcui(term: string): Promise<string | null> {
    const name = collapseWhitespace(term).toLowerCase();
    if (!name || NON_DRUG_WORDS.has(name)) return null;
    const body = await this.json('/rxcui.json', { name, search: 2 });
    const rxcui = strings(rec(body, 'idGroup'), 'rxnormId')[0] ?? null;
    if (!rxcui) return null;
    const props = await this.properties(rxcui);
    return props && DRUG_TTYS.has(props.tty) ? rxcui : null;
  }

  async approximateRxcui(term: string): Promise<string | null> {
    const body = await this.json('/approximateTerm.json', { term, maxEntries: 4, option: 1 });
    const candidates = arr(rec(body, 'approximateGroup'), 'candidate').map(asRecord);
    for (const candidate of candidates) {
      const rxcui = str(candidate, 'rxcui');
      const score = Number.parseFloat(str(candidate, 'score') ?? '0');
      if (rxcui && score >= 5) return rxcui;
    }
    return null;
  }

  async properties(rxcui: string): Promise<{ name: string; tty: string } | null> {
    const body = await this.json(`/rxcui/${encodeURIComponent(rxcui)}/properties.json`);
    const props = rec(body, 'properties');
    const name = str(props, 'name');
    const tty = str(props, 'tty');
    return name && tty ? { name, tty } : null;
  }

  async related(rxcui: string, ttys: string[]): Promise<Array<{ rxcui: string; name: string; tty: string }>> {
    const body = await this.json(`/rxcui/${encodeURIComponent(rxcui)}/related.json`, { tty: ttys.join(' ') });
    const out: Array<{ rxcui: string; name: string; tty: string }> = [];
    for (const group of arr(rec(body, 'relatedGroup'), 'conceptGroup')) {
      for (const concept of arr(group, 'conceptProperties')) {
        const id = str(concept, 'rxcui');
        const name = str(concept, 'name');
        const tty = str(concept, 'tty');
        if (id && name && tty) out.push({ rxcui: id, name, tty });
      }
    }
    return out;
  }

  /** Brand names of single-ingredient branded products ("lisinopril 10 MG Oral Tablet [Zestril]"). */
  async brandNames(ingredientRxcui: string): Promise<string[]> {
    const products = await this.related(ingredientRxcui, ['SBD']);
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.name.includes(' / ')) continue;
      const brand = product.name.match(/\[([^\]]+)\]\s*$/)?.[1];
      if (brand) counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([brand]) => brand)
      .slice(0, 6);
  }

  async normalize(term: string): Promise<NormalizedDrug | null> {
    const query = collapseWhitespace(term);
    if (!query) return null;
    const matched = (await this.exactRxcui(query)) ?? (await this.approximateRxcui(query));
    if (!matched) return null;
    const props = await this.properties(matched);
    if (!props) return null;

    let ingredient = INGREDIENT_TTYS.has(props.tty) ? { rxcui: matched, name: props.name } : null;
    if (!ingredient) {
      const related = await this.related(matched, ['IN', 'MIN', 'PIN']);
      const pick = related.find((r) => r.tty === 'IN') ?? related.find((r) => r.tty === 'MIN') ?? related[0];
      if (pick) ingredient = { rxcui: pick.rxcui, name: pick.name };
    }
    if (!ingredient) return null;

    const brands: string[] = await this.brandNames(ingredient.rxcui).catch((): string[] => []);
    if (props.tty === 'BN' && !brands.some((b) => b.toLowerCase() === props.name.toLowerCase())) brands.unshift(props.name);
    return { query, rxcui: ingredient.rxcui, name: ingredient.name.toLowerCase(), inputTty: props.tty, brandNames: brands };
  }
}

export const rxnavUrl = (rxcui: string): string =>
  `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${encodeURIComponent(rxcui)}`;
