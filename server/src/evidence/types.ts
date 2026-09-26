import type { Citation } from '../shared/contracts';
import type { TextBlock } from './text';

/** A citation before it is numbered by a SourceList. */
export type CitationDraft = Omit<Citation, 'id'>;

export interface EvidenceSettings {
  /** Skip every outbound call (BRIAN_EVIDENCE_OFFLINE=1). */
  offline: boolean;
  ncbiApiKey?: string;
  ncbiEmail?: string;
  openFdaApiKey?: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  journal: string | null;
  year: string | null;
  authors: string[]; // "Smith J"
  publicationTypes: string[];
  abstract: string; // plain text, labelled sections joined
  /** Last labelled abstract section that looks like a conclusion, if any. */
  conclusion: string | null;
  url: string;
}

export interface MedlinePlusTopic {
  title: string;
  url: string;
  altTitles: string[];
  groups: string[];
  snippet: string;
  summary: string; // plain text
  blocks: TextBlock[]; // structured summary (headings / paragraphs / list items)
  rank: number;
}

export interface MedlinePlusDrugPage {
  title: string;
  url: string;
  summary: string;
  /** Related MedlinePlus health topics returned alongside (e.g. "Blood Pressure Medicines"). */
  relatedTopics: Array<{ title: string; url: string; summary: string }>;
}

export type LabelSectionKey =
  | 'purpose'
  | 'indications'
  | 'dosage'
  | 'boxedWarning'
  | 'warningsAndCautions'
  | 'warnings'
  | 'contraindications'
  | 'interactions'
  | 'adverseReactions'
  | 'patientInfo'
  | 'doNotUse'
  | 'askDoctor'
  | 'askDoctorOrPharmacist'
  | 'stopUse'
  | 'whenUsing'
  | 'pregnancy';

export interface DrugLabel {
  setId: string;
  brandNames: string[];
  genericName: string | null;
  substances: string[];
  manufacturer: string | null;
  productType: string | null; // "HUMAN PRESCRIPTION DRUG" | "HUMAN OTC DRUG"
  effectiveDate: string | null; // YYYYMMDD
  rxcuis: string[];
  pharmClasses: string[];
  /** Cleaned section text (headings and cross-references removed). */
  sections: Partial<Record<LabelSectionKey, string>>;
  dailyMedUrl: string;
}

export interface NormalizedDrug {
  query: string;
  /** Ingredient-level RxCUI when resolvable. */
  rxcui: string;
  /** Ingredient name, e.g. "atorvastatin". */
  name: string;
  /** RxNorm term type of the matched input concept (IN, BN, SCD, …). */
  inputTty: string | null;
  brandNames: string[];
}

export interface PubMedSearchOptions {
  max?: number;
  /** Prefer reviews / guidelines / meta-analyses (falls back to plain relevance). Default true. */
  preferReviews?: boolean;
}

export interface EvidenceClient {
  readonly offline: boolean;
  searchPubMed(query: string, options?: PubMedSearchOptions): Promise<PubMedArticle[]>;
  searchMedlinePlus(term: string, options?: { max?: number }): Promise<MedlinePlusTopic[]>;
  medlinePlusDrug(input: { name: string; rxcui?: string | null; /** dosage form, picks e.g. "Oral Inhalation" */ form?: string | null }): Promise<MedlinePlusDrugPage | null>;
  drugLabel(
    name: string,
    options?: { rxcui?: string | null; preferOtc?: boolean; /** e.g. "tablet", "inhaler" */ form?: string | null },
  ): Promise<DrugLabel | null>;
  normalizeDrug(term: string): Promise<NormalizedDrug | null>;
  /** RxCUI when `term` is exactly (or normalized-exactly) an RxNorm concept name. */
  rxcuiForName(term: string): Promise<string | null>;
}
