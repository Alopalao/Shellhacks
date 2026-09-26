import { describe, expect, it } from 'vitest';
import {
  findGlossaryTerms,
  glossarySize,
  isGlossaryQuestion,
  keyTerms,
  looksLikeClinicalNote,
  toPlainLanguage,
} from '../src/ai/glossary';
import { NOTE_BODY } from './ai-fixtures';

const terms = (text: string) => findGlossaryTerms(text).map((m) => m.entry.term);

describe('glossary', () => {
  it('covers at least 100 abbreviations and terms', () => {
    expect(glossarySize()).toBeGreaterThanOrEqual(100);
  });

  it('translates the SPEC visit note line by line', () => {
    expect(toPlainLanguage('F/u HTN & T2DM.')).toBe('Follow-up for high blood pressure and type 2 diabetes.');
    expect(toPlainLanguage('BP 128/82, well controlled on lisinopril 10 mg PO qd.')).toBe(
      'Blood pressure 128/82, well controlled (in a healthy range) on lisinopril 10 mg by mouth once a day.',
    );
    expect(toPlainLanguage('Cont metformin 500 mg PO BID w/ meals.')).toBe('Continue metformin 500 mg by mouth twice a day with meals.');
    expect(toPlainLanguage('LDL 162 → start atorvastatin 20 mg PO qhs.')).toBe(
      'LDL ("bad" cholesterol) 162, so start atorvastatin 20 mg by mouth at bedtime.',
    );
    expect(toPlainLanguage('Recheck lipids + CMP in 6–8 wks.')).toMatch(/^Recheck cholesterol levels \(lipids\) and CMP .* in 6–8 weeks\.$/);
    expect(toPlainLanguage('Pt counseled re: diet/exercise, SE of statins (myalgias).')).toBe(
      'Patient counseled about diet/exercise, side effects of statins (muscle aches).',
    );
    expect(toPlainLanguage('RTC 3 mo, sooner PRN.')).toBe('Return to the clinic in 3 months, sooner as needed.');
  });

  it('is token-aware (no matches inside words or on lowercase look-alikes)', () => {
    expect(terms('I need a new script for my meds')).toEqual([]);
    expect(terms("im going to take ibuprofen")).toEqual([]);
    expect(terms('The recipe has soy sauce')).toEqual([]);
    expect(terms('Pt stable')).toEqual(['Pt']);
    expect(terms('PT twice a week')).toEqual(['PT']);
  });

  it('handles slash shorthand and dynamic sigs', () => {
    expect(toPlainLanguage('take w/o food, f/u 2 wks')).toBe('Take without food, follow-up in 2 weeks');
    expect(toPlainLanguage('take w/meals')).toBe('Take with meals');
    expect(toPlainLanguage('take 1 tab q6h prn pain x7d')).toBe('Take 1 tablet every 6 hours as needed for pain for 7 days');
    expect(toPlainLanguage('Albuterol 2 puffs q4–6h PRN')).toBe('Albuterol 2 puffs every 4 to 6 hours as needed');
    expect(toPlainLanguage('Night sx ~1x/mo.')).toBe('Night symptoms about once a month.');
    expect(toPlainLanguage('Annual PE. Pt feels well, no CP/SOB.')).toBe('Annual physical exam. Patient feels well, no chest pain/shortness of breath.');
  });

  it('recognizes clinician notes and glossary questions', () => {
    expect(looksLikeClinicalNote(NOTE_BODY)).toBe(true);
    expect(looksLikeClinicalNote('Can I take ibuprofen with lisinopril?')).toBe(false);
    expect(isGlossaryQuestion('What does BID mean?')).toBe(true);
    expect(isGlossaryQuestion('Can I take it twice?')).toBe(false);
  });

  it('lists key terms worth defining', () => {
    const list = keyTerms(NOTE_BODY, 12).map((t) => t.term);
    expect(list).toEqual(expect.arrayContaining(['A1c', 'LDL', 'CMP', 'statins', 'myalgias']));
  });
});
