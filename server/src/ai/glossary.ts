// Medical abbreviations & jargon → plain language. Used to translate doctor's notes
// line by line ("What your doctor wrote → What it means") and to define terms in answers.
// Matching is token-aware: 'pt' never matches inside 'script', 'IM' never matches "im",
// and slash forms like 'w/', 'w/o' and 'f/u' are handled explicitly.

export type GlossaryKind = 'sig' | 'abbreviation' | 'condition' | 'lab' | 'test' | 'jargon' | 'drug-class';

export interface GlossaryEntry {
  /** Canonical spelling shown to the patient, e.g. "PO". */
  term: string;
  /** Spellings to match. Defaults to [term]. */
  forms?: string[];
  /** Match `forms` exactly as written (needed for short all-caps abbreviations). */
  caseSensitive?: boolean;
  /** Inline replacement used when rewriting a sentence ("by mouth"). */
  plain: string;
  /** One-line plain-language definition. */
  definition: string;
  kind: GlossaryKind;
}

const E = (
  term: string,
  plain: string,
  definition: string,
  kind: GlossaryKind,
  options: { forms?: string[]; cs?: boolean } = {},
): GlossaryEntry => ({ term, plain, definition, kind, forms: options.forms, caseSensitive: options.cs });

export const GLOSSARY: GlossaryEntry[] = [
  // ── How to take medicines ("sigs") ──────────────────────────────────────────
  E('PO', 'by mouth', 'Take by mouth (swallow it).', 'sig', { forms: ['PO', 'po', 'p.o.', 'P.O.'], cs: true }),
  E('BID', 'twice a day', 'Two times a day, usually morning and evening.', 'sig', { forms: ['BID', 'bid', 'b.i.d.', 'B.I.D.'], cs: true }),
  E('TID', 'three times a day', 'Three times a day.', 'sig', { forms: ['TID', 'tid', 't.i.d.', 'T.I.D.'], cs: true }),
  E('QID', 'four times a day', 'Four times a day.', 'sig', { forms: ['QID', 'qid', 'q.i.d.', 'Q.I.D.'], cs: true }),
  E('qd', 'once a day', 'Once a day. (Many clinics now write "daily" to avoid mix-ups.)', 'sig', { forms: ['qd', 'QD', 'q.d.', 'Q.D.'], cs: true }),
  E('QOD', 'every other day', 'Every other day.', 'sig', { forms: ['QOD', 'qod', 'q.o.d.'], cs: true }),
  E('qhs', 'at bedtime', 'Once a day at bedtime.', 'sig', { forms: ['qhs', 'QHS', 'q.h.s.', 'HS', 'h.s.'], cs: true }),
  E('qAM', 'every morning', 'Every morning.', 'sig', { forms: ['qAM', 'qam', 'QAM', 'q AM', 'q.a.m.'], cs: true }),
  E('qPM', 'every evening', 'Every evening.', 'sig', { forms: ['qPM', 'qpm', 'QPM', 'q PM', 'q.p.m.'], cs: true }),
  E('PRN', 'as needed', 'Only when you need it (for example, for pain), not on a fixed schedule.', 'sig', { forms: ['PRN', 'prn', 'p.r.n.', 'P.R.N.'], cs: true }),
  E('AC', 'before meals', 'Before meals.', 'sig', { forms: ['AC', 'a.c.'], cs: true }),
  E('PC', 'after meals', 'After meals.', 'sig', { forms: ['PC', 'p.c.'], cs: true }),
  E('SL', 'under the tongue', 'Placed under the tongue to dissolve.', 'sig', { forms: ['SL', 's.l.'], cs: true }),
  E('IM', 'as a shot into a muscle', 'Given as an injection into a muscle.', 'sig', { forms: ['IM', 'I.M.'], cs: true }),
  E('SC', 'as a shot under the skin', 'Given as an injection just under the skin.', 'sig', { forms: ['SC', 'SQ', 'subQ', 'subq', 'sub-Q', 'subcut'], cs: true }),
  E('IV', 'through a vein (IV)', 'Given through a vein, usually through a small tube (an IV line).', 'sig', { forms: ['IV', 'I.V.'], cs: true }),
  E('inh', 'inhaled', 'Breathed in, for example from an inhaler.', 'sig', { forms: ['inh', 'INH'], cs: true }),
  E('gtt', 'drops', 'Drops (for example eye or ear drops).', 'sig', { forms: ['gtt', 'gtts'], cs: true }),
  E('tab', 'tablet', 'Tablet (pill).', 'sig', { forms: ['tab'], cs: true }),
  E('tabs', 'tablets', 'Tablets (pills).', 'sig', { forms: ['tabs'], cs: true }),
  E('cap', 'capsule', 'Capsule.', 'sig', { forms: ['cap'], cs: true }),
  E('caps', 'capsules', 'Capsules.', 'sig', { forms: ['caps'], cs: true }),
  E('mcg', 'micrograms', 'Micrograms — a very small unit of weight (1,000 mcg = 1 mg).', 'sig', { forms: ['mcg', 'µg'], cs: true }),
  E('IU', 'international units', 'International units — a standard way to measure some vitamins and medicines.', 'sig', { cs: true }),
  E('UD', 'as directed', 'Use as directed by your clinician.', 'sig', { forms: ['UD', 'u.d.', 'ud'], cs: true }),
  E('NPO', 'nothing by mouth', 'Nothing to eat or drink (often before a test or surgery).', 'sig', { forms: ['NPO', 'npo', 'n.p.o.'], cs: true }),
  E('STAT', 'right away', 'Immediately.', 'sig', { forms: ['STAT', 'stat'], cs: true }),
  E('OTC', 'over-the-counter', 'Sold without a prescription.', 'abbreviation', { cs: true }),
  E('Rx', 'prescription', 'Prescription (or treatment).', 'abbreviation', { forms: ['Rx', 'RX'], cs: true }),

  // ── Note shorthand ──────────────────────────────────────────────────────────
  E('Pt', 'Patient', 'Patient (you).', 'abbreviation', { forms: ['Pt', 'pt', 'Pt.', 'pt.', 'Pts', 'pts'], cs: true }),
  E('f/u', 'follow-up', 'Follow-up — a check-in visit or call to see how things are going.', 'abbreviation', { forms: ['f/u', 'F/u', 'F/U', 'FU'], cs: true }),
  E('RTC', 'return to the clinic', 'Return to clinic — your next visit.', 'abbreviation', { cs: true }),
  E('w/', 'with', 'With.', 'abbreviation', { forms: ['w/', 'W/'], cs: true }),
  E('w/o', 'without', 'Without.', 'abbreviation', { forms: ['w/o', 'W/O', 'W/o'], cs: true }),
  E('s/p', 'after', 'Status post — after a surgery, procedure or event.', 'abbreviation', { forms: ['s/p', 'S/P'], cs: true }),
  E('r/o', 'rule out', 'Rule out — checking to make sure it is not a certain condition.', 'abbreviation', { forms: ['r/o', 'R/O'], cs: true }),
  E('c/o', 'complains of', 'Complains of — the symptoms you reported.', 'abbreviation', { forms: ['c/o', 'C/O'], cs: true }),
  E('h/o', 'history of', 'History of.', 'abbreviation', { forms: ['h/o', 'H/O'], cs: true }),
  E('d/c', 'stop', 'Discontinue (stop) — or, in hospital notes, discharge.', 'abbreviation', { forms: ['d/c', 'D/C', 'D/c', 'dc\'d', 'd/c\'d', 'D/c\'d'], cs: true }),
  E('b/l', 'on both sides', 'Bilateral — on both sides of the body.', 'abbreviation', { forms: ['b/l', 'B/L'], cs: true }),
  E('y/o', 'year-old', 'Years old.', 'abbreviation', { forms: ['y/o', 'y.o.'], cs: true }),
  E('re:', 'about', 'Regarding — about.', 'abbreviation', { forms: ['re:', 'Re:'], cs: true }),
  E('Cont', 'Continue', 'Continue — keep taking it the same way.', 'abbreviation', { forms: ['Cont', 'cont', 'Cont.', 'cont.'], cs: true }),
  E('incr', 'increase', 'Increase.', 'abbreviation', { forms: ['incr', 'Incr', 'inc.'], cs: true }),
  E('decr', 'decrease', 'Decrease.', 'abbreviation', { forms: ['decr', 'Decr', 'dec.'], cs: true }),
  E('Hx', 'history', 'History (your past health history).', 'abbreviation', { forms: ['Hx', 'hx', 'HX'], cs: true }),
  E('PMH', 'past medical history', 'Past medical history.', 'abbreviation', { cs: true }),
  E('FHx', 'family history', 'Family history — health conditions in your relatives.', 'abbreviation', { forms: ['FHx', 'FH', 'FamHx'], cs: true }),
  E('Dx', 'diagnosis', 'Diagnosis — the condition your clinician thinks you have.', 'abbreviation', { forms: ['Dx', 'dx', 'DX'], cs: true }),
  E('DDx', 'possible diagnoses', 'Differential diagnosis — the list of conditions being considered.', 'abbreviation', { forms: ['DDx', 'ddx'], cs: true }),
  E('Tx', 'treatment', 'Treatment.', 'abbreviation', { forms: ['Tx', 'tx', 'TX'], cs: true }),
  E('Sx', 'symptoms', 'Symptoms.', 'abbreviation', { forms: ['Sx', 'sx'], cs: true }),
  E('Fx', 'fracture', 'Fracture (broken bone).', 'abbreviation', { forms: ['Fx', 'fx'], cs: true }),
  E('Bx', 'biopsy', 'Biopsy — a small tissue sample checked in a lab.', 'abbreviation', { forms: ['Bx', 'bx'], cs: true }),
  E('SE', 'side effects', 'Side effects — unwanted effects a medicine can cause.', 'abbreviation', { forms: ['SE', 'SEs', 'S/E'], cs: true }),
  E('NKDA', 'no known drug allergies', 'No known drug allergies.', 'abbreviation', { forms: ['NKDA', 'NKA'], cs: true }),
  E('WNL', 'normal', 'Within normal limits — the result looked normal.', 'abbreviation', { forms: ['WNL', 'wnl'], cs: true }),
  E('NAD', 'no acute distress', 'No acute distress — you did not look like you were in sudden trouble or pain.', 'abbreviation', { cs: true }),
  E('ROS', 'review of symptoms', 'Review of systems — questions about symptoms in each part of the body.', 'abbreviation', { cs: true }),
  E('HPI', 'history of the present illness', 'History of present illness — the story of your current problem.', 'abbreviation', { cs: true }),
  E('PCP', 'primary care provider', 'Primary care provider — your main doctor, nurse practitioner or physician assistant.', 'abbreviation', { cs: true }),
  E('ER', 'emergency room', 'Emergency room.', 'abbreviation', { cs: true }),
  E('ICU', 'intensive care unit', 'Intensive care unit.', 'abbreviation', { cs: true }),
  E('PT', 'physical therapy', 'Physical therapy — exercises and treatment to improve movement and strength.', 'abbreviation', { cs: true }),
  E('OT', 'occupational therapy', 'Occupational therapy — help with everyday tasks and skills.', 'abbreviation', { cs: true }),
  E('Wt', 'weight', 'Weight.', 'abbreviation', { forms: ['Wt', 'wt'], cs: true }),
  E('Ht', 'height', 'Height.', 'abbreviation', { forms: ['Ht', 'ht'], cs: true }),
  E('vax', 'vaccine', 'Vaccine (a shot that helps prevent an infection).', 'abbreviation', { forms: ['vax', 'Vax', 'vacc'], cs: true }),
  E('Na', 'sodium (salt)', 'Sodium — the main part of table salt.', 'abbreviation', { forms: ['Na'], cs: true }),
  E('CTA', 'clear when listened to with a stethoscope', 'Clear to auscultation — the lungs sounded normal with a stethoscope.', 'abbreviation', { forms: ['CTA', 'CTAB'], cs: true }),
  E('EtOH', 'alcohol', 'Alcohol (drinking).', 'abbreviation', { forms: ['EtOH', 'ETOH'], cs: true }),
  E('wks', 'weeks', 'Weeks.', 'abbreviation', { forms: ['wks'], cs: true }),
  E('mos', 'months', 'Months.', 'abbreviation', { forms: ['mos'], cs: true }),
  E('yrs', 'years', 'Years.', 'abbreviation', { forms: ['yrs'], cs: true }),

  // ── Conditions ──────────────────────────────────────────────────────────────
  E('HTN', 'high blood pressure', 'Hypertension — blood pressure that stays too high, which strains the heart and blood vessels.', 'condition', { forms: ['HTN'], cs: true }),
  E('HLD', 'high cholesterol', 'Hyperlipidemia — high levels of cholesterol or other fats in the blood.', 'condition', { forms: ['HLD', 'HL'], cs: true }),
  E('T2DM', 'type 2 diabetes', 'Type 2 diabetes — the body does not use insulin well, so blood sugar runs high.', 'condition', { forms: ['T2DM', 'DM2', 'T2D', 'DMII', 'DM II', 'DM 2'], cs: true }),
  E('T1DM', 'type 1 diabetes', 'Type 1 diabetes — the body makes little or no insulin.', 'condition', { forms: ['T1DM', 'DM1', 'T1D'], cs: true }),
  E('DM', 'diabetes', 'Diabetes mellitus — blood sugar that runs too high.', 'condition', { cs: true }),
  E('CKD', 'chronic kidney disease', 'Chronic kidney disease — the kidneys have been working less well for months or longer.', 'condition', { cs: true }),
  E('ESRD', 'kidney failure', 'End-stage renal disease — kidney failure that needs dialysis or a transplant.', 'condition', { cs: true }),
  E('CAD', 'coronary artery disease', 'Coronary artery disease — narrowed arteries that supply the heart.', 'condition', { cs: true }),
  E('CHF', 'heart failure', 'Congestive heart failure — the heart does not pump as well as it should.', 'condition', { forms: ['CHF', 'HF'], cs: true }),
  E('AFib', 'atrial fibrillation', 'Atrial fibrillation — an irregular, often fast heartbeat that raises stroke risk.', 'condition', { forms: ['AFib', 'Afib', 'AF', 'A-fib', 'a-fib'], cs: true }),
  E('MI', 'heart attack', 'Myocardial infarction — a heart attack.', 'condition', { cs: true }),
  E('CVA', 'stroke', 'Cerebrovascular accident — a stroke.', 'condition', { cs: true }),
  E('TIA', 'mini-stroke (TIA)', 'Transient ischemic attack — a "mini-stroke" whose symptoms go away but is a warning sign.', 'condition', { cs: true }),
  E('DVT', 'blood clot in a leg vein', 'Deep vein thrombosis — a blood clot in a deep vein, usually in the leg.', 'condition', { cs: true }),
  E('PE', 'blood clot in the lung', 'Pulmonary embolism — a blood clot that has traveled to the lungs.', 'condition', { cs: true }),
  E('annual PE', 'annual physical exam', 'Annual physical exam — a yearly checkup.', 'abbreviation', { forms: ['Annual PE', 'annual PE', 'Annual P.E.'], cs: true }),
  E('PE:', 'Physical exam:', 'Physical exam — what your clinician found when examining you.', 'abbreviation', { forms: ['PE:', 'P/E:', 'PEx:'], cs: true }),
  E('VTE', 'blood clot', 'Venous thromboembolism — a blood clot in a vein (DVT or PE).', 'condition', { cs: true }),
  E('COPD', 'COPD (chronic lung disease)', 'Chronic obstructive pulmonary disease — long-term lung disease that makes it hard to breathe.', 'condition', { cs: true }),
  E('GERD', 'acid reflux', 'Gastroesophageal reflux disease — stomach acid that backs up into the food pipe (heartburn).', 'condition', { cs: true }),
  E('OSA', 'sleep apnea', 'Obstructive sleep apnea — breathing stops and starts during sleep.', 'condition', { cs: true }),
  E('BPH', 'enlarged prostate', 'Benign prostatic hyperplasia — an enlarged prostate that is not cancer.', 'condition', { cs: true }),
  E('UTI', 'urinary tract infection', 'Urinary tract infection — an infection of the bladder or kidneys.', 'condition', { forms: ['UTI', 'UTIs'], cs: true }),
  E('URI', 'upper respiratory infection (cold)', 'Upper respiratory infection — an infection of the nose and throat, like a cold.', 'condition', { forms: ['URI', 'URIs'], cs: true }),
  E('OA', 'osteoarthritis', 'Osteoarthritis — "wear and tear" arthritis of the joints.', 'condition', { cs: true }),
  E('RA', 'rheumatoid arthritis', 'Rheumatoid arthritis — an autoimmune disease that inflames the joints.', 'condition', { cs: true }),
  E('MDD', 'depression', 'Major depressive disorder — depression.', 'condition', { cs: true }),
  E('GAD', 'anxiety', 'Generalized anxiety disorder — ongoing, hard-to-control worry.', 'condition', { cs: true }),
  E('ADHD', 'ADHD', 'Attention-deficit/hyperactivity disorder — trouble with focus, restlessness or impulsivity.', 'condition', { cs: true }),
  E('IBS', 'irritable bowel syndrome', 'Irritable bowel syndrome — belly pain with changes in bowel habits.', 'condition', { cs: true }),
  E('PAD', 'poor circulation in the legs', 'Peripheral artery disease — narrowed arteries, usually in the legs.', 'condition', { forms: ['PAD', 'PVD'], cs: true }),
  E('LBP', 'low back pain', 'Low back pain.', 'condition', { cs: true }),
  E('HA', 'headache', 'Headache.', 'condition', { forms: ['HA', 'HAs'], cs: true }),
  E('CP', 'chest pain', 'Chest pain.', 'condition', { cs: true }),
  E('SOB', 'shortness of breath', 'Shortness of breath.', 'condition', { cs: true }),
  E('DOE', 'shortness of breath with activity', 'Dyspnea on exertion — getting short of breath with activity.', 'condition', { cs: true }),
  E('N/V', 'nausea and vomiting', 'Nausea and vomiting.', 'condition', { forms: ['N/V/D', 'N/V', 'n/v'], cs: true }),
  E('LOC', 'loss of consciousness', 'Loss of consciousness — passing out.', 'condition', { cs: true }),
  E('hypertension', 'high blood pressure', 'Blood pressure that stays too high.', 'condition'),
  E('hypotension', 'low blood pressure', 'Blood pressure that is too low, which can cause dizziness or fainting.', 'condition'),
  E('hyperlipidemia', 'high cholesterol', 'High levels of cholesterol or other fats in the blood.', 'condition', { forms: ['hyperlipidemia', 'dyslipidemia', 'hypercholesterolemia'] }),
  E('hyperglycemia', 'high blood sugar', 'Blood sugar that is higher than normal.', 'condition'),
  E('hypoglycemia', 'low blood sugar', 'Blood sugar that is too low; it can cause shakiness, sweating or confusion.', 'condition'),
  E('hypothyroidism', 'underactive thyroid', 'The thyroid gland makes too little thyroid hormone.', 'condition'),
  E('hyperthyroidism', 'overactive thyroid', 'The thyroid gland makes too much thyroid hormone.', 'condition'),
  E('prediabetes', 'prediabetes', 'Blood sugar that is higher than normal but not yet high enough to be diabetes.', 'condition'),
  E('neuropathy', 'nerve damage', 'Nerve damage, often causing numbness, tingling or pain in the feet or hands.', 'condition'),
  E('edema', 'swelling', 'Swelling caused by extra fluid, often in the legs or ankles.', 'condition', { forms: ['edema', 'oedema'] }),
  E('dyspnea', 'shortness of breath', 'Shortness of breath or trouble breathing.', 'condition'),
  E('syncope', 'fainting', 'Fainting — briefly passing out.', 'condition'),
  E('tachycardia', 'fast heart rate', 'A heart rate that is faster than normal.', 'condition'),
  E('bradycardia', 'slow heart rate', 'A heart rate that is slower than normal.', 'condition'),
  E('arrhythmia', 'irregular heartbeat', 'A heartbeat that is irregular, too fast or too slow.', 'condition'),
  E('myalgias', 'muscle aches', 'Muscle aches or pain.', 'jargon', { forms: ['myalgias', 'myalgia'] }),
  E('arthralgias', 'joint pain', 'Joint pain.', 'jargon', { forms: ['arthralgias', 'arthralgia'] }),
  E('malaise', 'feeling generally unwell', 'A general feeling of being unwell or run down.', 'jargon'),
  E('pruritus', 'itching', 'Itching.', 'jargon'),
  E('erythema', 'redness', 'Redness of the skin.', 'jargon'),
  E('obesity', 'obesity', 'Having more body fat than is healthy, usually a BMI of 30 or higher.', 'condition'),

  // ── Labs, vitals & tests ────────────────────────────────────────────────────
  E('A1c', 'A1c (average blood sugar over the past 2–3 months)', 'A blood test that shows your average blood sugar over about the past 2–3 months.', 'lab', { forms: ['A1c', 'A1C', 'HbA1c', 'HgbA1c', 'Hgb A1c', 'Hb A1c'], cs: true }),
  E('LDL', 'LDL ("bad" cholesterol)', 'LDL cholesterol — the "bad" cholesterol that can build up in arteries.', 'lab', { forms: ['LDL-C', 'LDL'], cs: true }),
  E('HDL', 'HDL ("good" cholesterol)', 'HDL cholesterol — the "good" cholesterol that helps clear other cholesterol.', 'lab', { forms: ['HDL-C', 'HDL'], cs: true }),
  E('TG', 'triglycerides (a blood fat)', 'Triglycerides — a type of fat in the blood.', 'lab', { forms: ['TG', 'TGs', 'trigs'], cs: true }),
  E('lipid panel', 'lipid panel (cholesterol blood test)', 'A lipid panel — a blood test of cholesterol and triglycerides.', 'lab', { forms: ['lipid panel', 'FLP'] }),
  E('lipids', 'cholesterol levels (lipids)', 'Lipids — cholesterol and triglycerides (fats) in the blood.', 'lab', { forms: ['lipids'] }),
  E('BMP', 'BMP (basic blood chemistry test)', 'Basic metabolic panel — a blood test of kidney function, blood sugar and electrolytes like sodium and potassium.', 'lab', { cs: true }),
  E('CMP', 'CMP (blood test of kidney and liver function, blood sugar and electrolytes)', 'Comprehensive metabolic panel — a blood test that checks kidney and liver function, blood sugar and electrolytes.', 'lab', { cs: true }),
  E('CBC', 'CBC (complete blood count)', 'Complete blood count — measures red cells, white cells and platelets.', 'lab', { cs: true }),
  E('TSH', 'TSH (thyroid test)', 'Thyroid-stimulating hormone — a blood test that checks how your thyroid is working.', 'lab', { cs: true }),
  E('eGFR', 'eGFR (kidney function)', 'Estimated glomerular filtration rate — a number that shows how well your kidneys filter blood.', 'lab', { forms: ['eGFR', 'GFR'], cs: true }),
  E('Cr', 'creatinine (kidney test)', 'Creatinine — a blood test used to check kidney function.', 'lab', { forms: ['Cr', 'creat'], cs: true }),
  E('BUN', 'BUN (kidney test)', 'Blood urea nitrogen — a blood test related to kidney function.', 'lab', { cs: true }),
  E('Hgb', 'hemoglobin', 'Hemoglobin — the part of red blood cells that carries oxygen; low levels mean anemia.', 'lab', { forms: ['Hgb', 'Hb'], cs: true }),
  E('WBC', 'white blood cell count', 'White blood cell count — cells that fight infection.', 'lab', { cs: true }),
  E('PLT', 'platelets', 'Platelets — blood cells that help blood clot.', 'lab', { forms: ['PLT', 'Plt'], cs: true }),
  E('INR', 'INR (blood clotting test)', 'A blood test of how fast your blood clots, often used with warfarin.', 'lab', { cs: true }),
  E('PT/INR', 'blood clotting test (PT/INR)', 'Prothrombin time and INR — a blood test of how fast your blood clots, often used with warfarin.', 'lab', { forms: ['PT/INR', 'PT-INR', 'PT INR'], cs: true }),
  E('LFTs', 'liver tests', 'Liver function tests — blood tests that check the liver.', 'lab', { forms: ['LFTs', 'LFT'], cs: true }),
  E('UA', 'urine test', 'Urinalysis — a test of your urine.', 'lab', { cs: true }),
  E('UACR', 'urine protein test (kidney check)', 'Urine albumin-to-creatinine ratio — checks for protein in the urine, an early sign of kidney damage.', 'lab', { forms: ['UACR', 'ACR', 'microalbumin'], cs: true }),
  E('PSA', 'PSA (prostate blood test)', 'Prostate-specific antigen — a blood test related to the prostate.', 'lab', { cs: true }),
  E('FBG', 'fasting blood sugar', 'Fasting blood glucose — blood sugar measured after not eating for at least 8 hours.', 'lab', { forms: ['FBG', 'FPG', 'FBS'], cs: true }),
  E('BP', 'blood pressure', 'Blood pressure — the top number is pressure when the heart beats, the bottom number between beats.', 'test', { forms: ['BP', 'B/P'], cs: true }),
  E('HR', 'heart rate', 'Heart rate (pulse), in beats per minute.', 'test', { cs: true }),
  E('RR', 'breathing rate', 'Respiratory rate — breaths per minute.', 'test', { cs: true }),
  E('SpO2', 'oxygen level', 'Oxygen saturation — how much oxygen your blood is carrying.', 'test', { forms: ['SpO2', 'O2 sat', 'O2sat', 'O2 sats'], cs: true }),
  E('BMI', 'BMI (body mass index)', 'Body mass index — a measure of weight relative to height.', 'test', { cs: true }),
  E('EKG', 'EKG (heart tracing)', 'Electrocardiogram — a quick, painless test of the heart\'s electrical activity.', 'test', { forms: ['EKG', 'ECG'], cs: true }),
  E('echo', 'heart ultrasound', 'Echocardiogram — an ultrasound picture of the heart.', 'test', { forms: ['echo', 'Echo', 'TTE'], cs: true }),
  E('CXR', 'chest X-ray', 'Chest X-ray.', 'test', { cs: true }),
  E('CT', 'CT scan', 'Computed tomography — a detailed X-ray scan.', 'test', { forms: ['CT', 'CAT scan'], cs: true }),
  E('MRI', 'MRI scan', 'Magnetic resonance imaging — a detailed scan that uses magnets instead of X-rays.', 'test', { cs: true }),
  E('PFTs', 'breathing tests', 'Pulmonary function tests — breathing tests of how well your lungs work.', 'test', { forms: ['PFTs', 'PFT'], cs: true }),
  E('labs', 'blood tests', 'Lab tests, usually blood or urine tests.', 'test', { forms: ['labs'] }),

  // ── Medicine classes & clinical jargon ─────────────────────────────────────
  E('statins', 'statins (cholesterol-lowering medicines)', 'Statins — medicines such as atorvastatin that lower LDL cholesterol and the risk of heart attack and stroke.', 'drug-class', { forms: ['statins', 'statin'] }),
  E('ACE inhibitor', 'ACE inhibitor (blood pressure medicine)', 'ACE inhibitors — blood pressure medicines such as lisinopril; they also help protect the kidneys.', 'drug-class', { forms: ['ACE inhibitors', 'ACE inhibitor', 'ACEi', 'ACE-I'] }),
  E('ARB', 'ARB (blood pressure medicine)', 'Angiotensin receptor blockers — blood pressure medicines such as losartan.', 'drug-class', { forms: ['ARBs', 'ARB'], cs: true }),
  E('NSAIDs', 'NSAIDs (anti-inflammatory pain relievers)', 'Nonsteroidal anti-inflammatory drugs — pain relievers such as ibuprofen and naproxen.', 'drug-class', { forms: ['NSAIDs', 'NSAID', 'NSAIDS'], cs: true }),
  E('SSRI', 'SSRI (antidepressant)', 'Selective serotonin reuptake inhibitors — a common type of antidepressant, such as sertraline.', 'drug-class', { forms: ['SSRIs', 'SSRI'], cs: true }),
  E('ICS', 'inhaled steroid (controller inhaler)', 'Inhaled corticosteroid — a daily "controller" inhaler that calms airway swelling, such as fluticasone.', 'drug-class', { forms: ['ICS'], cs: true }),
  E('ACT', 'Asthma Control Test score', 'Asthma Control Test — a short questionnaire; higher scores (20–25) mean asthma is better controlled.', 'test', { forms: ['ACT'], cs: true }),
  E('PPI', 'PPI (acid reducer)', 'Proton pump inhibitors — medicines that reduce stomach acid, such as omeprazole.', 'drug-class', { forms: ['PPIs', 'PPI'], cs: true }),
  E('diuretic', 'water pill (diuretic)', 'A "water pill" that helps the body get rid of extra salt and water.', 'drug-class', { forms: ['diuretics', 'diuretic'] }),
  E('anticoagulant', 'blood thinner', 'A medicine that lowers the chance of blood clots (a "blood thinner").', 'drug-class', { forms: ['anticoagulants', 'anticoagulant', 'anticoagulation'] }),
  E('ASA', 'aspirin', 'Aspirin.', 'abbreviation', { cs: true }),
  E('APAP', 'acetaminophen (Tylenol)', 'Acetaminophen (Tylenol).', 'abbreviation', { cs: true }),
  E('HCTZ', 'hydrochlorothiazide (a water pill)', 'Hydrochlorothiazide — a diuretic ("water pill") for blood pressure.', 'abbreviation', { cs: true }),
  E('well controlled', 'well controlled (in a healthy range)', 'The condition is in a healthy target range with the current treatment.', 'jargon', { forms: ['well controlled', 'well-controlled'] }),
  E('titrate', 'adjust the dose step by step', 'Slowly adjust a dose up or down to find the right amount.', 'jargon', { forms: ['titrate', 'titration', 'titrated'] }),
  E('taper', 'lower the dose slowly', 'Lower a dose slowly over time instead of stopping all at once.', 'jargon', { forms: ['taper', 'tapered', 'tapering'] }),
  E('adherence', 'taking medicines as prescribed', 'How closely medicines are taken as prescribed.', 'jargon', { forms: ['adherence', 'adherent', 'compliance', 'compliant'] }),
  E('bilateral', 'on both sides', 'On both sides of the body.', 'jargon'),
  E('unilateral', 'on one side', 'On one side of the body.', 'jargon'),
  E('benign', 'not cancer', 'Not cancer and not usually harmful.', 'jargon'),
  E('malignant', 'cancerous', 'Cancerous — able to spread.', 'jargon'),
  E('acute', 'sudden or short-term', 'Sudden or recent — lasting a short time.', 'jargon'),
  E('chronic', 'long-term', 'Long-lasting, usually months or more.', 'jargon'),
  E('idiopathic', 'of unknown cause', 'With no known cause.', 'jargon'),
  E('asymptomatic', 'without symptoms', 'Not causing any symptoms.', 'jargon'),
  E('afebrile', 'no fever', 'No fever.', 'jargon'),
  E('febrile', 'feverish', 'Having a fever.', 'jargon'),
  E('prophylaxis', 'prevention', 'Treatment to prevent a problem before it happens.', 'jargon', { forms: ['prophylaxis', 'prophylactic'] }),
  E('prognosis', 'expected outcome', 'The likely course or outcome of a condition.', 'jargon'),
  E('etiology', 'cause', 'The cause of a condition.', 'jargon'),
  E('contraindicated', 'should not be used', 'Should not be used because it could be harmful in this situation.', 'jargon', { forms: ['contraindicated', 'contraindication'] }),
  E('unremarkable', 'normal', 'Normal — nothing concerning found.', 'jargon'),
  E('renal', 'kidney', 'Related to the kidneys.', 'jargon'),
  E('hepatic', 'liver', 'Related to the liver.', 'jargon'),
  E('cardiac', 'heart', 'Related to the heart.', 'jargon'),
  E('pulmonary', 'lung', 'Related to the lungs.', 'jargon'),
  E('GI', 'stomach and intestines', 'Gastrointestinal — the stomach and intestines.', 'jargon', { cs: true }),
];

// ── Matching ──────────────────────────────────────────────────────────────────

export interface GlossaryMatch {
  entry: GlossaryEntry;
  /** Text as it appeared. */
  text: string;
  index: number;
  length: number;
  /** Replacement for dynamic patterns (e.g. q6h → "every 6 hours"). */
  plain: string;
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWordChar = (ch: string | undefined): boolean => ch !== undefined && /[A-Za-z0-9]/.test(ch);

interface CompiledForm {
  entry: GlossaryEntry;
  regex: RegExp;
}

const COMPILED: CompiledForm[] = GLOSSARY.flatMap((entry) =>
  (entry.forms ?? [entry.term]).map((form) => {
    const endsWithWord = isWordChar(form[form.length - 1]);
    const startsWithWord = isWordChar(form[0]);
    const body = escapeRegex(form).replace(/\\ /g, '\\s+').replace(/ /g, '\\s+');
    const left = startsWithWord ? '(?<![A-Za-z0-9])' : '';
    const right = endsWithWord ? '(?![A-Za-z0-9])' : '';
    // A trailing "." in a form ("p.o.") must not swallow a sentence period that other forms rely on.
    const flags = entry.caseSensitive ? 'g' : 'gi';
    return { entry, regex: new RegExp(`${left}${body}${right}`, flags) };
  }),
);

const RELEASE_PLAIN: Record<string, string> = {
  ER: 'extended-release',
  XR: 'extended-release',
  XL: 'extended-release',
  SR: 'extended-release',
  CR: 'extended-release',
  DR: 'delayed-release',
  IR: 'immediate-release',
  ODT: 'dissolving tablet',
};

/**
 * Patterns whose plain text depends on the match (every N hours, "3 mo" → "3 months").
 * `contextual` ones win over a plain entry for the same text: "Metformin ER 500 mg" is
 * extended-release (not the emergency room), "SpO2 98% on RA" is room air (not arthritis).
 */
const DYNAMIC: Array<{ regex: RegExp; entry: GlossaryEntry; plain: (m: RegExpExecArray) => string; contextual?: boolean }> = [
  {
    // A formulation suffix after a medicine name and before a strength or dose form.
    regex: /(?<=\b[A-Za-z][A-Za-z-]{2,}\s)(?<!\b(?:the|to|in|at|an|a|of|from|via|into|and|or|go|went|the)\s)(ER|XR|XL|SR|CR|DR|IR|ODT)(?=\s+\d+(?:\.\d+)?\s?(?:mg|mcg|g|units?)\b|\s+(?:tab|tabs|tablets?|caps?|capsules?)\b)/g,
    entry: E('ER', 'extended-release', 'Extended-release (ER, XR, XL, SR) — the medicine is released slowly over the day. DR means delayed-release; IR means immediate-release.', 'sig'),
    plain: (m) => RELEASE_PLAIN[m[1] ?? ''] ?? 'extended-release',
    contextual: true,
  },
  {
    // "SpO2 98% on RA", "O2 sat 95% RA": room air (no extra oxygen).
    regex: /(?<=\b(?:SpO2|O2|sats?|saturation|pulse ox)\b[^.;]{0,15}?(?:\bon\s|%\s?))RA\b/g,
    entry: E('RA (room air)', 'room air', 'Room air — breathing normal air, without extra oxygen.', 'abbreviation'),
    plain: () => 'room air',
    contextual: true,
  },
  {
    regex: /(?<![A-Za-z0-9])q\.?\s?(\d{1,2})\s?[-–]\s?(\d{1,2})\s?h(?:rs?|ours?)?\.?(?![A-Za-z0-9])/gi,
    entry: E('q4-6h', 'every few hours', 'Every so many hours (for example, q4-6h = every 4 to 6 hours).', 'sig'),
    plain: (m) => `every ${m[1]} to ${m[2]} hours`,
  },
  {
    regex: /(?<![A-Za-z0-9])q\.?\s?(\d{1,2})\s?h(?:rs?|ours?)?\.?(?![A-Za-z0-9])/gi,
    entry: E('q#h', 'every few hours', 'Every so many hours (for example, q6h = every 6 hours).', 'sig'),
    plain: (m) => `every ${m[1]} hours`,
  },
  {
    regex: /(?<![A-Za-z0-9.])(\d+(?:\.\d+)?(?:\s?[-–]\s?\d+)?)\s?(wks?|mos?|yrs?|hrs?)(?![A-Za-z0-9])/g,
    entry: E('# wk/mo/yr', 'time', 'Time shorthand: wk = week, mo = month, yr = year, hr = hour.', 'abbreviation'),
    plain: (m) => {
      const amount = m[1] ?? '';
      const unit = (m[2] ?? '').toLowerCase().replace(/s$/, '');
      const word = unit === 'wk' ? 'week' : unit === 'mo' ? 'month' : unit === 'yr' ? 'year' : 'hour';
      return `${amount} ${amount === '1' ? word : `${word}s`}`;
    },
  },
  {
    regex: /(?<![A-Za-z0-9])(\d{1,2})\s?x\s?\/\s?(d|day|wk|week|mo|month|yr|year)(?![A-Za-z0-9])/gi,
    entry: E('#x/period', 'times per period', 'How often (for example, 1x/mo = once a month).', 'abbreviation'),
    plain: (m) => {
      const n = Number(m[1]);
      const unit = (m[2] ?? '').toLowerCase();
      const period = unit.startsWith('d') ? 'day' : unit.startsWith('w') ? 'week' : unit.startsWith('m') ? 'month' : 'year';
      const times = n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`;
      return `${times} a ${period}`;
    },
  },
  {
    regex: /(?<![A-Za-z0-9])[xX]\s?(\d{1,3})\s?(d|days?|wks?|weeks?)(?![A-Za-z0-9])/g,
    entry: E('x#d', 'for a number of days', 'For a set length of time (for example, x7d = for 7 days).', 'sig'),
    plain: (m) => `for ${m[1]} ${/^w/i.test(m[2] ?? '') ? 'weeks' : 'days'}`,
  },
];

/** All glossary terms in `text`, in order, without overlaps (longest match wins). */
export function findGlossaryTerms(text: string): GlossaryMatch[] {
  const candidates: GlossaryMatch[] = [];
  for (const { entry, regex } of COMPILED) {
    regex.lastIndex = 0;
    for (let m = regex.exec(text); m; m = regex.exec(text)) {
      candidates.push({ entry, text: m[0], index: m.index, length: m[0].length, plain: entry.plain });
      if (m[0].length === 0) regex.lastIndex++;
    }
  }
  const contextual = new Set<GlossaryMatch>();
  for (const { regex, entry, plain, contextual: wins } of DYNAMIC) {
    regex.lastIndex = 0;
    for (let m = regex.exec(text); m; m = regex.exec(text)) {
      const match = { entry, text: m[0], index: m.index, length: m[0].length, plain: plain(m) };
      candidates.push(match);
      if (wins) contextual.add(match);
    }
  }
  candidates.sort((a, b) => a.index - b.index || b.length - a.length || Number(contextual.has(b)) - Number(contextual.has(a)));
  const out: GlossaryMatch[] = [];
  let end = -1;
  for (const candidate of candidates) {
    if (candidate.index < end) continue;
    out.push(candidate);
    end = candidate.index + candidate.length;
  }
  return out;
}

/** Unique entries found in `text` (first occurrence order). */
export function uniqueTerms(text: string): GlossaryMatch[] {
  const seen = new Set<GlossaryEntry>();
  return findGlossaryTerms(text).filter((m) => {
    if (seen.has(m.entry)) return false;
    seen.add(m.entry);
    return true;
  });
}

/** Rewrites clinician shorthand into plain language, e.g. "Cont metformin 500 mg PO BID w/ meals." */
export function toPlainLanguage(text: string): string {
  const matches = findGlossaryTerms(text);
  let out = '';
  let cursor = 0;
  for (const match of matches) {
    out += text.slice(cursor, match.index);
    let replacement = match.plain;
    // Don't repeat a gloss the author already wrote in parentheses right after the term.
    const after = text.slice(match.index + match.length, match.index + match.length + 3);
    const insideParens = text[match.index - 1] === '(';
    if (insideParens || after.startsWith(' (') || after.startsWith('(')) replacement = replacement.replace(/\s*\([^)]*\)\s*$/, '');
    // "w/meals" → "with meals"
    if (match.text.endsWith('/') && isWordChar(text[match.index + match.length])) replacement += ' ';
    out += replacement;
    cursor = match.index + match.length;
  }
  out += text.slice(cursor);
  out = out
    .replace(/\s*(?:→|->|=>)\s*/g, ', so ')
    .replace(/\s*↑\s*/g, ' increased ')
    .replace(/\s*↓\s*/g, ' decreased ')
    .replace(/([\w)])\s+\+\s+([\w(])/g, '$1 and $2')
    .replace(/\bas needed (?!for\b|to\b|by\b|and\b|or\b)(?=[a-z])/gi, 'as needed for ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/(^|\s)~\s?(?=\d|once|twice)/g, '$1about ')
    .replace(/\b(return to the clinic|follow-up) (?=\d)/gi, '$1 in ')
    .replace(/\bfollow-up (?!visit|call|in\b|for\b|with\b|on\b|as\b)(?=[a-z])/gi, 'follow-up for ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
  return out ? out[0]!.toUpperCase() + out.slice(1) : out;
}

const NOTE_KINDS: ReadonlySet<GlossaryKind> = new Set(['sig', 'abbreviation', 'condition', 'lab', 'test']);

function noteAbbreviations(text: string): number {
  return findGlossaryTerms(text).filter((m) => NOTE_KINDS.has(m.entry.kind) && m.entry.caseSensitive).length;
}

/** Someone writing in their own voice ("My BP is 220/130…", "Dad 72 y/o…"), or asking a question. */
const OWN_VOICE = /\b(i|i'm|i've|my|me|we|our|mom|mum|dad|husband|wife|son|daughter|baby)\b|\?/i;

/**
 * Heuristic: does this read like clinician shorthand (≥3 abbreviations, or dense ones)? A
 * person typing in their own words ("My BP is 185/125 and my HR is 110") needs more.
 */
export function looksLikeClinicalNote(text: string): boolean {
  const hits = noteAbbreviations(text);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (OWN_VOICE.test(text)) return hits >= 4;
  return hits >= 3 || (hits >= 2 && words <= 20);
}

/**
 * Stricter: a pasted clinician note (many abbreviations), whose findings are documentation
 * rather than something happening to the reader. Used to soften triage, so a patient's
 * typed message with a couple of abbreviations ("BP 190/100 … go to the ER?") never counts.
 */
export function looksLikePastedNote(text: string): boolean {
  const hits = noteAbbreviations(text);
  const words = text.split(/\s+/).filter(Boolean).length;
  return hits >= 6 || (hits >= 4 && words >= 25);
}

/** Terms worth a "Key terms" definition list (labs, conditions, medicine classes, jargon). */
export function keyTerms(text: string, max = 8): GlossaryEntry[] {
  const kinds: ReadonlySet<GlossaryKind> = new Set(['lab', 'condition', 'drug-class', 'jargon', 'test']);
  return uniqueTerms(text)
    .map((m) => m.entry)
    .filter((entry) => kinds.has(entry.kind) && !['labs', 'BP'].includes(entry.term))
    .slice(0, max);
}

/** "What does …", "what is a normal …", "define …" right before the term. */
const ASKS_BEFORE =
  /\b(what (is|are|does|do|was)|what's|whats|define|definition of|meaning of|explain|stand for)\s+(?:(?:a|an|the|my|this|that|normal|high|low|healthy|good|your)\s+){0,2}["'“(]?$/i;
/** "… mean?", "… stand for?" right after the term. */
const ASKS_AFTER = /^["'”)]?\s*(mean|means|meaning|stand for|stands for|short for)\b/i;

/**
 * Terms the message asks the meaning of ("What does BID mean?", "what is a normal A1c",
 * "what does PRN stand for") — not every term that happens to appear ("the difference
 * between urgent care and the ER" is not a question about the letters "ER").
 */
export function glossaryQuestionTerms(message: string): GlossaryEntry[] {
  const aboutAbbreviations = /\babbreviations?\b/i.test(message);
  const out: GlossaryEntry[] = [];
  for (const match of findGlossaryTerms(message)) {
    const before = message.slice(Math.max(0, match.index - 60), match.index);
    const after = message.slice(match.index + match.length, match.index + match.length + 20);
    const asked = ASKS_BEFORE.test(before) || ASKS_AFTER.test(after) || (aboutAbbreviations && match.entry.caseSensitive === true);
    if (asked && !out.includes(match.entry)) out.push(match.entry);
  }
  return out;
}

/** "What does BID mean?", "what is an A1c", "what does PRN stand for". */
export function isGlossaryQuestion(message: string): boolean {
  return glossaryQuestionTerms(message).length > 0;
}

export function glossarySize(): number {
  return GLOSSARY.length + DYNAMIC.length;
}
