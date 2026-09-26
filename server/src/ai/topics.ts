// Maps everyday wording to MedlinePlus topic searches and PubMed title terms, and builds
// focused PubMed queries (title-field concepts + an "aspect" such as symptoms or safety).

import type { CitationDraft } from '../evidence/types';
import { DRUG_CLASSES, drugClasses, type DrugClass } from './drugs';
import { isNegatedInText } from './triage';

export interface HealthTopic {
  key: string;
  patterns: RegExp[];
  /** Query for the MedlinePlus health-topics search. */
  medlineplus: string;
  /** PubMed title terms (empty: research articles don't help with this topic). */
  pubmed: string[];
  /** Insurance, legal and care-navigation topics: answered from MedlinePlus, never PubMed. */
  nonClinical?: boolean;
  /** A short scope note shown with answers on this topic (e.g. "not legal advice"). */
  note?: string;
  /** The verified page that supports `note` (cited with it). */
  noteSource?: CitationDraft;
}

const T = (
  key: string,
  patterns: RegExp[],
  medlineplus: string,
  pubmed: string[],
  extra: Pick<HealthTopic, 'nonClinical' | 'note' | 'noteSource'> = {},
): HealthTopic => ({
  key,
  patterns,
  medlineplus,
  pubmed,
  ...extra,
});

const INSURANCE_NOTE =
  "Insurance rules here are general and U.S.-focused. Your plan's documents (or the member number on your insurance card) have your exact costs and rules.";
const LEGAL_NOTE =
  'This is general information about U.S. patient rights, not legal advice. For a possible claim (such as malpractice), talk with a licensed attorney in your state — deadlines to file can be short.';

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
  T('suicide', [/\bsuicid\w*/i, /\bself[- ]?harm\w*/i], 'suicide', ['suicide', 'suicidal']),
  T('depression', [/\bdepress\w*/i, /\bfeeling down\b/i, /\bhopeless\b/i], 'depression', ['depression']),
  T('anxiety', [/\banxi\w*/i, /\bpanic attacks?\b/i, /\bworry\w*/i], 'anxiety', ['anxiety']),
  T('obesity', [/\bweight loss\b/i, /\blose weight\b/i, /\bobes\w*/i, /\boverweight\b/i, /\bbmi\b/i], 'weight control', ['obesity', 'weight loss']),
  T('exercise', [/\bexercis\w*/i, /\bphysical activity\b/i, /\bworkout\b/i, /\bwalking\b/i], 'exercise and physical fitness', ['exercise', 'physical activity']),
  T('nutrition', [/\bdiet\b/i, /\bnutrition\b/i, /\bhealthy eating\b/i, /\bwhat (should|can) i eat\b/i, /\bfoods?\b/i], 'nutrition', ['diet', 'nutrition']),
  T('quitting smoking', [/\bsmok\w*/i, /\bvap\w*/i, /\bnicotine\b/i, /\bcigarettes?\b/i], 'quitting smoking', ['smoking cessation']),
  T('alcohol', [/\balcohol\b/i, /\bdrinking\b/i, /\bbeer|wine|liquor\b/i], 'alcohol', ['alcohol']),
  T('kidney disease', [/\bkidney\w*/i, /\bckd\b/i, /\begfr\b/i, /\brenal\b/i], 'chronic kidney disease', ['chronic kidney disease']),
  T('heart failure', [/\bheart failure\b/i, /\bchf\b/i, /\bhf[rp]ef\b/i, /\bejection fraction\b/i], 'heart failure', ['heart failure']),
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
  T('acute kidney injury', [/\baki\b/i, /\bacute kidney injury\b/i, /\bacute renal failure\b/i, /\btriple whammy\b/i], 'kidney failure', ['acute kidney injury']),
  // Beyond conditions: insurance, rights, accidents, cosmetic care and where to get care (BRIAN's lessons cover these).
  T(
    'health insurance',
    [/\binsurance\b/i, /\bdeductibles?\b/i, /\bco-?pays?\b/i, /\bco-?insurance\b/i, /\bpremiums?\b/i, /\bout[- ]of[- ]pocket\b/i, /\b(in|out[- ]of)[- ]network\b/i, /\bprior auth\w*/i, /\bpre-?authoriz\w*/i, /\bclaims? (was |were |got )?denied\b|\bdenied claims?\b|\bclaim denials?\b/i, /\bexplanation of benefits\b|\bEOB\b/, /\bsurprise bill\w*/i, /\bmedical bills?\b/i],
    'health insurance',
    [],
    { nonClinical: true, note: INSURANCE_NOTE },
  ),
  T('medicare', [/\bmedicare\b/i], 'medicare', [], { nonClinical: true, note: INSURANCE_NOTE }),
  T('medicaid', [/\bmedicaid\b/i], 'medicaid', [], { nonClinical: true, note: INSURANCE_NOTE }),
  T(
    'patient rights',
    [/\bmalpractice\b/i, /\b(sue|suing|lawsuit|lawyer|attorney)\b/i, /\bpatient'?s? rights\b/i, /\bhipaa\b/i, /\bmedical records?\b/i, /\binformed consent\b/i, /\bsecond opinion\b/i, /\bnegligen\w*/i, /\bliabilit\w*/i],
    'patient rights',
    [],
    { nonClinical: true, note: LEGAL_NOTE },
  ),
  T(
    'car accident',
    [/\b(car|auto|motor vehicle|traffic|bike|bicycle|motorcycle)\s+(accident|crash|collision|wreck)s?\b/i, /\bfender[- ]bender\b/i, /\bwhiplash\b/i, /\brear-?ended\b/i],
    'neck injuries and disorders',
    ['whiplash'],
    {
      note:
        'After a crash, call 911 if anyone is badly hurt. Get checked even if you feel fine: car accidents are a common cause of whiplash and concussion, and concussion symptoms may not start right away — they can begin days or weeks later. Get medical care right away for a headache that gets worse, repeated vomiting, confusion, slurred speech, weakness or numbness, a seizure, or trouble staying awake.',
      noteSource: { source: 'MedlinePlus', title: 'Concussion', url: 'https://medlineplus.gov/concussion.html', publisher: 'MedlinePlus (National Library of Medicine)' },
    },
  ),
  T('botox', [/\bbotox\b/i, /\bbotulinum\b/i, /\bdysport\b/i, /\bxeomin\b/i], 'botox', ['botulinum toxin']),
  T(
    'cosmetic surgery',
    [/\b(plastic|cosmetic|aesthetic) (surgery|surgeon|procedures?)\b/i, /\btummy tuck\b|\babdominoplasty\b/i, /\bliposuction\b|\blipo\b/i, /\bbreast (augmentation|implants?|lift|reduction)\b/i, /\brhinoplasty\b|\bnose job\b/i, /\bface ?lift\b/i, /\bbrazilian butt lift\b|\bBBL\b/, /\bblepharoplasty\b|\beyelid surgery\b/i, /\b(dermal )?fillers?\b/i, /\blaser (hair|skin|resurfacing)\b/i],
    'plastic and cosmetic surgery',
    ['cosmetic surgery', 'aesthetic surgery'],
  ),
  T('teeth whitening', [/\b(teeth|tooth) whiten\w*|\bwhiten\w* (my |your )?teeth\b|\bbleaching (my |your )?teeth\b/i], 'dental health', ['tooth bleaching', 'tooth whitening']),
  T('dental health', [/\bdent(al|ist\w*)\b/i, /\b(teeth|tooth)\b/i, /\bcavit(y|ies)\b/i, /\bgums\b|\bgum disease\b/i, /\bveneers?\b/i, /\bbraces\b/i], 'dental health', ['oral health']),
  T(
    'where to get care',
    [/\burgent care\b/i, /\bemergency (room|department)\b/i, /\bER\b/, /\btele(health|medicine)\b/i, /\bvirtual visits?\b/i, /\bwhere (should|do|can) (i|we) (go|get care|be seen)\b/i, /\bwalk-?in clinic\b/i],
    'emergency medical services',
    [],
    { nonClinical: true },
  ),
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

/**
 * Topics mentioned in `text`, in order of first mention. Negated mentions ("No chest pain
 * today, just checking in about my blood pressure meds") don't count.
 */
export function detectTopics(text: string): HealthTopic[] {
  const found: Array<{ topic: HealthTopic; index: number }> = [];
  for (const topic of TOPICS) {
    let first = Infinity;
    for (const pattern of topic.patterns) {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      for (const m of text.matchAll(re)) {
        if (m.index >= first) break;
        if (!isNegatedInText(text, m.index)) {
          first = m.index;
          break;
        }
      }
    }
    if (first !== Infinity) found.push({ topic, index: first });
  }
  return found.sort((a, b) => a.index - b.index).map((f) => f.topic);
}

/** Drug classes named in a question ("SGLT2 inhibitors", "ACE inhibitor + NSAID"), as PubMed title terms. */
const CLASS_TERMS: Array<{ pattern: RegExp; pubmed: string[] }> = [
  { pattern: /\bsglt-?2\b|\bgliflozins?\b|\bsodium[- ]glucose co-?transporter/i, pubmed: ['SGLT2', 'SGLT-2', 'sodium-glucose cotransporter 2', 'gliflozin*'] },
  { pattern: /\bglp-?1\b|\bglucagon-like peptide/i, pubmed: ['GLP-1', 'glucagon-like peptide-1'] },
  { pattern: /\bdpp-?4\b|\bgliptins?\b/i, pubmed: ['DPP-4', 'dipeptidyl peptidase-4'] },
  { pattern: /\bace[- ]?inhibitors?\b|\bacei\b|\bace-i\b/i, pubmed: ['ACE inhibitor*', 'angiotensin-converting enzyme inhibitor*'] },
  { pattern: /\bARBs?\b|\bangiotensin (ii )?receptor blockers?\b/i, pubmed: ['angiotensin receptor blocker*'] },
  { pattern: /\barni\b|\bsacubitril\b/i, pubmed: ['sacubitril', 'ARNI'] },
  { pattern: /\bnsaids?\b|\bnon-?steroidal anti-?inflammator/i, pubmed: ['NSAID*', 'nonsteroidal anti-inflammatory'] },
  { pattern: /\bstatins?\b/i, pubmed: ['statin*'] },
  { pattern: /\bssris?\b|\bselective serotonin reuptake/i, pubmed: ['SSRI*', 'selective serotonin reuptake inhibitor*'] },
  { pattern: /\bsnris?\b/i, pubmed: ['SNRI*'] },
  { pattern: /\bbeta[- ]?blockers?\b/i, pubmed: ['beta blocker*', 'beta-blocker*'] },
  { pattern: /\bdiuretics?\b|\bwater pills?\b/i, pubmed: ['diuretic*'] },
  { pattern: /\b(doacs?|noacs?|direct oral anticoagulants?)\b/i, pubmed: ['direct oral anticoagulant*', 'DOAC*'] },
  { pattern: /\banticoagula\w*|\bblood thinners?\b/i, pubmed: ['anticoagula*'] },
  { pattern: /\bppis?\b|\bproton pump inhibitors?\b/i, pubmed: ['proton pump inhibitor*'] },
  { pattern: /\bt-?pa\b|\balteplase\b|\btenecteplase\b|\bthromboly\w*/i, pubmed: ['thrombolysis', 'alteplase', 'tenecteplase'] },
  { pattern: /\bopioids?\b/i, pubmed: ['opioid*'] },
  { pattern: /\bbenzodiazepines?\b|\bbenzos\b/i, pubmed: ['benzodiazepine*'] },
  { pattern: /\bbisphosphonates?\b/i, pubmed: ['bisphosphonate*'] },
  { pattern: /\btriple whammy\b/i, pubmed: ['triple whammy'] },
];

/** The drug classes a question names, in order of mention: one PubMed term group per class. */
export function questionClassGroups(text: string): string[][] {
  return CLASS_TERMS.map((c) => ({ c, m: c.pattern.exec(text) }))
    .filter((x): x is { c: (typeof CLASS_TERMS)[number]; m: RegExpExecArray } => x.m !== null && !isNegatedInText(text, x.m.index))
    .sort((a, b) => a.m.index - b.m.index)
    .map((x) => x.c.pubmed);
}

/** PubMed terms for the drug classes a question names (in order of mention, de-duplicated). */
export function questionClassTerms(text: string): string[] {
  return questionClassGroups(text)
    .flat()
    .filter((term, i, all) => all.indexOf(term) === i);
}

/** Narrower condition terms the question names ("HFpEF" is more specific than "heart failure"). */
const CONDITION_REFINERS: Array<{ pattern: RegExp; pubmed: string[] }> = [
  { pattern: /\bhfpef\b|\bpreserved ejection fraction\b/i, pubmed: ['HFpEF', 'preserved ejection fraction'] },
  { pattern: /\bhfref\b|\breduced ejection fraction\b/i, pubmed: ['HFrEF', 'reduced ejection fraction'] },
  { pattern: /\bischemic stroke\b|\bacute stroke\b/i, pubmed: ['ischemic stroke', 'ischaemic stroke'] },
];

/** A topic's PubMed terms, narrowed when the question names a subtype. */
export function refineTopicTerms(text: string, terms: string[]): string[] {
  const refined = CONDITION_REFINERS.filter((r) => r.pattern.test(text)).flatMap((r) => r.pubmed);
  return refined.length > 0 ? refined : terms;
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
  | 'driving'
  | null;

/** The part of a topic the question is about. `aboutDrug` distinguishes "how much" dosing from guidelines. */
export function detectAspect(text: string, aboutDrug = true): Aspect {
  const t = text.toLowerCase();
  if (/\b(drive|driving|driver'?s licen[cs]e|behind the wheel)\b/.test(t)) return 'driving';
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
  driving: ['driv', 'motor vehicle'],
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
  driving: ['driving', 'driver*', 'motor vehicle'],
};

/** Multi-word terms are phrases (PubMed supports truncation inside quotes: "ACE inhibitor*"). */
const quote = (term: string): string => (/[\s-]/.test(term) ? `"${term}"` : term);
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

/** Classes too broad to describe a drug in a search ("blood pressure", "diabetes" match everything). */
const BROAD_CLASSES: ReadonlySet<DrugClass> = new Set(['supplement', 'antihypertensive', 'raas', 'antidiabetic', 'serotonergic', 'antidepressant', 'antibiotic', 'sedative']);

/** Terms describing a drug for PubMed: the drug itself plus its specific classes. */
export function drugPubMedTerms(name: string): string[] {
  const classes = drugClasses(name).filter((c: DrugClass) => !BROAD_CLASSES.has(c));
  return [name, ...classes.flatMap((c) => DRUG_CLASSES[c].pubmed)];
}

/**
 * Drug classes in a condition. One class: "(SGLT2[ti] OR …) AND (HFpEF[ti] OR …)" ('ti') or
 * the condition anywhere ('tiab'). Several classes named together ("ACE inhibitor + NSAID +
 * diuretic") must all appear: each class group is ANDed.
 */
export function classTopicPubMedQuery(classGroups: string[][], topicTerms: string[], aspect: Aspect, field: QueryField = 'ti'): string {
  const classes =
    classGroups.length > 1 && field === 'ti'
      ? classGroups.map((terms) => group(terms, 'tiab')).join(' AND ')
      : group(classGroups.flat(), 'ti');
  const base = topicTerms.length > 0 ? `${classes} AND ${group(topicTerms, classGroups.length > 1 ? 'tiab' : field)}` : classes;
  return aspect && aspect !== 'interactions' ? `${base} AND ${group(ASPECT_TERMS[aspect], 'tiab')}` : base;
}

/** One drug in a condition the question names: "(atorvastatin[ti] OR statin*[ti]) AND (myalgia[tiab])". */
export function drugTopicPubMedQuery(drug: string, topicTerms: string[]): string {
  return `${group(drugPubMedTerms(drug), 'ti')} AND ${group(topicTerms, 'tiab')}`;
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
  /\b(child\w*|pediatric|paediatric|infant\w*|neonat\w*|febrile|pregnan\w*|preeclampsia|dental|dentist\w*|hiv|schizophreni\w*|antipsychotic|cancer|tumou?r|oncolog\w*|checkpoint inhibitors?|rats?|mice|murine|mouse|in vitro|veterinar\w*|dogs?|cats?|feline|canine|horses?|equine|case report|covid-19)\b/i;
/** Lab and basic-science work: rarely what a patient or a treating clinician needs. */
const BASIC_SCIENCE_TITLE =
  /\b(signal(l)?ing pathways?|patch(es)?|scaffolds?|nanoparticles?|exosomes?|stem cells?|gene therapy|biomaterials?|co-?crystals?|solubility|permeability|molecular docking|in silico|pharmacokinetic model\w*|genome-wide|mossy cells|dentate gyrus|neuronal|synaptic|molecular mechanisms?)\b/i;

/** "Seizures" → "seizure", "statin*" → "statin": a stem that matches singular and plural titles. */
const stem = (term: string): string => {
  const t = term.toLowerCase().replace(/\*$/, '');
  return t.length > 4 ? t.replace(/s$/, '') : t;
};

/**
 * Re-ranks articles and drops unrelated ones. `keyTerms` are the concepts the question is
 * about (a drug, a class, a condition): a title must mention one of them to be kept.
 * `boostTerms` (the aspect, question words) only order what's left. Titles about a different
 * population (children, pregnancy, animals…) are dropped unless the question mentions it.
 */
export function rankArticlesForQuestion<T extends { title: string }>(articles: T[], keyTerms: string[], question: string, boostTerms: string[] = []): T[] {
  const terms = keyTerms.map(stem).filter((t) => t.length >= 3);
  const boosts = [...boostTerms, ...keywords(question, 6)].map(stem).map((t) => (t.length > 5 ? t.slice(0, -1) : t)).filter((t) => t.length >= 3);
  const offTopicAllowed = OFF_TOPIC_TITLE.test(question);
  const basicAllowed = BASIC_SCIENCE_TITLE.test(question);
  const score = (title: string): number => {
    const lower = title.toLowerCase();
    let value = terms.filter((t) => lower.includes(t)).length * 2 + boosts.filter((t) => lower.includes(t)).length;
    if (!basicAllowed && BASIC_SCIENCE_TITLE.test(title)) value -= 3;
    return value;
  };
  // A different population (children, pregnancy, animals…) than the question asks about: leave it out.
  const relevant = (title: string): boolean => {
    const lower = title.toLowerCase();
    if (!offTopicAllowed && OFF_TOPIC_TITLE.test(title)) return false;
    return terms.length === 0 || terms.some((t) => lower.includes(t));
  };
  return articles
    .map((article, index) => ({ article, index, score: score(article.title) }))
    .filter((entry) => relevant(entry.article.title))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.article);
}
