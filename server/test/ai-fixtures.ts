// Shared, network-free fixtures for the AI / evidence tests.

import type { Db, DbData } from '../src/context';
import type {
  DrugLabel,
  EvidenceClient,
  MedlinePlusDrugPage,
  MedlinePlusTopic,
  NormalizedDrug,
  PubMedArticle,
} from '../src/evidence/types';
import type { Prescription, User, VisitNote } from '../src/shared/contracts';
import { config } from '../src/config';

export const NOTE_BODY =
  'F/u HTN & T2DM. BP 128/82, well controlled on lisinopril 10 mg PO qd. A1c 7.2% (down from 7.8%). ' +
  'Cont metformin 500 mg PO BID w/ meals. LDL 162 → start atorvastatin 20 mg PO qhs. ' +
  'Recheck lipids + CMP in 6–8 wks. Pt counseled re: diet/exercise, SE of statins (myalgias). RTC 3 mo, sooner PRN.';

const now = '2026-09-20T12:00:00.000Z';

const user = (id: string, role: User['role'], extra: Partial<User> = {}): User => ({
  id,
  email: `${id}@brian.demo`,
  name: id,
  role,
  avatar: null,
  createdAt: now,
  ...extra,
});

const rx = (id: string, patientId: string, drugName: string, strength: string, frequency: string, times: string[], extra: Partial<Prescription> = {}): Prescription => ({
  id,
  patientId,
  doctorId: 'doc',
  drugName,
  strength,
  form: 'tablet',
  dose: '1 tablet',
  route: 'by mouth',
  frequency,
  times,
  instructions: '',
  purpose: null,
  quantity: 30,
  refillsRemaining: 1,
  startDate: '2026-01-01',
  endDate: null,
  status: 'active',
  selfReported: false,
  createdAt: now,
  updatedAt: now,
  ...extra,
});

export function makeData(): DbData {
  const doctor = user('doc', 'doctor', { name: 'Dr. Daniel Reyes', doctor: { specialty: 'Internal Medicine', credentials: 'MD' }, avatar: 'doctor-photo' });
  const maya = user('maya', 'patient', {
    name: 'Maya Johnson',
    doctorId: 'doc',
    patient: { dateOfBirth: '1986-04-12', allergies: ['Penicillin'], conditions: ['Hypertension', 'Type 2 diabetes', 'High cholesterol'] },
  });
  const jordan = user('jordan', 'patient', { name: 'Jordan Lee', doctorId: 'doc', patient: { allergies: [], conditions: ['Asthma'] } });
  const outsider = user('otherdoc', 'doctor', { name: 'Dr. Other', doctor: { specialty: 'GP', credentials: 'MD' } });
  const note: VisitNote = { id: 'note_maya', patientId: 'maya', doctorId: 'doc', title: 'Follow-up: blood pressure & diabetes', body: NOTE_BODY, createdAt: now };
  const jordanNote: VisitNote = { id: 'note_jordan', patientId: 'jordan', doctorId: 'doc', title: 'Asthma check-in', body: 'Cont fluticasone 110 mcg 2 puffs BID.', createdAt: now };
  return {
    version: 1,
    users: [doctor, maya, jordan, outsider],
    sessions: [],
    messages: [],
    prescriptions: [
      rx('rx_lis', 'maya', 'Lisinopril', '10 mg', 'once daily', ['08:00'], { purpose: 'Blood pressure' }),
      rx('rx_met', 'maya', 'Metformin', '500 mg', 'twice daily', ['08:00', '19:00'], { purpose: 'Blood sugar' }),
      rx('rx_ator', 'maya', 'Atorvastatin', '20 mg', 'once daily at bedtime', ['21:00'], { purpose: 'Cholesterol' }),
      rx('rx_flu', 'jordan', 'Fluticasone HFA', '110 mcg', 'twice daily', ['08:00', '20:00'], { form: 'inhaler' }),
    ],
    doseLogs: [],
    refillRequests: [],
    visitNotes: [note, jordanNote],
    aiConversations: [],
  };
}

export function makeDb(data: DbData = makeData()): Db & { saves: number } {
  const db = {
    data,
    saves: 0,
    save() {
      db.saves += 1;
    },
    reset() {
      db.data = makeData();
    },
  };
  return db;
}

export const testConfig = { ...config, anthropicApiKey: '', evidenceOffline: false, claudeModel: 'claude-opus-5', claudeEffort: 'medium' as const };

// ── Evidence stubs ───────────────────────────────────────────────────────────

export const STROKE_TOPIC: MedlinePlusTopic = {
  title: 'Stroke',
  url: 'https://medlineplus.gov/stroke.html',
  altTitles: ['Brain Attack', 'CVA'],
  groups: ['Brain and Nerves'],
  snippet: 'A stroke happens when there is a loss of blood flow to part of the brain.',
  summary: 'A stroke happens when there is a loss of blood flow to part of the brain. If you think someone is having a stroke, call 911 right away.',
  blocks: [
    { kind: 'heading', text: 'What is a stroke?' },
    { kind: 'paragraph', text: 'A stroke happens when there is a loss of blood flow to part of the brain. Your brain cells start to die within a few minutes.' },
    { kind: 'paragraph', text: 'If you think that you or someone else is having a stroke, call 911 right away.' },
    { kind: 'heading', text: 'What are the symptoms of a stroke?' },
    { kind: 'item', text: 'Sudden numbness or weakness of the face, arm, or leg' },
    { kind: 'item', text: 'Sudden confusion, trouble speaking, or understanding speech' },
  ],
  rank: 0,
};

export const HBP_TOPIC: MedlinePlusTopic = {
  title: 'High Blood Pressure',
  url: 'https://medlineplus.gov/highbloodpressure.html',
  altTitles: ['Hypertension'],
  groups: [],
  snippet: 'High blood pressure is when blood pushes too hard against artery walls.',
  summary: 'High blood pressure, also called hypertension, is when blood puts too much pressure against the walls of your arteries.',
  blocks: [
    { kind: 'heading', text: 'What is high blood pressure?' },
    { kind: 'paragraph', text: 'High blood pressure, also called hypertension, is when blood puts too much pressure against the walls of your arteries.' },
  ],
  rank: 0,
};

export const ARTICLE: PubMedArticle = {
  pmid: '31937550',
  title: 'Non-steroidal anti-inflammatory drug (NSAID) therapy in patients with hypertension: recommendations.',
  journal: 'Gut',
  year: '2020',
  authors: ['Szeto CC', 'Sugano K'],
  publicationTypes: ['Journal Article', 'Practice Guideline'],
  abstract: 'NSAIDs are valuable but carry risks. Appropriate recognition of high-risk cases is necessary.',
  conclusion: null,
  url: 'https://pubmed.ncbi.nlm.nih.gov/31937550/',
};

export const STROKE_ARTICLE: PubMedArticle = {
  pmid: '30000001',
  title: 'Recognition of stroke symptoms by the public: a systematic review.',
  journal: 'Stroke',
  year: '2022',
  authors: ['Doe A', 'Roe B'],
  publicationTypes: ['Journal Article', 'Systematic Review'],
  abstract: 'Public recognition of stroke warning signs is limited. Education campaigns improve recognition and prompt calls to emergency services.',
  conclusion: null,
  url: 'https://pubmed.ncbi.nlm.nih.gov/30000001/',
};

const label = (generic: string, productType: string, sections: DrugLabel['sections'], setId: string): DrugLabel => ({
  setId,
  brandNames: [],
  genericName: generic,
  substances: [generic.toUpperCase()],
  manufacturer: 'Test Pharma',
  productType,
  effectiveDate: '20260101',
  rxcuis: [],
  pharmClasses: [],
  sections,
  dailyMedUrl: `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${setId}`,
});

export const LABELS: Record<string, DrugLabel> = {
  lisinopril: label(
    'lisinopril',
    'HUMAN PRESCRIPTION DRUG',
    {
      indications: 'Lisinopril is an angiotensin converting enzyme (ACE) inhibitor indicated for: • Treatment of hypertension • Adjunct therapy for heart failure 1.1 Hypertension Lisinopril is indicated…',
      dosage: '• Hypertension: Initial adult dose is 10 mg once daily. Titrate up to 40 mg daily 2.1 Hypertension …',
      boxedWarning: 'WARNING: FETAL TOXICITY • When pregnancy is detected, discontinue lisinopril as soon as possible.',
      interactions:
        '• Diuretics: Excessive drop in blood pressure • NSAIDS: Increased risk of renal impairment and loss of antihypertensive efficacy • Lithium: Symptoms of lithium toxicity 7.1 Diuretics Initiation…',
    },
    'lis-set',
  ),
  ibuprofen: label(
    'ibuprofen',
    'HUMAN OTC DRUG',
    {
      indications: 'temporarily relieves minor aches and pains due to: • headache • toothache',
      dosage: '• adults: take 1 tablet every 4 to 6 hours • do not exceed 6 tablets in 24 hours',
      warnings: 'Allergy alert: Ibuprofen may cause a severe allergic reaction, especially in people allergic to aspirin. Stomach bleeding warning: This product contains an NSAID, which may cause severe stomach bleeding.',
      askDoctor: 'Ask a doctor before use if • you have high blood pressure, heart disease, kidney disease • you are taking a diuretic',
    },
    'ibu-set',
  ),
  metformin: label('metformin', 'HUMAN PRESCRIPTION DRUG', { indications: 'Metformin is indicated to improve glycemic control in adults with type 2 diabetes mellitus.' }, 'met-set'),
  atorvastatin: label(
    'atorvastatin',
    'HUMAN PRESCRIPTION DRUG',
    {
      indications: 'Atorvastatin is indicated to reduce the risk of MI and stroke.',
      interactions:
        'Grapefruit Juice Clinical Impact: Grapefruit juice consumption, especially excessive consumption, more than 1.2 liters/daily, can raise the plasma levels of atorvastatin and may increase the risk of myopathy and rhabdomyolysis. Intervention: Avoid intake of large quantities of grapefruit juice.',
    },
    'ator-set',
  ),
  amoxicillin: label('amoxicillin', 'HUMAN PRESCRIPTION DRUG', { indications: 'Amoxicillin is indicated for infections caused by susceptible bacteria.' }, 'amox-set'),
};

const drugPage = (name: string, slug: string, summary: string): MedlinePlusDrugPage => ({
  title: name,
  url: `https://medlineplus.gov/druginfo/meds/${slug}.html`,
  summary,
  relatedTopics: [],
});

export const DRUG_PAGES: Record<string, MedlinePlusDrugPage> = {
  lisinopril: drugPage('Lisinopril', 'a692051', 'Lisinopril is used to treat high blood pressure. It is in a class of medications called ACE inhibitors.'),
  ibuprofen: drugPage('Ibuprofen', 'a682159', 'Nonprescription ibuprofen is used to reduce fever and to relieve minor aches and pain. Ibuprofen is in a class of medications called NSAIDs.'),
  metformin: drugPage('Metformin', 'a696005', 'Metformin is used to treat type 2 diabetes.'),
  atorvastatin: drugPage('Atorvastatin', 'a600045', 'Atorvastatin is used to lower cholesterol. It is in a class of medications called statins.'),
};

export interface StubCalls {
  pubmed: string[];
  medlineplus: string[];
  labels: string[];
}

/** Deterministic in-memory EvidenceClient. */
export function stubEvidence(options: { offline?: boolean; failAll?: boolean } = {}): EvidenceClient & { calls: StubCalls } {
  const calls: StubCalls = { pubmed: [], medlineplus: [], labels: [] };
  const fail = async (): Promise<never> => {
    throw new Error('network down');
  };
  const offline = options.offline ?? false;
  return {
    offline,
    calls,
    async searchPubMed(query) {
      calls.pubmed.push(query);
      if (options.failAll) return fail();
      if (offline) return [];
      return /stroke/i.test(query) ? [STROKE_ARTICLE] : [ARTICLE];
    },
    async searchMedlinePlus(term) {
      calls.medlineplus.push(term);
      if (options.failAll) return fail();
      if (offline) return [];
      if (/stroke/i.test(term)) return [STROKE_TOPIC];
      if (/blood pressure/i.test(term)) return [HBP_TOPIC];
      return [];
    },
    async medlinePlusDrug(input) {
      if (options.failAll) return fail();
      return offline ? null : DRUG_PAGES[input.name.toLowerCase()] ?? null;
    },
    async drugLabel(name) {
      calls.labels.push(name);
      if (options.failAll) return fail();
      return offline ? null : LABELS[name.toLowerCase()] ?? null;
    },
    async normalizeDrug(term): Promise<NormalizedDrug | null> {
      if (options.failAll) return fail();
      if (offline) return null;
      const name = term.toLowerCase().replace(/\s+(hfa|tablet)$/, '');
      return { query: term, rxcui: `rx-${name}`, name, inputTty: 'IN', brandNames: [] };
    },
    async rxcuiForName() {
      return null;
    },
  };
}

/** All [n] markers in `content` must map to a citation with that id, numbered 1..k. */
export function citationMarkers(content: string): string[] {
  return [...content.matchAll(/\[(\d+)\]/g)].map((m) => m[1]!);
}
