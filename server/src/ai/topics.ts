// Maps everyday wording to MedlinePlus topic searches and PubMed title terms, and builds
// focused PubMed queries (title-field concepts + an "aspect" such as symptoms or safety).

import { DRUG_CLASSES, drugClasses, type DrugClass } from './drugs';

export interface HealthTopic {
  key: string;
  patterns: RegExp[];
  /** Query for the MedlinePlus health-topics search. */
  medlineplus: string;
  /** PubMed title terms. */
  pubmed: string[];
}

const T = (key: string, patterns: RegExp[], medlineplus: string, pubmed: string[]): HealthTopic => ({ key, patterns, medlineplus, pubmed });

export const TOPICS: HealthTopic[] = [
  T('stroke', [/\bstrokes?\b/i, /\btia\b/i, /\bmini[- ]?stroke\b/i, /\bbe ?fast\b/i], 'stroke', ['stroke']),
  T('heart attack', [/\bheart attacks?\b/i, /\bmyocardial infarction\b/i, /\bchest pain\b/i], 'heart attack', ['myocardial infarction', 'acute coronary syndrome']),
  T('high blood pressure', [/\b(high )?blood pressure\b/i, /\bhypertension\b/i, /\bhtn\b/i, /\bbp\b/i], 'high blood pressure', ['hypertension', 'blood pressure']),
  T('cholesterol', [/\bcholesterol\b/i, /\bldl\b/i, /\bhdl\b/i, /\blipids?\b/i, /\bhyperlipidemia\b/i, /\btriglycerides?\b/i], 'cholesterol', ['cholesterol', 'LDL', 'dyslipidemia']),
  T('statins', [/\bstatins?\b/i], 'statins', ['statin*']),
  T('type 2 diabetes', [/\b(type 2 )?diabet\w*/i, /\ba1c\b/i, /\bblood sugar\b/i, /\bt2dm\b/i, /\binsulin resistance\b/i], 'diabetes type 2', ['type 2 diabetes', 'diabetes']),
  T('prediabetes', [/\bprediabet\w*/i], 'prediabetes', ['prediabetes']),
  T('asthma', [/\basthma\b/i, /\binhaler\b/i, /\bwheez\w*/i], 'asthma', ['asthma']),
  T('copd', [/\bcopd\b/i, /\bemphysema\b/i], 'copd', ['COPD']),
  T('common cold', [/\b(a |the )?cold\b(?! (hands|feet|sweat|weather))/i, /\brunny nose\b/i, /\bstuffy nose\b/i, /\bcongestion\b/i], 'common cold', ['common cold']),
  T('flu', [/\bflu\b/i, /\binfluenza\b/i], 'flu', ['influenza']),
  T('covid-19', [/\bcovid\w*/i, /\bcoronavirus\b/i, /\bsars-cov-2\b/i], 'covid-19', ['COVID-19']),
  T('fever', [/\bfevers?\b/i, /\btemperature\b/i], 'fever', ['fever']),
  T('cough', [/\bcough\w*/i], 'cough', ['cough']),
  T('sore throat', [/\bsore throat\b/i, /\bstrep\b/i], 'sore throat', ['pharyngitis']),
  T('headache', [/\bheadaches?\b/i], 'headache', ['headache']),
  T('migraine', [/\bmigraines?\b/i], 'migraine', ['migraine']),
  T('back pain', [/\bback pain\b/i, /\bbackache\b/i, /\bsciatica\b/i], 'back pain', ['low back pain']),
  T('arthritis', [/\barthritis\b/i, /\bjoint pain\b/i, /\bosteoarthritis\b/i], 'osteoarthritis', ['osteoarthritis']),
  T('insomnia', [/\binsomnia\b/i, /\b(can't|cannot|trouble|hard to) (fall |stay )?sleep\w*/i, /\bsleep\b/i], 'insomnia', ['insomnia', 'sleep']),
  T('depression', [/\bdepress\w*/i, /\bfeeling down\b/i, /\bhopeless\b/i], 'depression', ['depression']),
  T('anxiety', [/\banxi\w*/i, /\bpanic attacks?\b/i, /\bworry\w*/i], 'anxiety', ['anxiety']),
  T('obesity', [/\bweight loss\b/i, /\blose weight\b/i, /\bobes\w*/i, /\boverweight\b/i, /\bbmi\b/i], 'weight control', ['obesity', 'weight loss']),
  T('exercise', [/\bexercis\w*/i, /\bphysical activity\b/i, /\bworkout\b/i, /\bwalking\b/i], 'exercise and physical fitness', ['exercise', 'physical activity']),
  T('nutrition', [/\bdiet\b/i, /\bnutrition\b/i, /\bhealthy eating\b/i, /\bwhat (should|can) i eat\b/i, /\bfoods?\b/i], 'nutrition', ['diet', 'nutrition']),
  T('quitting smoking', [/\bsmok\w*/i, /\bvap\w*/i, /\bnicotine\b/i, /\bcigarettes?\b/i], 'quitting smoking', ['smoking cessation']),
  T('alcohol', [/\balcohol\b/i, /\bdrinking\b/i, /\bbeer|wine|liquor\b/i], 'alcohol', ['alcohol']),
  T('kidney disease', [/\bkidney\w*/i, /\bckd\b/i, /\begfr\b/i, /\brenal\b/i], 'chronic kidney disease', ['chronic kidney disease']),
  T('heart failure', [/\bheart failure\b/i, /\bchf\b/i], 'heart failure', ['heart failure']),
  T('atrial fibrillation', [/\bafib\b/i, /\batrial fibrillation\b/i, /\birregular heart\w*/i], 'atrial fibrillation', ['atrial fibrillation']),
  T('allergies', [/\ballerg\w*/i, /\bhay fever\b/i], 'allergy', ['allergic rhinitis']),
  T('heartburn', [/\bheartburn\b/i, /\bacid reflux\b/i, /\bgerd\b/i], 'gerd', ['gastroesophageal reflux']),
  T('constipation', [/\bconstipat\w*/i], 'constipation', ['constipation']),
  T('diarrhea', [/\bdiarrh\w*/i], 'diarrhea', ['diarrhea']),
  T('urinary tract infection', [/\buti\b/i, /\burinary tract infection\b/i, /\bburning (when|while) (i )?pee\w*/i], 'urinary tract infections', ['urinary tract infection']),
  T('dehydration', [/\bdehydrat\w*/i], 'dehydration', ['dehydration']),
  T('acne', [/\bacne\b/i, /\bpimples?\b/i, /\bbreakouts?\b/i], 'acne', ['acne vulgaris']),
  T('hair loss', [/\bhair loss\b/i, /\bbald\w*/i, /\bthinning hair\b/i], 'hair loss', ['alopecia']),
  T('vaccines', [/\bvaccin\w*/i, /\bimmuniz\w*/i, /\bshots?\b(?! of)/i, /\bbooster\b/i], 'immunization', ['vaccination']),
  T('cancer screening', [/\bscreening\b/i, /\bcolonoscopy\b/i, /\bmammogram\b/i, /\bpap (smear|test)\b/i], 'cancer screening', ['cancer screening']),
  T('pregnancy', [/\bpregnan\w*/i], 'pregnancy', ['pregnancy']),
  T('menopause', [/\bmenopaus\w*/i, /\bhot flashes\b/i], 'menopause', ['menopause']),
  T('osteoporosis', [/\bosteoporosis\b/i, /\bbone density\b/i], 'osteoporosis', ['osteoporosis']),
  T('thyroid', [/\bthyroid\b/i, /\btsh\b/i], 'thyroid diseases', ['thyroid']),
  T('anemia', [/\banemi\w*/i, /\blow iron\b/i], 'anemia', ['anemia']),
  T('concussion', [/\bconcussion\b/i], 'concussion', ['concussion']),
  T('gout', [/\bgout\b/i], 'gout', ['gout']),
  T('dementia', [/\bdementia\b/i, /\balzheimer\w*/i, /\bmemory loss\b/i], 'dementia', ['dementia']),
  T('eczema', [/\beczema\b/i, /\batopic dermatitis\b/i], 'eczema', ['atopic dermatitis']),
  T('shingles', [/\bshingles\b/i], 'shingles', ['herpes zoster']),
  T('pneumonia', [/\bpneumonia\b/i], 'pneumonia', ['pneumonia']),
  T('sinusitis', [/\bsinus\w*/i], 'sinusitis', ['sinusitis']),
  T('muscle pain', [/\bmuscle (aches?|pain)\b/i, /\bmyalgi\w*/i, /\bsore muscles\b/i], 'muscle disorders', ['myalgia']),
  T('dizziness', [/\bdizz\w*/i, /\blight-?headed\w*/i, /\bvertigo\b/i], 'dizziness and vertigo', ['dizziness']),
  T('drug interactions', [/\binteract\w*/i, /\btake (it |them )?(together|with)\b/i, /\bmix\w* (with|medicines)\b/i], 'drug interactions', ['drug interaction*']),
];

const STOPWORDS = new Set(
  (
    'a an the and or but if of to in on at by for with about from into over under is are was were be been being am do does did done ' +
    'have has had having i me my mine we our you your he him his she her they them their it its this that these those what which who whom ' +
    'whose when where why how can could should would will shall may might must not no yes so than too very just also really please ' +
    'tell explain know need want get got take taking took give there here some any all more most much many few lot lots thing things ' +
    'okay ok hi hello thanks thank brian doctor dr normal bad good best better worse feel feeling feels still since today yesterday ' +
    'mean means meaning question questions help safe ok going gonna im ive dont cant'
  ).split(' '),
);

/** Topics mentioned in `text`, in order of first mention. */
export function detectTopics(text: string): HealthTopic[] {
  const found: Array<{ topic: HealthTopic; index: number }> = [];
  for (const topic of TOPICS) {
    let first = Infinity;
    for (const pattern of topic.patterns) {
      const m = pattern.exec(text);
      if (m && m.index < first) first = m.index;
    }
    if (first !== Infinity) found.push({ topic, index: first });
  }
  return found.sort((a, b) => a.index - b.index).map((f) => f.topic);
}

/** Content words (for a fallback search when no known topic matches). */
export function keywords(text: string, max = 3): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  return [...new Set(words)].slice(0, max);
}

// ── PubMed query building ────────────────────────────────────────────────────

export type Aspect =
  | 'symptoms'
  | 'prevention'
  | 'treatment'
  | 'safety'
  | 'dosing'
  | 'interactions'
  | 'pregnancy'
  | 'lifestyle'
  | 'diagnosis'
  | 'recommendations'
  | null;

/** The part of a topic the question is about. `aboutDrug` distinguishes "how much" dosing from guidelines. */
export function detectAspect(text: string, aboutDrug = true): Aspect {
  const t = text.toLowerCase();
  if (/\b(interact\w*|together|combine|mix\w*|with my)\b/.test(t)) return 'interactions';
  if (/\b(side effects?|adverse|safe|safety|risks?|dangerous|harm\w*)\b/.test(t)) return 'safety';
  if (/\b(dose|dosing|dosage|mg|missed)\b/.test(t)) return 'dosing';
  if (/\b(how much|how many|how often|how long)\b/.test(t)) return aboutDrug ? 'dosing' : 'recommendations';
  if (/\b(pregnan\w*|breastfeed\w*|breast-feed\w*)\b/.test(t)) return 'pregnancy';
  if (/\b(signs?|symptoms?|warning|recogni[sz]e|tell if|know if)\b/.test(t)) return 'symptoms';
  if (/\b(prevent\w*|lower (my )?risk|reduce (my )?risk|avoid)\b/.test(t)) return 'prevention';
  if (/\b(diet|eat|food|exercise|lifestyle|weight)\b/.test(t)) return 'lifestyle';
  if (/\b(test|tests|screen\w*|diagnos\w*)\b/.test(t)) return 'diagnosis';
  if (/\b(treat\w*|cure|manage\w*|therapy|medicine for|medication for|best (medicine|drug))\b/.test(t)) return 'treatment';
  return null;
}

/** Title words that signal an article addresses the aspect (used for ranking). */
export const ASPECT_TITLE_WORDS: Record<Exclude<Aspect, null>, string[]> = {
  symptoms: ['symptom', 'sign', 'recogni', 'warning', 'fast', 'presentation', 'awareness'],
  prevention: ['prevent', 'risk'],
  treatment: ['treatment', 'management', 'therapy'],
  safety: ['safety', 'adverse', 'side effect', 'toleran', 'intoleran'],
  dosing: ['dose', 'dosing', 'dosage'],
  interactions: ['interaction'],
  pregnancy: ['pregnan', 'lactation'],
  lifestyle: ['lifestyle', 'diet', 'exercise'],
  diagnosis: ['diagnos', 'screening'],
  recommendations: ['guideline', 'recommendation', 'guidance'],
};

const ASPECT_TERMS: Record<Exclude<Aspect, null>, string[]> = {
  symptoms: ['symptoms', 'signs', 'warning signs', 'recognition', 'presentation'],
  prevention: ['prevention', 'risk reduction'],
  treatment: ['treatment', 'management', 'therapy'],
  safety: ['safety', 'adverse', 'side effect*', 'tolerability', 'intolerance'],
  dosing: ['dose', 'dosing', 'dosage'],
  interactions: ['interaction*'],
  pregnancy: ['pregnan*', 'lactation'],
  lifestyle: ['lifestyle', 'diet', 'exercise'],
  diagnosis: ['diagnosis', 'screening'],
  recommendations: ['guideline*', 'recommendation*', 'guidance'],
};

const quote = (term: string): string => (/[\s-]/.test(term) && !term.endsWith('*') ? `"${term}"` : term);
const group = (terms: string[], field: 'ti' | 'tiab'): string =>
  `(${[...new Set(terms)].map((term) => `${quote(term)}[${field}]`).join(' OR ')})`;

export type QueryField = 'ti' | 'tiab';

/**
 * Title-focused query for a topic, optionally narrowed by an aspect. 'ti' (both concepts in
 * the title) is precise; 'tiab' is the looser fallback when the precise query finds little.
 */
export function topicPubMedQuery(topicTerms: string[], aspect: Aspect, field: QueryField = 'ti'): string {
  const base = group(topicTerms, 'ti');
  return aspect ? `${base} AND ${group(ASPECT_TERMS[aspect], field)}` : base;
}

/** Terms describing a drug for PubMed: the drug itself plus its main classes. */
export function drugPubMedTerms(name: string): string[] {
  const classes = drugClasses(name).filter((c: DrugClass) => c !== 'supplement');
  return [name, ...classes.flatMap((c) => DRUG_CLASSES[c].pubmed)];
}

/** Query for one drug (+ aspect) or for an interaction between two drugs. */
export function drugPubMedQuery(drugs: string[], aspect: Aspect, field: QueryField = 'ti'): string | null {
  const [first, second] = drugs;
  if (!first) return null;
  if (second) return `${group(drugPubMedTerms(first), 'ti')} AND ${group(drugPubMedTerms(second), field)}`;
  const base = group(drugPubMedTerms(first), 'ti');
  return aspect && aspect !== 'interactions' ? `${base} AND ${group(ASPECT_TERMS[aspect], field)}` : base;
}

const OFF_TOPIC_TITLE =
  /\b(child\w*|pediatric|paediatric|infant\w*|neonat\w*|pregnan\w*|preeclampsia|dental|dentist\w*|hiv|schizophreni\w*|antipsychotic|cancer|tumou?r|oncolog\w*|rats?|mice|murine|mouse|in vitro|veterinar\w*|dogs?|cats?|horses?|case report|covid-19)\b/i;

/**
 * Re-ranks articles for a patient-facing answer: titles mentioning more of the question's
 * key terms first; titles about a different population (children, pregnancy, animals…) last
 * unless the question mentions it.
 */
export function rankArticlesForQuestion<T extends { title: string }>(articles: T[], keyTerms: string[], question: string): T[] {
  const terms = keyTerms.map((t) => t.toLowerCase().replace(/\*$/, '')).filter((t) => t.length >= 3);
  const offTopicAllowed = OFF_TOPIC_TITLE.test(question);
  const score = (title: string): number => {
    const lower = title.toLowerCase();
    let value = terms.filter((t) => lower.includes(t)).length * 2;
    if (!offTopicAllowed && OFF_TOPIC_TITLE.test(title)) value -= 5;
    return value;
  };
  return articles
    .map((article, index) => ({ article, index, score: score(article.title) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.article);
}
