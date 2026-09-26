// Allergy-aware prescribing check (demo-grade). Matches a drug (plus any generic/brand names from
// the label lookup) against the patient's recorded allergies using a short list of drug classes.
// It is a safety prompt for the prescriber, not a substitute for a full interaction/allergy database.

export interface DrugClass {
  id: string;
  /** How the class reads in a sentence: "a penicillin-class antibiotic". */
  label: string;
  /** Words in an allergy entry that mean "allergic to this class". */
  allergyTerms: readonly string[];
  /** Drug names (generic + common brands) that belong to the class. */
  drugs: readonly string[];
}

/** A related class that warrants caution (low but real cross-reactivity). */
interface CrossReactivity {
  from: string;
  to: string;
  note: string;
}

export const DRUG_CLASSES: readonly DrugClass[] = [
  {
    id: 'penicillin',
    label: 'a penicillin-class antibiotic',
    allergyTerms: ['penicillin', 'penicillins', 'pcn', 'amoxicillin', 'ampicillin', 'augmentin'],
    drugs: [
      'penicillin',
      'amoxicillin',
      'ampicillin',
      'augmentin',
      'amoxil',
      'dicloxacillin',
      'nafcillin',
      'oxacillin',
      'piperacillin',
      'bicillin',
    ],
  },
  {
    id: 'cephalosporin',
    label: 'a cephalosporin antibiotic',
    allergyTerms: ['cephalosporin', 'cephalosporins', 'cephalexin', 'keflex', 'ceftriaxone'],
    drugs: [
      'cephalexin',
      'keflex',
      'cefazolin',
      'cefadroxil',
      'cefdinir',
      'cefuroxime',
      'cefpodoxime',
      'ceftriaxone',
      'cefepime',
      'cefprozil',
    ],
  },
  {
    id: 'sulfa',
    label: 'a sulfonamide ("sulfa") antibiotic',
    allergyTerms: ['sulfa', 'sulfas', 'sulfonamide', 'sulfonamides', 'sulfamethoxazole', 'bactrim', 'septra'],
    drugs: ['sulfamethoxazole', 'bactrim', 'septra', 'sulfadiazine', 'sulfasalazine', 'smx'],
  },
  {
    id: 'nsaid',
    label: 'an NSAID',
    allergyTerms: ['nsaid', 'nsaids', 'ibuprofen', 'naproxen', 'aspirin', 'asa'],
    drugs: [
      'ibuprofen',
      'advil',
      'motrin',
      'naproxen',
      'aleve',
      'aspirin',
      'diclofenac',
      'meloxicam',
      'celecoxib',
      'celebrex',
      'ketorolac',
      'indomethacin',
    ],
  },
  {
    id: 'ace-inhibitor',
    label: 'an ACE inhibitor',
    allergyTerms: ['ace inhibitor', 'ace inhibitors', 'lisinopril', 'enalapril', 'ramipril'],
    drugs: ['lisinopril', 'zestril', 'prinivil', 'enalapril', 'vasotec', 'ramipril', 'benazepril', 'captopril', 'quinapril'],
  },
  {
    id: 'statin',
    label: 'a statin',
    allergyTerms: ['statin', 'statins', 'atorvastatin', 'simvastatin', 'rosuvastatin'],
    drugs: ['atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'rosuvastatin', 'crestor', 'pravastatin', 'lovastatin'],
  },
  {
    id: 'opioid',
    label: 'an opioid',
    allergyTerms: ['opioid', 'opioids', 'opiate', 'opiates', 'codeine', 'morphine'],
    drugs: ['codeine', 'morphine', 'hydrocodone', 'oxycodone', 'tramadol', 'hydromorphone', 'fentanyl', 'percocet', 'vicodin'],
  },
  {
    id: 'fluoroquinolone',
    label: 'a fluoroquinolone antibiotic',
    allergyTerms: ['fluoroquinolone', 'fluoroquinolones', 'quinolone', 'quinolones', 'ciprofloxacin', 'levofloxacin'],
    drugs: ['ciprofloxacin', 'cipro', 'levofloxacin', 'levaquin', 'moxifloxacin'],
  },
  {
    id: 'macrolide',
    label: 'a macrolide antibiotic',
    allergyTerms: ['macrolide', 'macrolides', 'erythromycin', 'azithromycin', 'clarithromycin'],
    drugs: ['azithromycin', 'zithromax', 'z pak', 'zpak', 'clarithromycin', 'erythromycin'],
  },
  {
    id: 'tetracycline',
    label: 'a tetracycline antibiotic',
    allergyTerms: ['tetracycline', 'tetracyclines', 'doxycycline', 'minocycline'],
    drugs: ['tetracycline', 'doxycycline', 'minocycline'],
  },
];

const CROSS_REACTIVITY: readonly CrossReactivity[] = [
  {
    from: 'penicillin',
    to: 'cephalosporin',
    note: 'Cross-reactivity with penicillin allergy is uncommon but possible — check the reaction history.',
  },
];

export type AllergyAlertLevel = 'match' | 'caution';

export interface AllergyAlert {
  /** The allergy entry as recorded on the patient's profile. */
  allergy: string;
  level: AllergyAlertLevel;
  message: string;
}

/** Lowercase, strip punctuation to spaces, collapse whitespace. */
function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

/** Whole-word (or whole-phrase) containment on normalized text. */
function containsTerm(haystack: string, term: string): boolean {
  const t = normalize(term).trim();
  return !!t && haystack.includes(` ${t} `);
}

function classesForDrug(names: readonly string[]): DrugClass[] {
  const haystacks = names.map(normalize);
  return DRUG_CLASSES.filter((c) => c.drugs.some((d) => haystacks.some((h) => containsTerm(h, d))));
}

function classesForAllergy(allergy: string): DrugClass[] {
  const hay = normalize(allergy);
  return DRUG_CLASSES.filter((c) => c.allergyTerms.some((t) => containsTerm(hay, t)));
}

/**
 * Alerts for prescribing `drugNames` (the typed name plus any generic/brand names) to a patient
 * with `allergies`. Returns one alert per matching allergy, strongest first.
 */
export function findAllergyAlerts(drugNames: readonly string[], allergies: readonly string[]): AllergyAlert[] {
  const names = drugNames.map((n) => n.trim()).filter(Boolean);
  if (!names.length || !allergies.length) return [];
  const drugLabel = names[0]!;
  const drugClasses = classesForDrug(names);
  const alerts: AllergyAlert[] = [];

  for (const raw of allergies) {
    const allergy = raw.trim();
    if (!allergy) continue;
    const allergyNorm = normalize(allergy);

    // 1. Same drug named directly ("Amoxicillin" allergy, prescribing amoxicillin).
    if (names.some((n) => containsTerm(allergyNorm, n) || containsTerm(normalize(n), allergy))) {
      alerts.push({
        allergy,
        level: 'match',
        message: `Recorded allergy to ${allergy}. ${drugLabel} matches this allergy.`,
      });
      continue;
    }

    // 2. Same drug class ("Penicillin" allergy, prescribing amoxicillin).
    const allergyClasses = classesForAllergy(allergy);
    const shared = drugClasses.find((c) => allergyClasses.some((a) => a.id === c.id));
    if (shared) {
      alerts.push({
        allergy,
        level: 'match',
        message: `Recorded allergy to ${allergy}. ${drugLabel} is ${shared.label}.`,
      });
      continue;
    }

    // 3. Related class with known (lower) cross-reactivity.
    const cross = CROSS_REACTIVITY.find(
      (x) => allergyClasses.some((a) => a.id === x.from) && drugClasses.some((c) => c.id === x.to),
    );
    if (cross) {
      const target = DRUG_CLASSES.find((c) => c.id === cross.to);
      alerts.push({
        allergy,
        level: 'caution',
        message: `Recorded allergy to ${allergy}. ${drugLabel} is ${target?.label ?? 'a related drug'}. ${cross.note}`,
      });
    }
  }

  return alerts.sort((a, b) => (a.level === b.level ? 0 : a.level === 'match' ? -1 : 1));
}
