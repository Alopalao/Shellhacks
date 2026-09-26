// Plain-language label text, condition matching, glossary context and topic/research helpers.
import { describe, expect, it } from 'vitest';
import { conditionLabelPatterns } from '../src/ai/drugs';
import { glossaryQuestionTerms, looksLikeClinicalNote, looksLikePastedNote, toPlainLanguage } from '../src/ai/glossary';
import { plainLabel } from '../src/ai/label-text';
import { classTopicPubMedQuery, detectTopics, questionClassGroups, rankArticlesForQuestion } from '../src/ai/topics';

describe('plainLabel', () => {
  it('rewrites "adjunct to" grammatically', () => {
    expect(plainLabel('Metformin tablets are indicated as an adjunct to diet and exercise to improve glycemic control.')).toBe(
      'Metformin tablets are indicated along with diet and exercise to improve blood sugar control.',
    );
    expect(plainLabel('Use as adjunct to diet.')).toBe('Use along with diet.');
  });

  it('restores flattened superscripts', () => {
    expect(plainLabel('eGFR > 30 mL/min/1.73 m 2')).toBe('eGFR > 30 mL/min/1.73 m²');
  });
});

describe('condition warnings', () => {
  const hypertension = conditionLabelPatterns(['Hypertension'])[0]!.label;
  const kidney = conditionLabelPatterns(['Chronic kidney disease'])[0]!.label;

  it('does not read intracranial or pulmonary hypertension as high blood pressure', () => {
    expect(hypertension.test('Intracranial Hypertension (Pseudotumor Cerebri): Avoid use with tetracyclines')).toBe(false);
    expect(hypertension.test('Pulmonary hypertension has been reported')).toBe(false);
    expect(hypertension.test('Ask a doctor before use if you have high blood pressure')).toBe(true);
    expect(hypertension.test('Hypertension: monitor blood pressure')).toBe(true);
  });

  it('needs a kidney condition, not any mention of the kidneys', () => {
    expect(kidney.test('Metformin is eliminated by renal elimination')).toBe(false);
    expect(kidney.test('Use in patients with renal impairment')).toBe(true);
  });
});

describe('glossary in context', () => {
  it.each([
    ['Metformin ER 500 mg PO qd', 'Metformin extended-release 500 mg by mouth once a day'],
    ['Nifedipine ER 30 mg daily', 'Nifedipine extended-release 30 mg daily'],
    ['PT/INR in 1 wk', 'Blood clotting test (PT/INR) in 1 week'],
    ['SpO2 98% on RA', 'Oxygen level 98% on room air'],
    ['Take 1 tab PO q6h prn, max 4 tabs/day', 'Take 1 tablet by mouth every 6 hours as needed, max 4 tablets/day'],
    ['D/c HCTZ', 'Stop hydrochlorothiazide (a water pill)'],
    ['Went to the ER 2 days ago', 'Went to the emergency room 2 days ago'],
    ['RA flare', 'Rheumatoid arthritis flare'],
  ])('%s → %s', (note, plain) => {
    expect(toPlainLanguage(note)).toBe(plain);
  });

  it('defines only the terms a question asks about', () => {
    const asked = (q: string) => glossaryQuestionTerms(q).map((e) => e.term);
    expect(asked('What does BID mean?')).toEqual(['BID']);
    expect(asked('What is a normal A1c?')).toEqual(['A1c']);
    expect(asked('what does PRN stand for')).toEqual(['PRN']);
    expect(asked('What is the difference between urgent care and the ER?')).toEqual([]);
    expect(asked('What is the difference between a stroke and a TIA?')).toEqual([]);
  });

  it('tells a typed message from a pasted note', () => {
    expect(looksLikeClinicalNote('My BP is 220/130 and I have chest pain, should I go to the ER?')).toBe(false);
    expect(looksLikeClinicalNote("Dad 72 y/o, face drooping, slurred speech, BP 190/100")).toBe(false);
    expect(looksLikePastedNote('Heart rate 150 and crushing chest pain. HR still high, BP 90/60')).toBe(false);
    expect(looksLikePastedNote('F/u HTN & T2DM. BP 128/82 on lisinopril 10 mg PO qd. Pt denies CP, SOB.')).toBe(true);
  });
});

describe('topics and research', () => {
  it('skips negated mentions', () => {
    expect(detectTopics('No chest pain today, just checking in about my blood pressure meds').map((t) => t.key)).toEqual(['high blood pressure']);
  });

  it('covers insurance, rights, accidents, cosmetic care and where to get care', () => {
    const key = (q: string) => detectTopics(q)[0]?.key;
    expect(key('How does a deductible work with my insurance?')).toBe('health insurance');
    expect(key('Can I sue my doctor for malpractice?')).toBe('patient rights');
    expect(key('What should I do after a car accident?')).toBe('car accident');
    expect(key('Is plastic surgery like a tummy tuck safe?')).toBe('cosmetic surgery');
    expect(key('Is teeth whitening safe?')).toBe('teeth whitening');
    expect(key('What is the difference between urgent care and the ER?')).toBe('where to get care');
  });

  it('searches the drug classes a question names', () => {
    const groups = questionClassGroups('Risk of AKI with ACE inhibitor + NSAID + diuretic (triple whammy)');
    expect(groups).toHaveLength(4);
    const query = classTopicPubMedQuery(questionClassGroups('SGLT2 inhibitors in HFpEF'), ['HFpEF'], null, 'ti');
    expect(query).toBe('(SGLT2[ti] OR "SGLT-2"[ti] OR "sodium-glucose cotransporter 2"[ti] OR gliflozin*[ti]) AND (HFpEF[ti])');
  });

  it('keeps only articles about the question, for the right population', () => {
    const articles = [
      { title: '2026 iCatCare consensus guidelines on chronic kidney disease in cats' },
      { title: 'Febrile seizures: a review' },
      { title: 'Omega-3 fatty acids and blood pressure' },
      { title: 'Lisinopril dosing in hypertension' },
    ];
    expect(rankArticlesForQuestion(articles, ['lisinopril', 'ACE inhibitor*'], 'What dose of lisinopril should I be on?').map((a) => a.title)).toEqual([
      'Lisinopril dosing in hypertension',
    ]);
    expect(rankArticlesForQuestion(articles, ['seizures'], 'I had a seizure years ago').map((a) => a.title)).toEqual([]);
  });
});
