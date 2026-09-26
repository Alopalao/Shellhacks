// Evidence pre-retrieval: decides which drugs, topics and research to look up for a
// message (mode + context aware), fetches them in parallel within a time budget, and
// derives label-based interaction / condition / allergy findings.

import type { Prescription } from '../shared/contracts';
import {
  labelCitation,
  medlinePlusDrugCitation,
  medlinePlusTopicCitation,
  pubmedCitation,
  summarizeSection,
  type EvidenceClient,
  type LabelSectionKey,
  type MedlinePlusTopic,
  type PubMedArticle,
} from '../evidence';
import { splitSentences, titleCase } from '../evidence/text';
import { SourceList } from './citations';
import {
  DRUG_CLASSES,
  allergyConflicts,
  classPlural,
  cleanDrugName,
  conditionLabelPatterns,
  drugClasses,
  findDrugMentions,
  isOtc,
  isSupplement,
  lookupDrug,
} from './drugs';
import { isGlossaryQuestion, looksLikeClinicalNote } from './glossary';
import {
  detectAspect,
  ASPECT_TITLE_WORDS,
  detectTopics,
  drugPubMedQuery,
  drugPubMedTerms,
  keywords,
  rankArticlesForQuestion,
  topicPubMedQuery,
  type HealthTopic,
} from './topics';
import { triageSources, type TriageResult } from './triage';
import type { ChatInput, DrugEvidence, EvidenceBundle, InteractionFinding } from './types';

/** Overall budget for pre-retrieval; slower lookups are skipped, not awaited. */
export const RETRIEVAL_BUDGET_MS = 9_000;

const MEDICATION_CUES =
  /\b(take|taking|took|pill|pills|tablet|dose|dosage|mg|medicine|medication|meds|drug|prescription|side effects?|interact\w*|refill|pharmac\w*|otc|supplement)\b/i;

export async function withDeadline<T>(promise: Promise<T>, ms: number, fallback: T): Promise<{ value: T; timedOut: boolean; failed: boolean }> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<{ value: T; timedOut: boolean; failed: boolean }>((resolve) => {
    timer = setTimeout(() => resolve({ value: fallback, timedOut: true, failed: false }), ms);
  });
  const settled = promise.then(
    (value) => ({ value, timedOut: false, failed: false }),
    () => ({ value: fallback, timedOut: false, failed: true }),
  );
  try {
    return await Promise.race([settled, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface Plan {
  askedDrugs: Array<{ name: string; prescription: Prescription | null }>;
  patientMeds: Array<{ name: string; prescription: Prescription }>;
  noteDrugs: string[];
  medlinePlusQueries: string[];
  pubmedQuery: string | null;
  /** Looser variant used when the precise query finds fewer than 2 articles. */
  pubmedFallbackQuery: string | null;
  /** Words that make an article title relevant to this question (for ranking). */
  researchTerms: string[];
  /** Articles fetched (for ranking) vs. kept. */
  pubmedMax: number;
  keepArticles: number;
  labelsForAsked: boolean;
}

const activeMeds = (input: ChatInput): Prescription[] =>
  (input.patient?.medications ?? []).filter((rx) => rx.status !== 'discontinued');

function topicFromLesson(title: string): string {
  return title
    .replace(/\b(understanding|basics|guide|101|what to know|how to|your|the|a|an|lesson)\b/gi, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4)
    .join(' ');
}

/** Candidate words for an RxNorm exact-name check (unknown drug names like "Eliquis"). */
function rxnormCandidates(message: string): string[] {
  const known = new Set(findDrugMentions(message).map((m) => m.matched.toLowerCase()));
  return keywords(message, 8)
    .filter((w) => w.length >= 4 && !known.has(w))
    .slice(0, 4);
}

export async function planRetrieval(input: ChatInput, triage: TriageResult, evidence: EvidenceClient): Promise<Plan> {
  const meds = activeMeds(input);
  const medNames = meds.map((rx) => rx.drugName);
  const noteText = input.note?.body ?? '';
  const isClinician = input.role === 'doctor';

  // 1. Drugs the question is about.
  const asked: Array<{ name: string; prescription: Prescription | null }> = [];
  const addAsked = (raw: string, prescription: Prescription | null = null) => {
    const entry = lookupDrug(raw);
    const name = entry?.name ?? cleanDrugName(raw);
    if (name.length >= 3 && !asked.some((a) => a.name === name)) asked.push({ name, prescription });
  };
  if (input.prescription) addAsked(input.prescription.drugName, input.prescription);
  if (input.drugName) addAsked(input.drugName);
  for (const mention of findDrugMentions(input.message, medNames)) {
    addAsked(mention.name, meds.find((rx) => cleanDrugName(rx.drugName) === mention.name || lookupDrug(rx.drugName)?.name === mention.name) ?? null);
  }
  const wantsMedication = input.mode === 'medication' || MEDICATION_CUES.test(input.message);
  if (asked.length === 0 && wantsMedication && !evidence.offline && !looksLikeClinicalNote(input.message)) {
    const candidates = rxnormCandidates(input.message);
    const hits = await Promise.all(
      candidates.map((word) => withDeadline(evidence.rxcuiForName(word), 2_500, null).then((r) => (r.value ? word : null))),
    );
    for (const word of hits) if (word) addAsked(word);
  }
  for (const a of asked) {
    if (!a.prescription) a.prescription = meds.find((rx) => lookupDrug(rx.drugName)?.name === a.name || cleanDrugName(rx.drugName) === a.name) ?? null;
  }

  // 2. Drugs in a visit note (explained with MedlinePlus drug pages).
  const noteDrugs = input.mode === 'explain-note' || noteText ? findDrugMentions(noteText || input.message, medNames).map((m) => m.name) : [];

  // 3. Patient's other medicines (to check interactions against what they asked about).
  const patientMeds =
    asked.length > 0
      ? meds
          .map((rx) => ({ name: lookupDrug(rx.drugName)?.name ?? cleanDrugName(rx.drugName), prescription: rx }))
          .filter((m) => !asked.some((a) => a.name === m.name) && !isSupplement(m.name))
          .slice(0, 4)
      : [];

  // 4. Topics.
  const queries: string[] = [];
  const addQuery = (q: string | null | undefined) => {
    const clean = q?.trim();
    if (clean && !queries.some((existing) => existing.toLowerCase() === clean.toLowerCase())) queries.push(clean);
  };
  if (triage.topic) addQuery(triage.topic);
  let topics: HealthTopic[] = [];
  if (input.mode === 'explain-note' && (noteText || looksLikeClinicalNote(input.message))) {
    topics = detectTopics(noteText || input.message).filter((t) => t.key !== 'drug interactions');
    for (const t of topics.slice(0, 3)) addQuery(t.medlineplus);
  } else {
    topics = detectTopics(input.message).filter((t) => t.key !== 'drug interactions');
    if (input.lessonTitle) addQuery(topicFromLesson(input.lessonTitle));
    for (const t of topics.slice(0, asked.length > 0 ? 1 : 2)) addQuery(t.medlineplus);
    if (queries.length === 0 && asked.length === 0 && !(isGlossaryQuestion(input.message))) {
      const words = keywords(input.message, 3);
      if (words.length > 0) addQuery(words.join(' '));
    }
  }

  // Allergy conflicts are known locally (no label needed) and change what research is useful.
  const allergy = asked
    .map((a) => ({ drug: a.name, conflicts: allergyConflicts(a.name, input.patient?.allergies ?? []) }))
    .find((a) => a.conflicts.length > 0);

  // 5. Research.
  const glossaryQuestion = isGlossaryQuestion(input.message) && asked.length === 0;
  // A general question about one medicine: side effects and safety are what patients need most.
  const aspect = detectAspect(input.message, asked.length > 0) ?? (asked.length === 1 && !isClinician ? 'safety' : null);
  const liveEmergency = triage.triage?.level === 'emergency' && !triage.educational;
  let pubmedQuery: string | null = null;
  let pubmedFallbackQuery: string | null = null;
  let researchTerms: string[] = [];
  if (!liveEmergency && !glossaryQuestion && triage.triage?.level !== 'urgent') {
    if (allergy) {
      const term = allergy.conflicts[0]!.allergy.toLowerCase().split(/\s+/)[0] ?? allergy.drug;
      pubmedQuery = `${term}[ti] AND allerg*[ti]`;
      pubmedFallbackQuery = `${term}[tiab] AND allerg*[ti]`;
      researchTerms = [term, 'allerg', 'delabel', 'testing'];
    } else if (asked.length > 0 && (input.mode !== 'explain-note' || isClinician)) {
      const names = asked.map((a) => a.name).slice(0, 2);
      pubmedQuery = drugPubMedQuery(names, aspect, 'ti');
      pubmedFallbackQuery = drugPubMedQuery(names, aspect, 'tiab');
      researchTerms = names.flatMap((n) => drugPubMedTerms(n));
    } else if (input.mode === 'explain-note') {
      if (isClinician && topics.length > 0) {
        const terms = topics.slice(0, 2).flatMap((t) => t.pubmed);
        pubmedQuery = topicPubMedQuery(terms, 'treatment', 'ti');
        pubmedFallbackQuery = topicPubMedQuery(terms, 'treatment', 'tiab');
        researchTerms = terms;
      }
    } else {
      const triageTopic = triage.topic ? [triage.topic] : [];
      const lessonTopic = input.lessonTitle ? [topicFromLesson(input.lessonTitle)] : [];
      const terms = topics.length > 0 ? topics[0]!.pubmed : triageTopic.length > 0 ? triageTopic : lessonTopic;
      if (terms.length > 0) {
        pubmedQuery = topicPubMedQuery(terms, aspect, 'ti');
        pubmedFallbackQuery = aspect ? topicPubMedQuery(terms, aspect, 'tiab') : null;
        researchTerms = terms;
      } else {
        const words = keywords(input.message, 3);
        if (words.length > 0) {
          pubmedQuery = words.map((w) => `${w}[tiab]`).join(' AND ');
          researchTerms = words;
        }
      }
    }
  }

  if (aspect) researchTerms = [...researchTerms, ...ASPECT_TITLE_WORDS[aspect]];

  return {
    askedDrugs: asked.slice(0, 3),
    patientMeds,
    noteDrugs: noteDrugs.slice(0, 4),
    medlinePlusQueries: queries.slice(0, input.mode === 'explain-note' ? 4 : 2),
    pubmedQuery,
    pubmedFallbackQuery,
    researchTerms,
    pubmedMax: 5,
    keepArticles: isClinician ? 5 : 3,
    labelsForAsked: asked.length > 0 && input.mode !== 'explain-note',
  };
}

const INTERACTION_SECTIONS: LabelSectionKey[] = [
  'interactions',
  'contraindications',
  'warningsAndCautions',
  'boxedWarning',
  'askDoctorOrPharmacist',
  'askDoctor',
  'doNotUse',
  'warnings',
];

const CONDITION_SECTIONS: LabelSectionKey[] = ['boxedWarning', 'contraindications', 'askDoctor', 'doNotUse', 'warningsAndCautions', 'warnings'];

/** Sentences about trials/pharmacology, not advice for a patient. */
const NOT_ADVICE = /\b(trial|randomi[sz]ed|enrolled|placebo|study|studies|pharmacokinetic|AUC|Cmax|mg\/kg|subjects)\b/i;

/** Label passages (highlight items, then sentences) that mention one of `patterns`. */
export function findLabelMention(
  label: EvidenceBundle['drugs'][number]['label'],
  patterns: RegExp[],
  sections: LabelSectionKey[] = INTERACTION_SECTIONS,
): string | null {
  if (!label) return null;
  for (const key of sections) {
    const text = label.sections[key];
    if (!text) continue;
    const summary = summarizeSection(text, 5000, 30);
    const candidates = [...summary.items, ...splitSentences(text)];
    for (const raw of candidates) {
      const candidate = raw.replace(/^\d+(\.\d+)?\s+/, '');
      if (candidate.length > 600 || NOT_ADVICE.test(candidate)) continue;
      if (patterns.some((p) => p.test(candidate))) {
        const intro = summary.intro && summary.items.includes(candidate) ? `${summary.intro} ` : '';
        return `${intro}${candidate}`.trim();
      }
    }
  }
  return null;
}

const namePattern = (name: string): RegExp => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

function interactionBetween(a: DrugEvidence, b: DrugEvidence): { text: string; via: string; viaClass: boolean } | null {
  if (!a.label) return null;
  const byName = findLabelMention(a.label, [namePattern(b.name), ...(lookupDrug(b.name)?.brands ?? []).map(namePattern)]);
  if (byName) return { text: byName, via: b.name, viaClass: false };
  for (const cls of b.classes) {
    const info = DRUG_CLASSES[cls];
    if (info.labelPatterns.length === 0) continue;
    const hit = findLabelMention(a.label, info.labelPatterns);
    if (hit) return { text: hit, via: classPlural(info.label), viaClass: true };
  }
  return null;
}

/** Best MedlinePlus topic for a query: exact title / alternate title first, then all words, then rank. */
function pickTopic(topics: MedlinePlusTopic[], query: string): MedlinePlusTopic | null {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  return (
    topics.find((t) => t.title.toLowerCase() === q) ??
    topics.find((t) => t.altTitles.some((alt) => alt.toLowerCase() === q)) ??
    topics.find((t) => !/^how to|^tips/i.test(t.title) && words.every((w) => t.title.toLowerCase().includes(w))) ??
    topics.find((t) => !/^how to|^tips/i.test(t.title)) ??
    topics[0] ??
    null
  );
}

export async function retrieveEvidence(input: ChatInput, triage: TriageResult, evidence: EvidenceClient): Promise<EvidenceBundle> {
  const sources = new SourceList();
  const failures: string[] = [];
  const plan = await planRetrieval(input, triage, evidence);
  const deadline = Date.now() + RETRIEVAL_BUDGET_MS;
  const remaining = () => Math.max(500, deadline - Date.now());

  const track = async <T>(label: string, promise: Promise<T>, fallback: T): Promise<T> => {
    const result = await withDeadline(promise, remaining(), fallback);
    if (result.failed || result.timedOut) failures.push(label);
    return result.value;
  };

  const lookupDrugEvidence = async (
    name: string,
    role: DrugEvidence['role'],
    prescription: Prescription | null,
    wantLabel: boolean,
  ): Promise<DrugEvidence> => {
    const normalized = await track(`RxNorm: ${name}`, evidence.normalizeDrug(name), null);
    const generic = normalized?.name ?? name;
    const supplement = isSupplement(generic) || isSupplement(name);
    const [label, medline] = await Promise.all([
      wantLabel && !supplement
        ? track(`openFDA: ${name}`, evidence.drugLabel(generic, { rxcui: normalized?.rxcui, preferOtc: isOtc(generic) && !prescription, form: prescription?.form }), null)
        : Promise.resolve(null),
      track(`MedlinePlus: ${name}`, evidence.medlinePlusDrug({ name: generic, rxcui: normalized?.rxcui, form: prescription?.form ?? prescription?.drugName ?? null }), null),
    ]);
    const entry = lookupDrug(generic) ?? lookupDrug(name);
    const canonical = entry?.name ?? generic;
    return {
      name: canonical,
      displayName: titleCase(canonical),
      role,
      normalized,
      label,
      medline,
      classes: drugClasses(canonical, label?.pharmClasses ?? []),
      prescription,
    };
  };

  const [asked, patientMeds, noteDrugs, topicResults, articles] = await Promise.all([
    Promise.all(plan.askedDrugs.map((d) => lookupDrugEvidence(d.name, 'asked', d.prescription, plan.labelsForAsked))),
    Promise.all(plan.patientMeds.map((d) => lookupDrugEvidence(d.name, 'patient-med', d.prescription, true))),
    Promise.all(
      plan.noteDrugs
        .filter((name) => !plan.askedDrugs.some((a) => a.name === name))
        .map((name) =>
          lookupDrugEvidence(
            name,
            'note',
            activeMeds(input).find((rx) => lookupDrug(rx.drugName)?.name === name) ?? null,
            false,
          ),
        ),
    ),
    Promise.all(
      plan.medlinePlusQueries.map(async (q) => {
        const found = await track(`MedlinePlus: ${q}`, evidence.searchMedlinePlus(q, { max: 3 }), [] as MedlinePlusTopic[]);
        const best = pickTopic(found, q);
        return best ? [best] : [];
      }),
    ),
    (async (): Promise<PubMedArticle[]> => {
      if (!plan.pubmedQuery) return [];
      const precise = await track('PubMed', evidence.searchPubMed(plan.pubmedQuery, { max: plan.pubmedMax }), [] as PubMedArticle[]);
      if (precise.length >= 2 || !plan.pubmedFallbackQuery || failures.includes('PubMed')) return precise;
      const loose = await track('PubMed', evidence.searchPubMed(plan.pubmedFallbackQuery, { max: plan.pubmedMax }), [] as PubMedArticle[]);
      return [...precise, ...loose.filter((a) => !precise.some((p) => p.pmid === a.pmid))].slice(0, plan.pubmedMax);
    })(),
  ]);

  const drugs = [...asked, ...noteDrugs, ...patientMeds];
  const labelIds = new Map<DrugEvidence, string>();
  const medlineIds = new Map<DrugEvidence, string>();
  const labelSource = (drug: DrugEvidence): string | null => {
    if (!drug.label) return null;
    const existing = labelIds.get(drug);
    if (existing) return existing;
    const id = sources.add(labelCitation(drug.label));
    labelIds.set(drug, id);
    return id;
  };
  const medlineSource = (drug: DrugEvidence): string | null => {
    if (!drug.medline) return null;
    const existing = medlineIds.get(drug);
    if (existing) return existing;
    const id = sources.add(medlinePlusDrugCitation(drug.medline));
    medlineIds.set(drug, id);
    return id;
  };

  // Numbering: triage references first for live emergencies, then what the question is about.
  const triageSourceIds: string[] = [];
  const liveTriage = triage.triage && triage.triage.level !== 'info' ? triage.categories[0] : null;
  const infoTriage = triage.triage?.level === 'info' ? triage.categories[0] : null;
  if (liveTriage) for (const s of triageSources(liveTriage).slice(0, 2)) triageSourceIds.push(sources.add(s));

  for (const drug of asked) {
    labelSource(drug);
    medlineSource(drug);
  }
  const topics: EvidenceBundle['topics'] = [];
  for (const topic of topicResults.flat()) {
    if (topics.some((t) => t.topic.url === topic.url)) continue;
    topics.push({ topic, sourceId: sources.add(medlinePlusTopicCitation(topic)) });
  }
  for (const drug of noteDrugs) medlineSource(drug);
  if (infoTriage) for (const s of triageSources(infoTriage).slice(0, 1)) triageSourceIds.push(sources.add(s));
  const rankedArticles = rankArticlesForQuestion(articles, plan.researchTerms, input.message).slice(0, plan.keepArticles);
  const articleEntries = rankedArticles.map((article) => ({ article, sourceId: sources.add(pubmedCitation(article)) }));

  // Label-based findings.
  const interactions: InteractionFinding[] = [];
  const pairs: Array<[DrugEvidence, DrugEvidence]> = [];
  for (let i = 0; i < asked.length; i++) {
    for (let j = 0; j < asked.length; j++) if (i !== j) pairs.push([asked[i]!, asked[j]!]);
    for (const med of patientMeds) {
      pairs.push([asked[i]!, med], [med, asked[i]!]);
    }
  }
  for (const [a, b] of pairs) {
    if (interactions.some((f) => f.labelDrug === a.name && f.otherDrug === b.name)) continue;
    // Two medicines the patient already takes (and didn't ask about together) are their prescriber's call.
    const bothAsked = a.role === 'asked' && b.role === 'asked';
    if (a.prescription && b.prescription && !bothAsked) continue;
    const hit = interactionBetween(a, b);
    if (!hit) continue;
    const sourceId = labelSource(a);
    if (sourceId) interactions.push({ labelDrug: a.name, otherDrug: b.name, via: hit.via, viaClass: hit.viaClass, text: hit.text, sourceId });
  }

  const conditionWarnings: EvidenceBundle['conditionWarnings'] = [];
  const allergyWarnings: EvidenceBundle['allergyWarnings'] = [];
  const conditions = conditionLabelPatterns(input.patient?.conditions ?? []);
  for (const drug of asked) {
    // Condition cautions matter for medicines the patient isn't already prescribed.
    if (drug.label && !drug.prescription) {
      for (const condition of conditions) {
        const text = findLabelMention(drug.label, [condition.label], CONDITION_SECTIONS);
        const sourceId = text ? labelSource(drug) : null;
        if (text && sourceId && !conditionWarnings.some((w) => w.drug === drug.name && w.plainCondition === condition.plain)) {
          conditionWarnings.push({ drug: drug.name, condition: condition.condition, plainCondition: condition.plain, text, sourceId });
        }
      }
    }
    const labelText = Object.values(drug.label?.sections ?? {}).join(' ');
    for (const conflict of allergyConflicts(drug.name, input.patient?.allergies ?? [], labelText, drug.label?.pharmClasses ?? [])) {
      allergyWarnings.push({ drug: drug.name, ...conflict });
    }
  }

  return {
    sources,
    drugs,
    topics,
    articles: articleEntries,
    triageSourceIds,
    interactions,
    conditionWarnings,
    allergyWarnings,
    failures,
    offline: evidence.offline,
    triage,
    labelSource,
    medlineSource,
  };
}
