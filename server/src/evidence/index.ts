// Evidence layer entry point: one client wrapping PubMed, MedlinePlus, openFDA and RxNorm
// with shared timeouts, caching and NCBI rate limiting. Offline mode returns empty results
// immediately so the AI falls back to its built-in (glossary / triage / safety) content.

import type { Config } from '../config';
import { HttpClient, RateLimiter, type FetchLike, DEFAULT_TIMEOUT_MS } from './http';
import { MedlinePlusClient } from './medlineplus';
import { OpenFdaClient } from './openfda';
import { PubMedClient } from './pubmed';
import { RxNormClient } from './rxnorm';
import type { EvidenceClient, EvidenceSettings } from './types';

export * from './types';
export { EvidenceError, TtlCache, RateLimiter, HttpClient, USER_AGENT } from './http';
export { pubmedCitation, evidenceType, keyFinding, parsePubMedXml, REVIEW_FILTER } from './pubmed';
export {
  medlinePlusTopicCitation,
  medlinePlusDrugCitation,
  parseHealthTopicsXml,
  parseConnectFeed,
  repairConnectSummary,
  MEDLINEPLUS_PUBLISHER,
} from './medlineplus';
export { labelCitation, labelDisplayName, summarizeSection, summarizeBoxedWarning, otcWarningHighlights, cleanLabelText, highlightBullets } from './openfda';
export type { SectionSummary } from './openfda';

export interface EvidenceClientOptions {
  fetch?: FetchLike;
  timeoutMs?: number;
}

export function evidenceSettingsFromConfig(config: Config): EvidenceSettings {
  return {
    offline: config.evidenceOffline,
    ncbiApiKey: config.ncbiApiKey,
    ncbiEmail: config.ncbiEmail,
    openFdaApiKey: config.openFdaApiKey,
  };
}

export function createEvidenceClient(settings: EvidenceSettings, options: EvidenceClientOptions = {}): EvidenceClient {
  const http = new HttpClient({ fetch: options.fetch, timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS });
  // NCBI: ≤3 requests/second without an API key, ≤10 with one.
  const ncbiLimiter = new RateLimiter(settings.ncbiApiKey ? 110 : 350);
  const pubmed = new PubMedClient(http, ncbiLimiter, settings);
  const medlineplus = new MedlinePlusClient(http);
  const openfda = new OpenFdaClient(http, settings);
  const rxnorm = new RxNormClient(http);
  const offline = settings.offline;

  return {
    offline,
    searchPubMed: async (query, opts) => (offline ? [] : pubmed.search(query, opts)),
    searchMedlinePlus: async (term, opts) => (offline ? [] : medlineplus.searchTopics(term, opts?.max ?? 3)),
    medlinePlusDrug: async (input) => (offline ? null : medlineplus.drugPage(input)),
    drugLabel: async (name, opts) => (offline ? null : openfda.findLabel(name, opts)),
    normalizeDrug: async (term) => (offline ? null : rxnorm.normalize(term)),
    rxcuiForName: async (term) => (offline ? null : rxnorm.exactRxcui(term)),
  };
}

/** Which evidence sources are enabled (all of them unless offline; keys only raise limits). */
export function evidenceStatus(config: Pick<Config, 'evidenceOffline'>): {
  pubmed: boolean;
  medlineplus: boolean;
  openfda: boolean;
  rxnorm: boolean;
} {
  const enabled = !config.evidenceOffline;
  return { pubmed: enabled, medlineplus: enabled, openfda: enabled, rxnorm: enabled };
}
