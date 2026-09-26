import { describe, expect, it } from 'vitest';
import { triageMessage } from '../src/ai/triage';

const level = (message: string) => triageMessage(message).triage?.level ?? null;
const phones = (message: string) => (triageMessage(message).triage?.actions ?? []).map((a) => a.phone).filter(Boolean);

describe('triage — emergencies', () => {
  it.each([
    ["my dad's face is drooping and he can't lift his arm", 'stroke'],
    ['his speech is slurred and one side of his body is weak', 'stroke'],
    ['I have the worst headache of my life', 'stroke'],
    ["I think I'm having a heart attack", 'heart'],
    ['crushing chest pain spreading to my left arm', 'heart'],
    ["I can't breathe", 'breathing'],
    ['her lips are turning blue', 'breathing'],
    ['my throat is closing up after eating peanuts', 'anaphylaxis'],
    ['my lips are swelling after taking lisinopril', 'anaphylaxis'],
    ["the bleeding won't stop", 'bleeding'],
    ['he is vomiting blood', 'bleeding'],
    ['my son is having a seizure', 'seizure'],
    ["she collapsed and won't wake up", 'unconscious'],
    ['I hit my head and now I keep throwing up', 'head-injury'],
    ["I'm 30 weeks pregnant and bleeding", 'pregnancy'],
    ['high fever and a stiff neck', 'meningitis'],
    ['I have an infection and now I am confused and my heart is racing', 'sepsis'],
    ['my BP is 190/115 and I have chest pain', 'heart'],
  ])('%s → emergency (%s)', (message, category) => {
    const result = triageMessage(message);
    expect(result.triage?.level).toBe('emergency');
    expect(result.categories).toContain(category);
    expect(result.triage?.actions.some((a) => a.phone === '911')).toBe(true);
  });

  it('points suicidal thoughts to 988 first (and 911)', () => {
    const result = triageMessage('I want to kill myself');
    expect(result.triage?.level).toBe('emergency');
    expect(result.triage?.actions[0]).toMatchObject({ phone: '988' });
    expect(phones("I don't want to be alive anymore")).toEqual(expect.arrayContaining(['988', '911']));
  });

  it('points poisonings and overdoses to Poison Help and 911', () => {
    expect(phones('my toddler swallowed a button battery')).toEqual(expect.arrayContaining(['1-800-222-1222', '911']));
    const both = triageMessage('I took all my pills because I want to die');
    expect(both.categories).toEqual(expect.arrayContaining(['overdose', 'suicide']));
    expect(both.triage?.actions.map((a) => a.phone)).toEqual(expect.arrayContaining(['911', '988', '1-800-222-1222']));
  });
});

describe('triage — urgent', () => {
  it.each([
    ['my BP is 185/125', 'bp-crisis'],
    ['I have a fever of 103.5', 'high-fever'],
    ['my 2 month old has a fever', 'infant-fever'],
    ["I can't keep anything down and haven't peed all day", 'dehydration'],
    ['the cut on my leg is red and the redness is spreading', 'infection'],
    ["my blood sugar is 52 and I'm shaky", 'low-sugar'],
    ['I accidentally took my lisinopril twice this morning', 'extra-dose'],
    ['I fainted yesterday at work', 'fainting'],
    ['I get a little short of breath when I climb stairs', 'breathing-mild'],
    ['I sometimes get chest pain when I climb stairs', 'heart'],
    ['I bumped my head on a cabinet', 'head-injury'],
  ])('%s → urgent (%s)', (message, category) => {
    const result = triageMessage(message);
    expect(result.triage?.level).toBe('urgent');
    expect(result.categories).toContain(category);
  });

  it('offers Poison Help for a double dose', () => {
    expect(phones('I accidentally took my lisinopril twice this morning')[0]).toBe('1-800-222-1222');
  });
});

describe('triage — avoids false alarms', () => {
  it.each([
    'Can I take ibuprofen with lisinopril?',
    'I have no chest pain but my arm is numb',
    "I don't have chest pain or shortness of breath, just a cough",
    'No fever, no stiff neck, just a headache',
    "I'm not suicidal, I'm just tired",
    'Can I take my metformin twice a day?',
    'BP 128/82 today',
    'I stroke my cat every day',
    'What is a normal A1c?',
    "I've been coughing for a week",
  ])('%s → no alarm', (message) => {
    expect(['emergency', 'urgent']).not.toContain(level(message));
  });

  it('answers educational questions with an info card, not an alarm', () => {
    const stroke = triageMessage('what are the signs of a stroke?');
    expect(stroke.triage?.level).toBe('info');
    expect(stroke.educational).toBe(true);
    expect(stroke.triage?.title).toMatch(/BE FAST/);
    expect(triageMessage('What should I do if someone is having a stroke?').triage?.level).toBe('info');
    expect(triageMessage('how do I recognize a heart attack in women?').triage?.level).toBe('info');
    const suicide = triageMessage('what are the warning signs of suicide?');
    expect(suicide.triage?.level).toBe('info');
    expect(suicide.triage?.actions[0]?.phone).toBe('988');
  });

  it('treats past events as information', () => {
    expect(level('I had a seizure years ago, can I drive?')).toBe('info');
  });

  it('still escalates hedged, personal, present-tense descriptions', () => {
    expect(level("I don't know if he's having a stroke, his speech is slurred")).toBe('emergency');
    expect(level('What does it mean if my face is drooping?')).toBe('emergency');
  });

  it('never alarms on pasted clinician shorthand', () => {
    const note = 'F/u HTN & T2DM. BP 128/82 on lisinopril 10 mg PO qd. Pt denies CP, SOB.';
    expect(triageMessage(note, { noteLike: true }).triage?.level ?? null).not.toBe('emergency');
    expect(triageMessage('Pt reports chest pain yesterday, resolved.', { noteLike: true }).triage?.level).toBe('info');
  });
});
