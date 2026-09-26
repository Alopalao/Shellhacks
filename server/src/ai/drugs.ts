// A small local dictionary of common US medicines: detects drug names in free text
// (generic + brand), knows each drug's class, and powers allergy/interaction checks
// against FDA label text. RxNorm (evidence/rxnorm.ts) covers everything not listed here.

export type DrugClass =
  | 'nsaid'
  | 'analgesic'
  | 'ace-inhibitor'
  | 'arb'
  | 'raas'
  | 'ccb'
  | 'beta-blocker'
  | 'diuretic'
  | 'potassium-sparing'
  | 'antihypertensive'
  | 'statin'
  | 'antidiabetic'
  | 'insulin'
  | 'sulfonylurea'
  | 'anticoagulant'
  | 'antiplatelet'
  | 'ssri'
  | 'snri'
  | 'serotonergic'
  | 'antidepressant'
  | 'ppi'
  | 'thyroid'
  | 'penicillin'
  | 'cephalosporin'
  | 'macrolide'
  | 'sulfonamide'
  | 'fluoroquinolone'
  | 'antibiotic'
  | 'bronchodilator'
  | 'corticosteroid'
  | 'opioid'
  | 'benzodiazepine'
  | 'sedative'
  | 'antihistamine'
  | 'decongestant'
  | 'pde5'
  | 'nitrate'
  | 'anticonvulsant'
  | 'lithium'
  | 'supplement'
  | 'potassium'
  | 'maoi';

export interface DrugClassInfo {
  label: string;
  /** Patterns that mean "this class" inside another drug's FDA label text. */
  labelPatterns: RegExp[];
  /** PubMed title/abstract terms for this class. */
  pubmed: string[];
}

export const DRUG_CLASSES: Record<DrugClass, DrugClassInfo> = {
  nsaid: { label: 'NSAID (anti-inflammatory pain reliever)', labelPatterns: [/\bNSAIDs?\b/i, /non-?steroidal anti-?inflammatory/i, /\bCOX-2\b/i], pubmed: ['NSAID*', 'nonsteroidal anti-inflammatory'] },
  analgesic: { label: 'pain reliever', labelPatterns: [/\bacetaminophen\b/i], pubmed: ['analgesic*'] },
  'ace-inhibitor': { label: 'ACE inhibitor (blood pressure medicine)', labelPatterns: [/\bACE inhibitors?\b/i, /angiotensin[- ]converting[- ]enzyme/i], pubmed: ['ACE inhibitor*', 'angiotensin-converting enzyme inhibitor*'] },
  arb: { label: 'ARB (blood pressure medicine)', labelPatterns: [/angiotensin (II )?receptor (blocker|antagonist)s?/i, /\bARBs?\b/] , pubmed: ['angiotensin receptor', 'ARB*'] },
  raas: { label: 'renin-angiotensin blocker', labelPatterns: [/renin[- ]angiotensin/i, /\bRAAS?\b/], pubmed: ['renin-angiotensin'] },
  ccb: { label: 'calcium channel blocker', labelPatterns: [/calcium (channel )?blockers?/i], pubmed: ['calcium channel blocker*'] },
  'beta-blocker': { label: 'beta blocker', labelPatterns: [/beta[- ]?(adrenergic )?blockers?/i, /beta[- ]blocking/i], pubmed: ['beta blocker*', 'beta-blocker*'] },
  diuretic: { label: 'diuretic ("water pill")', labelPatterns: [/\bdiuretics?\b/i, /water pills?/i], pubmed: ['diuretic*'] },
  'potassium-sparing': { label: 'potassium-sparing diuretic', labelPatterns: [/potassium[- ]sparing/i, /spironolactone|amiloride|triamterene|eplerenone/i], pubmed: ['potassium-sparing'] },
  antihypertensive: { label: 'blood pressure medicine', labelPatterns: [/antihypertensive/i, /blood pressure (medicine|medication|drug)s?/i], pubmed: ['antihypertensive*', 'blood pressure', 'hypertension'] },
  statin: { label: 'statin (cholesterol medicine)', labelPatterns: [/\bstatins?\b/i, /HMG[- ]CoA reductase/i], pubmed: ['statin*'] },
  antidiabetic: { label: 'diabetes medicine', labelPatterns: [/antidiabetic/i, /hypoglycemic (agents?|drugs?|medicines?)/i, /blood[- ]glucose[- ]lowering/i, /\binsulin\b/i, /diabetes (medicine|medication|drug)s?/i], pubmed: ['diabetes', 'glucose-lowering'] },
  insulin: { label: 'insulin', labelPatterns: [/\binsulins?\b/i], pubmed: ['insulin'] },
  sulfonylurea: { label: 'sulfonylurea (diabetes medicine)', labelPatterns: [/sulfonylureas?/i], pubmed: ['sulfonylurea*'] },
  anticoagulant: { label: 'blood thinner (anticoagulant)', labelPatterns: [/anticoagulants?/i, /blood[- ]thinn\w+/i, /\bwarfarin\b/i], pubmed: ['anticoagulant*'] },
  antiplatelet: { label: 'antiplatelet medicine', labelPatterns: [/antiplatelet/i, /\baspirin\b/i, /clopidogrel/i], pubmed: ['antiplatelet'] },
  ssri: { label: 'SSRI antidepressant', labelPatterns: [/\bSSRIs?\b/, /selective serotonin reuptake/i], pubmed: ['SSRI*', 'selective serotonin reuptake inhibitor*'] },
  snri: { label: 'SNRI antidepressant', labelPatterns: [/\bSNRIs?\b/, /serotonin[- ]norepinephrine/i], pubmed: ['SNRI*'] },
  serotonergic: { label: 'serotonergic medicine', labelPatterns: [/serotonergic/i, /serotonin syndrome/i], pubmed: ['serotonin syndrome'] },
  antidepressant: { label: 'antidepressant', labelPatterns: [], pubmed: ['antidepressant*'] },
  ppi: { label: 'proton pump inhibitor (acid reducer)', labelPatterns: [/proton pump inhibitors?/i, /\bPPIs?\b/], pubmed: ['proton pump inhibitor*'] },
  thyroid: { label: 'thyroid hormone', labelPatterns: [/thyroid hormones?/i, /levothyroxine/i], pubmed: ['levothyroxine'] },
  penicillin: { label: 'penicillin-type antibiotic', labelPatterns: [/penicillins?/i], pubmed: ['penicillin*'] },
  cephalosporin: { label: 'cephalosporin antibiotic', labelPatterns: [/cephalosporins?/i], pubmed: ['cephalosporin*'] },
  macrolide: { label: 'macrolide antibiotic', labelPatterns: [/macrolides?/i, /clarithromycin|erythromycin/i], pubmed: ['macrolide*'] },
  sulfonamide: { label: 'sulfa medicine', labelPatterns: [/sulfonamides?/i, /\bsulfa\b/i], pubmed: ['sulfonamide*'] },
  fluoroquinolone: { label: 'fluoroquinolone antibiotic', labelPatterns: [/fluoroquinolones?|quinolones?/i], pubmed: ['fluoroquinolone*'] },
  // Labels name antibiotic subclasses ("macrolide antibiotics"); a generic match would mislead.
  antibiotic: { label: 'antibiotic', labelPatterns: [], pubmed: ['antibiotic*'] },
  bronchodilator: { label: 'bronchodilator (rescue inhaler)', labelPatterns: [/bronchodilators?/i, /beta[- ]?agonists?/i, /sympathomimetic/i], pubmed: ['bronchodilator*', 'beta-agonist*'] },
  corticosteroid: { label: 'corticosteroid (steroid)', labelPatterns: [/corticosteroids?/i, /\bsteroids?\b/i], pubmed: ['corticosteroid*'] },
  opioid: { label: 'opioid pain medicine', labelPatterns: [/opioids?/i, /narcotics?/i], pubmed: ['opioid*'] },
  benzodiazepine: { label: 'benzodiazepine', labelPatterns: [/benzodiazepines?/i], pubmed: ['benzodiazepine*'] },
  sedative: { label: 'sedative', labelPatterns: [/CNS depressants?/i, /sedatives?/i, /\bsleep aids?\b/i], pubmed: ['sedative*'] },
  antihistamine: { label: 'antihistamine', labelPatterns: [/antihistamines?/i], pubmed: ['antihistamine*'] },
  decongestant: { label: 'decongestant', labelPatterns: [/decongestants?/i, /pseudoephedrine|phenylephrine/i], pubmed: ['decongestant*'] },
  pde5: { label: 'PDE5 inhibitor', labelPatterns: [/PDE-?5 inhibitors?/i, /sildenafil|tadalafil|vardenafil/i], pubmed: ['phosphodiesterase 5'] },
  nitrate: { label: 'nitrate (chest pain medicine)', labelPatterns: [/\bnitrates?\b/i, /nitroglycerin/i], pubmed: ['nitrate*'] },
  anticonvulsant: { label: 'seizure medicine', labelPatterns: [/anticonvulsants?|antiepileptics?/i], pubmed: ['antiepileptic*'] },
  lithium: { label: 'lithium', labelPatterns: [/\blithium\b/i], pubmed: ['lithium'] },
  supplement: { label: 'supplement', labelPatterns: [], pubmed: [] },
  potassium: { label: 'potassium supplement', labelPatterns: [/potassium supplements?/i, /potassium[- ]containing/i, /salt substitutes?/i], pubmed: ['potassium'] },
  maoi: { label: 'MAO inhibitor', labelPatterns: [/\bMAOIs?\b/, /monoamine oxidase inhibitors?/i], pubmed: ['monoamine oxidase inhibitor*'] },
};

export interface DrugEntry {
  /** Generic name, lower case. */
  name: string;
  brands: string[];
  classes: DrugClass[];
  otc?: boolean;
  /** Other spellings / common shorthand. */
  aliases?: string[];
}

const D = (name: string, brands: string[], classes: DrugClass[], extra: Partial<Pick<DrugEntry, 'otc' | 'aliases'>> = {}): DrugEntry => ({
  name,
  brands,
  classes,
  ...extra,
});

export const DRUGS: DrugEntry[] = [
  // Pain / fever
  D('ibuprofen', ['Advil', 'Motrin'], ['nsaid'], { otc: true }),
  D('naproxen', ['Aleve', 'Naprosyn'], ['nsaid'], { otc: true }),
  D('aspirin', ['Bayer', 'Ecotrin'], ['nsaid', 'antiplatelet'], { otc: true, aliases: ['asa', 'baby aspirin'] }),
  D('celecoxib', ['Celebrex'], ['nsaid']),
  D('meloxicam', ['Mobic'], ['nsaid']),
  D('diclofenac', ['Voltaren'], ['nsaid']),
  D('acetaminophen', ['Tylenol'], ['analgesic'], { otc: true, aliases: ['paracetamol', 'apap'] }),
  D('tramadol', ['Ultram'], ['opioid', 'serotonergic']),
  D('oxycodone', ['OxyContin', 'Percocet'], ['opioid']),
  D('hydrocodone', ['Norco', 'Vicodin'], ['opioid']),
  D('morphine', [], ['opioid']),
  D('codeine', [], ['opioid']),
  D('gabapentin', ['Neurontin'], ['anticonvulsant']),
  D('pregabalin', ['Lyrica'], ['anticonvulsant']),
  D('cyclobenzaprine', ['Flexeril'], ['sedative']),
  // Blood pressure / heart
  D('lisinopril', ['Zestril', 'Prinivil', 'Qbrelis'], ['ace-inhibitor', 'raas', 'antihypertensive']),
  D('enalapril', ['Vasotec'], ['ace-inhibitor', 'raas', 'antihypertensive']),
  D('ramipril', ['Altace'], ['ace-inhibitor', 'raas', 'antihypertensive']),
  D('benazepril', ['Lotensin'], ['ace-inhibitor', 'raas', 'antihypertensive']),
  D('losartan', ['Cozaar'], ['arb', 'raas', 'antihypertensive']),
  D('valsartan', ['Diovan'], ['arb', 'raas', 'antihypertensive']),
  D('olmesartan', ['Benicar'], ['arb', 'raas', 'antihypertensive']),
  D('irbesartan', ['Avapro'], ['arb', 'raas', 'antihypertensive']),
  D('amlodipine', ['Norvasc'], ['ccb', 'antihypertensive']),
  D('diltiazem', ['Cardizem'], ['ccb', 'antihypertensive']),
  D('verapamil', ['Calan'], ['ccb', 'antihypertensive']),
  D('nifedipine', ['Procardia'], ['ccb', 'antihypertensive']),
  D('metoprolol', ['Lopressor', 'Toprol XL'], ['beta-blocker', 'antihypertensive']),
  D('atenolol', ['Tenormin'], ['beta-blocker', 'antihypertensive']),
  D('carvedilol', ['Coreg'], ['beta-blocker', 'antihypertensive']),
  D('propranolol', ['Inderal'], ['beta-blocker', 'antihypertensive']),
  D('hydrochlorothiazide', ['Microzide'], ['diuretic', 'antihypertensive'], { aliases: ['hctz'] }),
  D('chlorthalidone', ['Thalitone'], ['diuretic', 'antihypertensive']),
  D('furosemide', ['Lasix'], ['diuretic', 'antihypertensive']),
  D('spironolactone', ['Aldactone'], ['diuretic', 'potassium-sparing', 'antihypertensive']),
  D('nitroglycerin', ['Nitrostat'], ['nitrate'], { aliases: ['ntg'] }),
  D('isosorbide mononitrate', ['Imdur'], ['nitrate']),
  D('digoxin', ['Lanoxin'], []),
  // Cholesterol
  D('atorvastatin', ['Lipitor'], ['statin']),
  D('simvastatin', ['Zocor'], ['statin']),
  D('rosuvastatin', ['Crestor'], ['statin']),
  D('pravastatin', ['Pravachol'], ['statin']),
  D('lovastatin', ['Mevacor'], ['statin']),
  D('ezetimibe', ['Zetia'], []),
  // Diabetes
  D('metformin', ['Glucophage'], ['antidiabetic']),
  D('glipizide', ['Glucotrol'], ['antidiabetic', 'sulfonylurea']),
  D('glyburide', ['Diabeta'], ['antidiabetic', 'sulfonylurea']),
  D('glimepiride', ['Amaryl'], ['antidiabetic', 'sulfonylurea']),
  D('insulin', ['Lantus', 'Humalog', 'Novolog', 'Levemir', 'Basaglar', 'Tresiba'], ['antidiabetic', 'insulin'], { aliases: ['insulin glargine', 'insulin lispro'] }),
  D('semaglutide', ['Ozempic', 'Wegovy', 'Rybelsus'], ['antidiabetic']),
  D('tirzepatide', ['Mounjaro', 'Zepbound'], ['antidiabetic']),
  D('liraglutide', ['Victoza', 'Saxenda'], ['antidiabetic']),
  D('dulaglutide', ['Trulicity'], ['antidiabetic']),
  D('empagliflozin', ['Jardiance'], ['antidiabetic']),
  D('dapagliflozin', ['Farxiga'], ['antidiabetic']),
  D('sitagliptin', ['Januvia'], ['antidiabetic']),
  // Blood thinners
  D('warfarin', ['Coumadin', 'Jantoven'], ['anticoagulant']),
  D('apixaban', ['Eliquis'], ['anticoagulant']),
  D('rivaroxaban', ['Xarelto'], ['anticoagulant']),
  D('dabigatran', ['Pradaxa'], ['anticoagulant']),
  D('clopidogrel', ['Plavix'], ['antiplatelet']),
  // Mental health / sleep
  D('sertraline', ['Zoloft'], ['ssri', 'serotonergic', 'antidepressant']),
  D('fluoxetine', ['Prozac'], ['ssri', 'serotonergic', 'antidepressant']),
  D('escitalopram', ['Lexapro'], ['ssri', 'serotonergic', 'antidepressant']),
  D('citalopram', ['Celexa'], ['ssri', 'serotonergic', 'antidepressant']),
  D('paroxetine', ['Paxil'], ['ssri', 'serotonergic', 'antidepressant']),
  D('venlafaxine', ['Effexor'], ['snri', 'serotonergic', 'antidepressant']),
  D('duloxetine', ['Cymbalta'], ['snri', 'serotonergic', 'antidepressant']),
  D('bupropion', ['Wellbutrin', 'Zyban'], ['antidepressant']),
  D('trazodone', ['Desyrel'], ['antidepressant', 'serotonergic', 'sedative']),
  D('mirtazapine', ['Remeron'], ['antidepressant', 'sedative']),
  D('alprazolam', ['Xanax'], ['benzodiazepine', 'sedative']),
  D('lorazepam', ['Ativan'], ['benzodiazepine', 'sedative']),
  D('clonazepam', ['Klonopin'], ['benzodiazepine', 'sedative']),
  D('zolpidem', ['Ambien'], ['sedative']),
  D('lithium', ['Lithobid'], ['lithium']),
  D('quetiapine', ['Seroquel'], ['sedative']),
  // Stomach
  D('omeprazole', ['Prilosec'], ['ppi'], { otc: true }),
  D('esomeprazole', ['Nexium'], ['ppi'], { otc: true }),
  D('pantoprazole', ['Protonix'], ['ppi']),
  D('famotidine', ['Pepcid'], [], { otc: true }),
  D('ondansetron', ['Zofran'], ['serotonergic']),
  D('loperamide', ['Imodium'], [], { otc: true }),
  D('bismuth subsalicylate', ['Pepto-Bismol'], [], { otc: true }),
  // Thyroid
  D('levothyroxine', ['Synthroid', 'Levoxyl', 'Unithroid'], ['thyroid']),
  // Antibiotics
  D('amoxicillin', ['Amoxil'], ['penicillin', 'antibiotic']),
  D('amoxicillin-clavulanate', ['Augmentin'], ['penicillin', 'antibiotic'], { aliases: ['amoxicillin clavulanate', 'amox-clav'] }),
  D('penicillin', ['Pen VK'], ['penicillin', 'antibiotic']),
  D('ampicillin', [], ['penicillin', 'antibiotic']),
  D('cephalexin', ['Keflex'], ['cephalosporin', 'antibiotic']),
  D('azithromycin', ['Zithromax', 'Z-Pak'], ['macrolide', 'antibiotic']),
  D('clarithromycin', ['Biaxin'], ['macrolide', 'antibiotic']),
  D('doxycycline', ['Vibramycin'], ['antibiotic']),
  D('ciprofloxacin', ['Cipro'], ['fluoroquinolone', 'antibiotic']),
  D('levofloxacin', ['Levaquin'], ['fluoroquinolone', 'antibiotic']),
  D('nitrofurantoin', ['Macrobid'], ['antibiotic']),
  D('sulfamethoxazole-trimethoprim', ['Bactrim', 'Septra'], ['sulfonamide', 'antibiotic'], { aliases: ['smx-tmp', 'tmp-smx'] }),
  // Lungs / allergy
  D('albuterol', ['ProAir', 'Ventolin', 'Proventil'], ['bronchodilator'], { aliases: ['salbutamol'] }),
  D('fluticasone', ['Flovent', 'Flonase'], ['corticosteroid']),
  D('budesonide', ['Pulmicort'], ['corticosteroid']),
  D('montelukast', ['Singulair'], []),
  D('prednisone', ['Deltasone'], ['corticosteroid']),
  D('methylprednisolone', ['Medrol'], ['corticosteroid']),
  D('loratadine', ['Claritin'], ['antihistamine'], { otc: true }),
  D('cetirizine', ['Zyrtec'], ['antihistamine'], { otc: true }),
  D('fexofenadine', ['Allegra'], ['antihistamine'], { otc: true }),
  D('diphenhydramine', ['Benadryl'], ['antihistamine', 'sedative'], { otc: true }),
  D('pseudoephedrine', ['Sudafed'], ['decongestant'], { otc: true }),
  D('dextromethorphan', ['Delsym', 'Robitussin DM'], ['serotonergic'], { otc: true }),
  D('guaifenesin', ['Mucinex'], [], { otc: true }),
  D('epinephrine', ['EpiPen', 'Auvi-Q'], []),
  D('naloxone', ['Narcan'], [], { otc: true }),
  // Other common
  D('sildenafil', ['Viagra', 'Revatio'], ['pde5']),
  D('tadalafil', ['Cialis'], ['pde5']),
  D('tamsulosin', ['Flomax'], []),
  D('finasteride', ['Proscar', 'Propecia'], []),
  D('allopurinol', ['Zyloprim'], []),
  D('methotrexate', ['Trexall'], []),
  D('isotretinoin', ['Accutane', 'Absorica'], []),
  D('minoxidil', ['Rogaine'], [], { otc: true }),
  D('potassium chloride', ['Klor-Con'], ['potassium'], { aliases: ['kcl'] }),
  // Supplements
  D('vitamin d', [], ['supplement'], { otc: true, aliases: ['vitamin d3', 'vitamin d 3', 'cholecalciferol', 'vitamin d2', 'ergocalciferol'] }),
  D('fish oil', [], ['supplement'], { otc: true, aliases: ['omega-3', 'omega 3'] }),
  D("st. john's wort", [], ['supplement', 'serotonergic'], { otc: true, aliases: ["st john's wort", 'st johns wort'] }),
  D('melatonin', [], ['supplement'], { otc: true }),
  D('magnesium', [], ['supplement'], { otc: true }),
  D('iron', [], ['supplement'], { otc: true, aliases: ['ferrous sulfate'] }),
  D('calcium', [], ['supplement'], { otc: true, aliases: ['calcium carbonate'] }),
  D('multivitamin', [], ['supplement'], { otc: true, aliases: ['multivitamins'] }),
  D('turmeric', [], ['supplement'], { otc: true, aliases: ['curcumin'] }),
  D('ginkgo', [], ['supplement'], { otc: true, aliases: ['ginkgo biloba'] }),
];

const BY_NAME = new Map<string, DrugEntry>();
for (const entry of DRUGS) {
  for (const key of [entry.name, ...entry.brands, ...(entry.aliases ?? [])]) BY_NAME.set(key.toLowerCase(), entry);
}

/** Formulation words to strip from prescription names ("Albuterol HFA" → "albuterol"). */
const FORMULATION = /\b(hfa|er|xr|xl|sr|cr|dr|la|odt|ec|ir|extended[- ]release|delayed[- ]release|immediate[- ]release|tablets?|tabs?|capsules?|caps?|inhaler|oral|solution|suspension|injection|pen|cream|ointment|gel|patch|spray|drops|chewable|softgels?|\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|units?|%))\b/gi;

export function cleanDrugName(name: string): string {
  return name.replace(FORMULATION, ' ').replace(/[^\w\s'.-]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function lookupDrug(name: string): DrugEntry | null {
  const clean = cleanDrugName(name);
  return BY_NAME.get(clean) ?? BY_NAME.get(name.trim().toLowerCase()) ?? null;
}

export interface DrugMention {
  /** Generic (or cleaned) name, lower case. */
  name: string;
  /** Text as it appeared. */
  matched: string;
  index: number;
  entry: DrugEntry | null;
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Longest-first alternation of every known name/brand/alias. */
const MENTION_REGEX = new RegExp(
  `(?<![A-Za-z0-9])(${[...BY_NAME.keys()]
    .filter((key) => key.length >= 3)
    .sort((a, b) => b.length - a.length)
    .map((key) => escapeRegex(key).replace(/\\ | /g, '[\\s-]?'))
    .join('|')})(?![A-Za-z0-9])`,
  'gi',
);

/**
 * Drug names in `text`, first-mention order, one per generic. `extraNames` (e.g. the
 * patient's own prescriptions) are matched too, even when not in the dictionary.
 */
export function findDrugMentions(text: string, extraNames: string[] = []): DrugMention[] {
  const found: DrugMention[] = [];
  const add = (name: string, matched: string, index: number, entry: DrugEntry | null) => {
    if (found.some((f) => f.name === name)) return;
    found.push({ name, matched, index, entry });
  };
  MENTION_REGEX.lastIndex = 0;
  for (let m = MENTION_REGEX.exec(text); m; m = MENTION_REGEX.exec(text)) {
    const entry = BY_NAME.get(m[0].toLowerCase().replace(/-/g, ' ')) ?? BY_NAME.get(m[0].toLowerCase()) ?? lookupDrug(m[0]);
    if (entry) add(entry.name, m[0], m.index, entry);
  }
  for (const raw of extraNames) {
    const clean = cleanDrugName(raw);
    if (clean.length < 3) continue;
    const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegex(clean).replace(/\\ | /g, '[\\s-]?')}(?![A-Za-z0-9])`, 'i');
    const m = re.exec(text);
    if (m) {
      const entry = lookupDrug(clean);
      add(entry?.name ?? clean, m[0], m.index, entry);
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

/** Classes for a drug: dictionary first, then FDA "established pharmacologic class" strings. */
export function drugClasses(name: string, epcClasses: string[] = []): DrugClass[] {
  const entry = lookupDrug(name);
  const classes = new Set<DrugClass>(entry?.classes ?? []);
  for (const epc of epcClasses.map((c) => c.toLowerCase())) {
    if (epc.includes('nonsteroidal anti-inflammatory')) classes.add('nsaid');
    if (epc.includes('angiotensin converting enzyme')) classes.add('ace-inhibitor').add('raas').add('antihypertensive');
    if (epc.includes('angiotensin 2 receptor') || epc.includes('angiotensin ii receptor')) classes.add('arb').add('raas').add('antihypertensive');
    if (epc.includes('hmg-coa reductase')) classes.add('statin');
    if (epc.includes('biguanide') || epc.includes('sulfonylurea') || epc.includes('glucagon-like') || epc.includes('sodium-glucose')) classes.add('antidiabetic');
    if (epc.includes('insulin')) classes.add('insulin').add('antidiabetic');
    if (epc.includes('anticoagulant') || epc.includes('factor xa') || epc.includes('vitamin k antagonist')) classes.add('anticoagulant');
    if (epc.includes('platelet')) classes.add('antiplatelet');
    if (epc.includes('serotonin reuptake')) classes.add('ssri').add('serotonergic');
    if (epc.includes('proton pump')) classes.add('ppi');
    if (epc.includes('beta-adrenergic blocker') || epc.includes('beta adrenergic blocker')) classes.add('beta-blocker').add('antihypertensive');
    if (epc.includes('calcium channel blocker')) classes.add('ccb').add('antihypertensive');
    if (epc.includes('diuretic')) classes.add('diuretic');
    if (epc.includes('opioid agonist')) classes.add('opioid');
    if (epc.includes('benzodiazepine')) classes.add('benzodiazepine');
    if (epc.includes('corticosteroid')) classes.add('corticosteroid');
    if (epc.includes('penicillin')) classes.add('penicillin').add('antibiotic');
    if (epc.includes('cephalosporin')) classes.add('cephalosporin').add('antibiotic');
    if (epc.includes('beta2-adrenergic agonist') || epc.includes('beta-2 adrenergic agonist')) classes.add('bronchodilator');
    if (epc.includes('histamine-1 receptor antagonist') || epc.includes('histamine h1')) classes.add('antihistamine');
  }
  return [...classes];
}

export function isSupplement(name: string): boolean {
  return lookupDrug(name)?.classes.includes('supplement') ?? false;
}

export function isOtc(name: string): boolean {
  return lookupDrug(name)?.otc ?? false;
}

/** "NSAID (anti-inflammatory pain reliever)" → "NSAIDs"; "diabetes medicine" → "diabetes medicines". */
export function classPlural(label: string): string {
  const base = label.replace(/\s*\(.*\)\s*$/, '').trim();
  return base.endsWith('s') ? base : `${base}s`;
}

/** Plain-language class description for a drug, e.g. "an NSAID (anti-inflammatory pain reliever)". */
export function classDescription(name: string, epcClasses: string[] = []): string | null {
  const primary = drugClasses(name, epcClasses).find((c) => !['raas', 'antihypertensive', 'serotonergic', 'antibiotic'].includes(c));
  return primary ? DRUG_CLASSES[primary].label : null;
}

/**
 * Condition phrases FDA labels use, keyed by patterns that match a patient's condition list.
 * Qualified forms are different conditions: "intracranial hypertension" (pseudotumor
 * cerebri) is not high blood pressure, and "renal elimination" is not kidney disease.
 */
const CONDITION_TERMS: Array<{ condition: RegExp; label: RegExp; plain: string }> = [
  {
    condition: /hypertension|high blood pressure|\bhtn\b/i,
    label: /high blood pressure|(?<!(?:intracranial|pulmonary|portal|ocular|intraocular|idiopathic intracranial|arterial pulmonary) )\bhypertension\b(?! \(pseudotumor)/i,
    plain: 'high blood pressure',
  },
  { condition: /diabetes|\bt2dm\b|\bdm\b/i, label: /\bdiabet\w*/i, plain: 'diabetes' },
  {
    condition: /kidney|renal|\bckd\b/i,
    label: /\bkidney (disease|problems?|impairment|failure|damage)\b|\brenal (impairment|disease|failure|insufficiency|dysfunction)\b/i,
    plain: 'kidney disease',
  },
  { condition: /heart (disease|failure)|\bchf\b|\bcad\b|coronary|heart attack/i, label: /heart (disease|failure|attack)/i, plain: 'heart disease' },
  { condition: /asthma/i, label: /\basthma\b/i, plain: 'asthma' },
  { condition: /liver|cirrhosis|hepat/i, label: /\bliver\b|cirrhosis/i, plain: 'liver disease' },
  { condition: /ulcer|gi bleed|stomach bleed/i, label: /ulcers?|stomach bleeding|stomach problems/i, plain: 'stomach ulcers or bleeding' },
  { condition: /stroke/i, label: /\bstroke\b/i, plain: 'a history of stroke' },
  { condition: /pregnan/i, label: /pregnan\w*/i, plain: 'pregnancy' },
  { condition: /glaucoma/i, label: /glaucoma/i, plain: 'glaucoma' },
  { condition: /prostate|bph/i, label: /prostate|trouble urinating/i, plain: 'an enlarged prostate' },
  { condition: /thyroid/i, label: /thyroid/i, plain: 'thyroid disease' },
];

export function conditionLabelPatterns(conditions: string[]): Array<{ condition: string; label: RegExp; plain: string }> {
  const out: Array<{ condition: string; label: RegExp; plain: string }> = [];
  for (const condition of conditions) {
    const match = CONDITION_TERMS.find((t) => t.condition.test(condition));
    if (match) out.push({ condition, label: match.label, plain: match.plain });
  }
  return out;
}

/** Allergy terms that correspond to whole drug classes. */
const ALLERGY_CLASSES: Array<{ allergy: RegExp; classes: DrugClass[] }> = [
  { allergy: /penicillin|amoxicillin|ampicillin/i, classes: ['penicillin'] },
  { allergy: /sulfa|sulfonamide|bactrim/i, classes: ['sulfonamide'] },
  { allergy: /nsaid|aspirin|ibuprofen|naproxen/i, classes: ['nsaid'] },
  { allergy: /codeine|morphine|opioid|opiate/i, classes: ['opioid'] },
  { allergy: /cephalosporin|cephalexin|keflex/i, classes: ['cephalosporin'] },
  { allergy: /ace inhibitor|lisinopril|enalapril/i, classes: ['ace-inhibitor'] },
  { allergy: /statin/i, classes: ['statin'] },
  { allergy: /macrolide|azithromycin|erythromycin/i, classes: ['macrolide'] },
  { allergy: /fluoroquinolone|quinolone|ciprofloxacin|levofloxacin/i, classes: ['fluoroquinolone'] },
];

export interface AllergyConflict {
  allergy: string;
  reason: string;
}

/** Checks a drug against the patient's allergy list (name, brand, class, and label mentions). */
export function allergyConflicts(drugName: string, allergies: string[], labelText = '', epcClasses: string[] = []): AllergyConflict[] {
  const entry = lookupDrug(drugName);
  const names = [drugName.toLowerCase(), ...(entry ? [entry.name, ...entry.brands.map((b) => b.toLowerCase())] : [])];
  const classes = drugClasses(drugName, epcClasses);
  const out: AllergyConflict[] = [];
  for (const allergy of allergies) {
    const a = allergy.trim().toLowerCase();
    if (!a || /^(none|nkda|no known)/.test(a)) continue;
    if (names.some((n) => n.includes(a) || a.includes(n))) {
      out.push({ allergy, reason: `You have a listed allergy to ${allergy}.` });
      continue;
    }
    const classMatch = ALLERGY_CLASSES.find((c) => c.allergy.test(a) && c.classes.some((cl) => classes.includes(cl)));
    if (classMatch) {
      const cls = classMatch.classes.find((cl) => classes.includes(cl));
      out.push({
        allergy,
        reason: `You have a listed allergy to ${allergy}, and ${entry?.name ?? drugName} is ${cls ? `a ${DRUG_CLASSES[cls].label}` : 'in a related group'}. People allergic to one medicine in a group can react to others in it.`,
      });
      continue;
    }
    if (labelText && new RegExp(`allerg\\w*[^.]{0,40}\\b${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(labelText)) {
      out.push({ allergy, reason: `The FDA label warns people who are allergic to ${allergy}.` });
    }
  }
  return out;
}

/**
 * Well-established class-level interactions, used only when FDA labels can't be loaded
 * (offline / services down). Plain-language, non-numeric statements.
 */
export const KNOWN_CLASS_INTERACTIONS: Array<{ a: DrugClass[]; b: DrugClass[]; effect: string }> = [
  { a: ['nsaid'], b: ['ace-inhibitor', 'arb', 'diuretic', 'antihypertensive'], effect: 'NSAIDs can raise blood pressure, make blood pressure medicines work less well, and — especially with ACE inhibitors, ARBs or diuretics — put extra strain on the kidneys.' },
  { a: ['nsaid'], b: ['anticoagulant', 'antiplatelet', 'ssri', 'snri', 'corticosteroid'], effect: 'Taking NSAIDs with blood thinners, some antidepressants or steroids raises the risk of stomach and intestinal bleeding.' },
  { a: ['nsaid'], b: ['lithium'], effect: 'NSAIDs can raise lithium levels in the blood.' },
  { a: ['anticoagulant'], b: ['antiplatelet', 'ssri', 'snri'], effect: 'Combining blood thinners with antiplatelet medicines or some antidepressants raises the risk of bleeding.' },
  { a: ['opioid'], b: ['benzodiazepine', 'sedative'], effect: 'Opioids combined with benzodiazepines or other sedatives can cause dangerous sleepiness and slowed breathing.' },
  { a: ['nitrate'], b: ['pde5'], effect: 'Nitrates (like nitroglycerin) with PDE5 inhibitors (like sildenafil) can cause a dangerous drop in blood pressure.' },
  { a: ['ace-inhibitor', 'arb'], b: ['potassium', 'potassium-sparing'], effect: 'ACE inhibitors or ARBs with potassium supplements or potassium-sparing diuretics can raise potassium to unsafe levels.' },
  { a: ['statin'], b: ['macrolide'], effect: 'Some antibiotics (such as clarithromycin) can raise statin levels and the risk of muscle damage.' },
  { a: ['serotonergic', 'ssri', 'snri'], b: ['maoi'], effect: 'Combining serotonin-boosting medicines with MAO inhibitors can cause serotonin syndrome, a medical emergency.' },
  { a: ['ssri', 'snri'], b: ['serotonergic'], effect: 'Combining medicines that raise serotonin (some antidepressants, tramadol, dextromethorphan) can rarely cause serotonin syndrome.' },
  { a: ['ace-inhibitor', 'arb', 'diuretic'], b: ['lithium'], effect: 'Some blood pressure medicines can raise lithium levels in the blood.' },
];

export function knownInteraction(a: string, b: string): string | null {
  const ca = drugClasses(a);
  const cb = drugClasses(b);
  for (const rule of KNOWN_CLASS_INTERACTIONS) {
    const forward = rule.a.some((c) => ca.includes(c)) && rule.b.some((c) => cb.includes(c));
    const backward = rule.a.some((c) => cb.includes(c)) && rule.b.some((c) => ca.includes(c));
    if (forward || backward) return rule.effect;
  }
  return null;
}
