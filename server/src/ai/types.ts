import type { AiMode, Prescription, Role, VisitNote } from '../shared/contracts';
import type { SourceList } from './citations';
import type { TriageResult } from './triage';
import type { DrugClass } from './drugs';
import type { DrugLabel, MedlinePlusDrugPage, MedlinePlusTopic, NormalizedDrug, PubMedArticle } from '../evidence/types';

/** Health context for the person the conversation is about (the patient). */
export interface PatientContext {
  name: string;
  dateOfBirth: string | null;
  conditions: string[];
  allergies: string[];
  /** Active + paused prescriptions and self-reported items. */
  medications: Prescription[];
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Everything the responders (LLM or mock) need for one reply. */
export interface ChatInput {
  message: string;
  mode: AiMode;
  role: Role;
  /** Display name of the signed-in user. */
  userName: string;
  patient: PatientContext | null;
  note: Pick<VisitNote, 'title' | 'body' | 'createdAt'> | null;
  prescription: Prescription | null;
  drugName: string | null;
  lessonTitle: string | null;
  /** Earlier turns of this conversation (oldest first, without the current message). */
  history: ChatTurn[];
}

export interface DrugEvidence {
  /** Generic name, lower case. */
  name: string;
  displayName: string;
  /** Why it was looked up. */
  role: 'asked' | 'patient-med' | 'note';
  normalized: NormalizedDrug | null;
  label: DrugLabel | null;
  medline: MedlinePlusDrugPage | null;
  classes: DrugClass[];
  /** The matching prescription when this is one of the patient's medicines. */
  prescription: Prescription | null;
}

export interface InteractionFinding {
  /** Drug whose FDA label contains the warning. */
  labelDrug: string;
  /** The other drug it concerns. */
  otherDrug: string;
  /** How the label refers to it: the drug name, or a class ("NSAIDs"). */
  via: string;
  viaClass: boolean;
  /** Label wording (cleaned). */
  text: string;
  sourceId: string;
}

export interface ConditionFinding {
  drug: string;
  condition: string;
  plainCondition: string;
  text: string;
  sourceId: string;
}

export interface AllergyFinding {
  drug: string;
  allergy: string;
  reason: string;
}

export interface EvidenceBundle {
  sources: SourceList;
  drugs: DrugEvidence[];
  topics: Array<{ topic: MedlinePlusTopic; sourceId: string }>;
  articles: Array<{ article: PubMedArticle; sourceId: string }>;
  /** Static reference pages backing triage guidance (verified URLs). */
  triageSourceIds: string[];
  interactions: InteractionFinding[];
  conditionWarnings: ConditionFinding[];
  allergyWarnings: AllergyFinding[];
  /** Lookups that failed (network/timeouts) — the answer should say evidence was limited. */
  failures: string[];
  offline: boolean;
  triage: TriageResult;
  /** Source id for a drug's FDA label / MedlinePlus page (added on demand). */
  labelSource(drug: DrugEvidence): string | null;
  medlineSource(drug: DrugEvidence): string | null;
}
