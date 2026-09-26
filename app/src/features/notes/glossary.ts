// Small offline glossary of clinician shorthand for the "Jargon decoder" on visit notes.
// Matching is token-aware: a form only matches when it isn't glued to other letters/digits
// ("pt" never matches inside "script", "PE" never inside "PEx"), short all-caps abbreviations are
// case-sensitive, and slash forms ("w/", "f/u", "c/o") are handled explicitly.
// General meanings only — the clinician who wrote the note is the authority on what it means.

export type JargonCategory = 'how-to-take' | 'shorthand' | 'condition' | 'test' | 'term';

export interface JargonEntry {
  /** Canonical spelling shown in the decoder ("PO", "f/u"). */
  term: string;
  /** Short plain meaning ("by mouth"). */
  plain: string;
  /** One-sentence explanation. */
  definition?: string;
  category: JargonCategory;
  /** Spellings to look for (default: [term]). */
  forms?: readonly string[];
  /** Match forms exactly as written (default true for short abbreviations). */
  caseSensitive?: boolean;
}

export interface JargonMatch {
  /** Unique key (entry term, or the matched text for number patterns). */
  key: string;
  /** Label for the decoder: the term as first written in the note ("F/u", "lipid panel", "q4–6h"). */
  term: string;
  plain: string;
  definition?: string;
  category: JargonCategory;
  /** Text exactly as it appears in the note. */
  text: string;
  index: number;
  length: number;
}

const e = (
  term: string,
  plain: string,
  category: JargonCategory,
  definition?: string,
  forms?: readonly string[],
  caseSensitive = true,
): JargonEntry => ({ term, plain, category, definition, forms, caseSensitive });

export const NOTE_GLOSSARY: readonly JargonEntry[] = [
  // How to take medicines
  e('PO', 'by mouth', 'how-to-take', 'Swallow it.', ['PO', 'po', 'p.o.', 'P.O.']),
  e('qd', 'once a day', 'how-to-take', 'Once daily. Many clinics now write "daily" instead.', ['qd', 'QD', 'q.d.', 'qday', 'QDay']),
  e('BID', 'twice a day', 'how-to-take', 'Two times a day, usually morning and evening.', ['BID', 'bid', 'b.i.d.']),
  e('TID', 'three times a day', 'how-to-take', undefined, ['TID', 'tid', 't.i.d.']),
  e('QID', 'four times a day', 'how-to-take', undefined, ['QID', 'qid', 'q.i.d.']),
  e('qhs', 'at bedtime', 'how-to-take', 'Once a day at bedtime.', ['qhs', 'QHS', 'q.h.s.', 'HS']),
  e('qAM', 'every morning', 'how-to-take', undefined, ['qAM', 'qam', 'QAM']),
  e('qPM', 'every evening', 'how-to-take', undefined, ['qPM', 'qpm', 'QPM']),
  e('QOD', 'every other day', 'how-to-take', undefined, ['QOD', 'qod']),
  e('PRN', 'as needed', 'how-to-take', 'Only when you need it, not on a fixed schedule.', ['PRN', 'prn', 'p.r.n.']),
  e('AC', 'before meals', 'how-to-take', undefined, ['AC', 'a.c.']),
  e('PC', 'after meals', 'how-to-take', undefined, ['PC', 'p.c.']),
  e('SL', 'under the tongue', 'how-to-take', 'Let it dissolve under the tongue.'),
  e('IM', 'shot into a muscle', 'how-to-take', 'An injection into a muscle.'),
  e('SC', 'shot under the skin', 'how-to-take', 'An injection just under the skin.', ['SC', 'SQ', 'subQ', 'subcut']),
  e('IV', 'through a vein', 'how-to-take', 'Given through a vein, usually with a small tube (an IV line).'),
  e('inh', 'inhaled', 'how-to-take', 'Breathed in, for example from an inhaler.', ['inh', 'INH']),
  e('gtt', 'drops', 'how-to-take', 'Drops, such as eye or ear drops.', ['gtt', 'gtts']),
  e('tab', 'tablet', 'how-to-take', undefined, ['tab', 'tabs']),
  e('mcg', 'micrograms', 'how-to-take', 'A very small unit of weight: 1,000 mcg = 1 mg.', ['mcg', 'µg']),
  e('NPO', 'nothing by mouth', 'how-to-take', 'Nothing to eat or drink, often before a test or procedure.'),
  e('Rx', 'prescription', 'shorthand', undefined, ['Rx', 'RX']),
  e('OTC', 'over the counter', 'shorthand', 'Sold without a prescription.'),

  // Note shorthand
  e('Pt', 'patient (you)', 'shorthand', undefined, ['Pt', 'pt', 'Pt.', 'pt.']),
  e('f/u', 'follow-up', 'shorthand', 'A check-in visit or call to see how things are going.', ['f/u', 'F/u', 'F/U']),
  e('RTC', 'return to clinic', 'shorthand', 'When your next visit should be.'),
  e('w/', 'with', 'shorthand', undefined, ['w/', 'W/']),
  e('w/o', 'without', 'shorthand', undefined, ['w/o', 'W/O', 'W/o']),
  e('s/p', 'after (a procedure)', 'shorthand', 'Status post: after a surgery, procedure or event.', ['s/p', 'S/P']),
  e('c/o', 'complains of', 'shorthand', 'The symptoms you described.', ['c/o', 'C/O']),
  e('h/o', 'history of', 'shorthand', undefined, ['h/o', 'H/O']),
  e('r/o', 'rule out', 'shorthand', 'Checking to make sure it is not a certain condition.', ['r/o', 'R/O']),
  e('d/c', 'stop (or discharge)', 'shorthand', 'Discontinue (stop a medicine), or discharge from a hospital.', ['d/c', 'D/C']),
  e('re:', 'about', 'shorthand', 'Regarding.', ['re:', 'Re:']),
  e('Cont', 'continue', 'shorthand', 'Keep taking it the same way.', ['Cont', 'cont', 'Cont.', 'cont.']),
  e('Hx', 'history', 'shorthand', 'Your past health history.', ['Hx', 'hx']),
  e('Dx', 'diagnosis', 'shorthand', undefined, ['Dx', 'dx']),
  e('Tx', 'treatment', 'shorthand', undefined, ['Tx', 'tx']),
  e('Sx', 'symptoms', 'shorthand', undefined, ['Sx', 'sx']),
  e('SE', 'side effects', 'shorthand', 'Unwanted effects a medicine can cause.', ['SE', 'SEs', 'S/E']),
  e('NKDA', 'no known drug allergies', 'shorthand'),
  e('WNL', 'normal', 'shorthand', 'Within normal limits: the result looked normal.', ['WNL', 'wnl']),
  e('NAD', 'no acute distress', 'shorthand', 'You did not look like you were in sudden trouble or pain.'),
  e('PE', 'physical exam', 'shorthand', 'In a checkup note, PE usually means physical exam. In hospital notes it can mean a blood clot in the lung (pulmonary embolism), so ask if unsure.'),
  e('Wt', 'weight', 'shorthand', undefined, ['Wt', 'wt']),
  e('lb', 'pounds', 'shorthand', undefined, ['lb', 'lbs']),
  e('vax', 'vaccine', 'shorthand', undefined, ['vax', 'Vax', 'vacc']),
  e('PCP', 'primary care provider', 'shorthand', 'Your main doctor, nurse practitioner or physician assistant.'),
  e('ER', 'emergency room', 'shorthand'),
  e('CTA', 'clear on listening', 'shorthand', 'Clear to auscultation: the lungs sounded clear through the stethoscope.'),
  e('ACT', 'Asthma Control Test', 'test', 'A short questionnaire. A score of 20 or more usually means asthma is well controlled.'),
  e('ICS', 'inhaled steroid', 'term', 'Inhaled corticosteroid: a daily controller inhaler that calms airway swelling.'),

  // Conditions & symptoms
  e('HTN', 'high blood pressure', 'condition', 'Hypertension: blood pressure that stays too high.'),
  e('T2DM', 'type 2 diabetes', 'condition', 'The body does not use insulin well, so blood sugar runs high.', ['T2DM', 'DM2', 'T2D']),
  e('DM', 'diabetes', 'condition'),
  e('HLD', 'high cholesterol', 'condition', 'Hyperlipidemia: high cholesterol or other fats in the blood.'),
  e('CAD', 'coronary artery disease', 'condition', 'Narrowed arteries that supply the heart.'),
  e('CHF', 'heart failure', 'condition', 'The heart does not pump as well as it should.'),
  e('CKD', 'chronic kidney disease', 'condition'),
  e('COPD', 'chronic lung disease', 'condition', 'Chronic obstructive pulmonary disease: long-term lung disease that makes breathing hard.'),
  e('GERD', 'acid reflux', 'condition', 'Stomach acid that backs up into the food pipe (heartburn).'),
  e('URI', 'cold / upper respiratory infection', 'condition'),
  e('UTI', 'urinary tract infection', 'condition'),
  e('CP', 'chest pain', 'condition'),
  e('SOB', 'shortness of breath', 'condition'),
  e('N/V', 'nausea and vomiting', 'condition', undefined, ['N/V', 'n/v']),
  e('HA', 'headache', 'condition'),
  e('myalgias', 'muscle aches', 'term', 'Muscle aches or pain.', ['myalgias', 'myalgia'], false),
  e('wheeze', 'whistling breathing', 'term', 'A whistling sound when breathing, from narrowed airways.', ['wheeze', 'wheezing'], false),
  e('edema', 'swelling', 'term', 'Swelling from extra fluid, often in the legs or ankles.', ['edema'], false),
  e('persistent asthma', 'asthma that needs daily control', 'condition', 'Asthma symptoms often enough to need a daily controller medicine.', ['persistent asthma'], false),

  // Tests, labs & vitals
  e('BP', 'blood pressure', 'test', 'Top number: pressure when the heart beats. Bottom number: pressure between beats.'),
  e('HR', 'heart rate', 'test', 'Pulse, in beats per minute.'),
  e('A1c', 'average blood sugar (2–3 months)', 'test', 'A blood test showing your average blood sugar over about the past 2–3 months.', ['A1c', 'A1C', 'HbA1c']),
  e('LDL', '"bad" cholesterol', 'test', 'The cholesterol that can build up in artery walls.'),
  e('HDL', '"good" cholesterol', 'test', 'The cholesterol that helps clear other cholesterol away.'),
  e('lipids', 'cholesterol tests', 'test', 'A lipid panel: blood tests of cholesterol and triglycerides.', ['lipid panel', 'lipids'], false),
  e('CMP', 'blood chemistry panel', 'test', 'Comprehensive metabolic panel: checks kidney and liver function, blood sugar and electrolytes.'),
  e('BMP', 'basic blood chemistry', 'test', 'Basic metabolic panel: checks kidney function, blood sugar and electrolytes.'),
  e('CBC', 'complete blood count', 'test', 'Measures red cells, white cells and platelets.'),
  e('TSH', 'thyroid test', 'test'),
  e('eGFR', 'kidney filtering rate', 'test', 'How well your kidneys filter blood.', ['eGFR', 'GFR']),
  e('Na', 'sodium (salt)', 'test', 'Sodium. A "low-Na diet" means eating less salt.'),
  e('BMI', 'body mass index', 'test', 'A measure of weight relative to height.'),
  e('EKG', 'heart tracing', 'test', 'A quick, painless test of the heart’s electrical activity.', ['EKG', 'ECG']),
  e('labs', 'lab tests', 'test', 'Usually blood or urine tests.', ['labs'], false),

  // Medicines & plain clinical words
  e('statins', 'cholesterol-lowering medicines', 'term', 'Medicines such as atorvastatin that lower LDL cholesterol.', ['statins', 'statin'], false),
  e('NSAIDs', 'anti-inflammatory pain relievers', 'term', 'Such as ibuprofen and naproxen.', ['NSAIDs', 'NSAID']),
  e('well controlled', 'in a healthy range', 'term', 'The condition is at goal with the current treatment.', ['well controlled', 'well-controlled'], false),
  e('counseled', 'talked with you about', 'term', undefined, ['counseled', 'counselled'], false),
  e('→', 'so / next step', 'shorthand', 'An arrow links a finding to the plan, e.g. "LDL 162 → start atorvastatin".', ['→', '->']),
  e('↑', 'increased / high', 'shorthand', undefined, ['↑']),
  e('↓', 'decreased / low', 'shorthand', undefined, ['↓']),
  e('spacer', 'inhaler spacer', 'term', 'A tube that attaches to an inhaler so more medicine reaches the lungs.', ['spacer'], false),
];

const isWordChar = (ch: string | undefined): boolean => ch !== undefined && /[A-Za-z0-9]/.test(ch);
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface CompiledForm {
  entry: JargonEntry;
  regex: RegExp;
  checkLeft: boolean;
  checkRight: boolean;
}

const COMPILED: CompiledForm[] = NOTE_GLOSSARY.flatMap((entry) =>
  (entry.forms ?? [entry.term]).map((form) => ({
    entry,
    regex: new RegExp(escapeRegex(form).replace(/ /g, '[\\s-]+'), entry.caseSensitive === false ? 'gi' : 'g'),
    checkLeft: isWordChar(form[0]),
    checkRight: isWordChar(form[form.length - 1]),
  })),
);

interface PatternRule {
  regex: RegExp;
  category: JargonCategory;
  plain: (m: RegExpExecArray) => string;
  definition: string;
}

const UNIT_WORD: Record<string, string> = { d: 'day', wk: 'week', mo: 'month', yr: 'year', hr: 'hour', h: 'hour' };

function unitWord(raw: string | undefined, amount: string): string {
  const unit = (raw ?? '').toLowerCase().replace(/s$/, '');
  const word = UNIT_WORD[unit] ?? unit;
  return amount === '1' ? word : `${word}s`;
}

/** Number-based shorthand where the meaning depends on the numbers. */
const PATTERNS: readonly PatternRule[] = [
  {
    regex: /q\.?\s?(\d{1,2})\s?[-–]\s?(\d{1,2})\s?h(?:rs?)?\b/gi,
    category: 'how-to-take',
    plain: (m) => `every ${m[1]} to ${m[2]} hours`,
    definition: '"q" means "every"; "h" means hours.',
  },
  {
    regex: /q\.?\s?(\d{1,2})\s?h(?:rs?)?\b/gi,
    category: 'how-to-take',
    plain: (m) => `every ${m[1]} hours`,
    definition: '"q" means "every"; "h" means hours.',
  },
  {
    regex: /(\d+)\s?x\s?\/\s?(d|day|wk|week|mo|month|yr)\b/gi,
    category: 'shorthand',
    plain: (m) => {
      const n = Number(m[1]);
      const times = n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`;
      const unit = (m[2] ?? '').toLowerCase();
      const per = unit.startsWith('d') ? 'day' : unit.startsWith('w') ? 'week' : unit.startsWith('m') ? 'month' : 'year';
      return `${times} a ${per}`;
    },
    definition: '"x" means "times" and "/" means "per".',
  },
  {
    regex: /(\d+(?:\s?[-–]\s?\d+)?)\s?(wks?|mos?|yrs?|hrs?)\b/g,
    category: 'shorthand',
    plain: (m) => `${(m[1] ?? '').replace(/\s?[-–]\s?/, ' to ')} ${unitWord(m[2], m[1] ?? '')}`,
    definition: 'wk = week, mo = month, yr = year, hr = hour.',
  },
];

/** All jargon in `text`, in reading order, without overlaps (longest match wins). */
export function findJargon(text: string): JargonMatch[] {
  const candidates: JargonMatch[] = [];

  for (const { entry, regex, checkLeft, checkRight } of COMPILED) {
    regex.lastIndex = 0;
    for (let m = regex.exec(text); m; m = regex.exec(text)) {
      if (!m[0]) {
        regex.lastIndex += 1;
        continue;
      }
      const start = m.index;
      const end = start + m[0].length;
      if (checkLeft && isWordChar(text[start - 1])) continue;
      if (checkRight && isWordChar(text[end])) continue;
      candidates.push({
        key: entry.term,
        // Show the term the way the note wrote it ("lipid panel", "F/u"); dedupe by the entry.
        term: m[0].replace(/\s+/g, ' '),
        plain: entry.plain,
        definition: entry.definition,
        category: entry.category,
        text: m[0],
        index: start,
        length: m[0].length,
      });
    }
  }

  for (const rule of PATTERNS) {
    rule.regex.lastIndex = 0;
    for (let m = rule.regex.exec(text); m; m = rule.regex.exec(text)) {
      const start = m.index;
      if (isWordChar(text[start - 1]) && !/\d/.test(m[0][0] ?? '')) continue;
      if (/\d/.test(m[0][0] ?? '') && /[\d.]/.test(text[start - 1] ?? '')) continue;
      const written = m[0].trim();
      candidates.push({
        key: `pattern:${written.toLowerCase()}`,
        term: written,
        plain: rule.plain(m),
        definition: rule.definition,
        category: rule.category,
        text: m[0],
        index: start,
        length: m[0].length,
      });
    }
  }

  candidates.sort((a, b) => a.index - b.index || b.length - a.length);
  const out: JargonMatch[] = [];
  let end = -1;
  for (const c of candidates) {
    if (c.index < end) continue;
    out.push(c);
    end = c.index + c.length;
  }
  return out;
}

/** Unique jargon in first-appearance order (for the decoder list). */
export function decodeJargon(text: string): JargonMatch[] {
  const seen = new Set<string>();
  return findJargon(text).filter((m) => {
    if (seen.has(m.key)) return false;
    seen.add(m.key);
    return true;
  });
}

export type NoteSegment = { text: string; match?: JargonMatch };

/** Split text into plain runs and jargon matches (for inline highlighting). */
export function segmentNote(text: string): NoteSegment[] {
  const segments: NoteSegment[] = [];
  let cursor = 0;
  for (const match of findJargon(text)) {
    if (match.index > cursor) segments.push({ text: text.slice(cursor, match.index) });
    segments.push({ text: match.text, match });
    cursor = match.index + match.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/** Human label for a decoder group. */
export const JARGON_CATEGORY_LABEL: Record<JargonCategory, string> = {
  'how-to-take': 'How to take it',
  shorthand: 'Shorthand',
  condition: 'Conditions & symptoms',
  test: 'Tests & numbers',
  term: 'Medical words',
};
