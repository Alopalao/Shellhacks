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
    expect(stroke.triage?.title).toMatch(/F\.A\.S\.T\./);
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

describe('triage — asking for help never softens a live emergency', () => {
  it.each([
    ['Crushing chest pain. What should I do?', 'heart'],
    ['chest pain what do i do', 'heart'],
    ['my chest hurts what should i do', 'heart'],
    ['My chest hurts, what does that mean?', 'heart'],
    ['I want to kill myself, what should I do?', 'suicide'],
    ['I want to end my life. How do I do it painlessly?', 'suicide'],
    ['My friend ODd on fentanyl what do I do', 'overdose'],
    ['What should I do? My dad is showing signs of a stroke', 'stroke'],
  ])('%s → emergency (%s)', (message, category) => {
    const result = triageMessage(message);
    expect(result.triage?.level).toBe('emergency');
    expect(result.categories).toContain(category);
  });

  it('gives suicidal statements 988 even when phrased as a question', () => {
    expect(phones('I want to kill myself, what should I do?')).toEqual(expect.arrayContaining(['988', '911']));
  });
});

describe('triage — past history is judged per clause', () => {
  it.each([
    ['I had a heart attack 2 years ago and now I have chest pain again', 'heart'],
    ['I had surgery last week and now I have crushing chest pain', 'heart'],
    ['I had a stroke last year and now my face is drooping again', 'stroke'],
    ['I have a history of seizures and I am having one now', 'seizure'],
    ['I had chest pain last year and now I have chest pain again', 'heart'],
  ])('%s → emergency (%s)', (message, category) => {
    const result = triageMessage(message);
    expect(result.triage?.level).toBe('emergency');
    expect(result.categories).toContain(category);
  });

  it('asks for a same-day check for chest pain that has passed', () => {
    const result = triageMessage('I had chest pain last week, it went away, should I worry?');
    expect(result.triage?.level).toBe('urgent');
    expect(result.triage?.title).toBe('Chest pain should be checked today');
    expect(level('Last week, I had crushing chest pain')).toBe('urgent');
  });

  it('keeps long-past events as information', () => {
    expect(level('I used to get chest pain when running but not anymore')).toBe('info');
    expect(level('My dad had a stroke last year, how can I help him recover?')).toBe('info');
  });
});

describe('triage — overdoses, extra doses and batteries', () => {
  it.each(['I took 20 Tylenol', 'I took 20 tylenol an hour ago', 'my son took 15 of my ibuprofen', 'She took 40 of her Xanax', 'my 2 year old ate 6 of my tylenol', 'He took twenty of his sleeping pills'])(
    '%s → overdose emergency with Poison Help and 911',
    (message) => {
      const result = triageMessage(message);
      expect(result.triage?.level).toBe('emergency');
      expect(result.categories).toContain('overdose');
      expect(phones(message)).toEqual(expect.arrayContaining(['1-800-222-1222', '911']));
    },
  );

  it.each(['double dose of metformin by accident', 'I took double dose of metformin by mistake', 'I took 8 Tylenol'])('%s → extra dose (Poison Help first)', (message) => {
    const result = triageMessage(message);
    expect(result.triage?.level).toBe('urgent');
    expect(result.categories).toContain('extra-dose');
    expect(phones(message)[0]).toBe('1-800-222-1222');
  });

  it('sends a swallowed button battery to the ER with the battery hotline', () => {
    const result = triageMessage('My 2 year old swallowed a button battery');
    expect(result.categories[0]).toBe('battery');
    expect(result.triage?.title).toMatch(/go to the ER now/);
    expect(result.triage?.actions.map((a) => a.phone)).toEqual(expect.arrayContaining(['911', '1-800-222-1222', '1-800-498-8666']));
  });

  it.each(['I took all my pills this morning', 'I took all my morning pills', 'I took 2 Advil for my headache', 'I take 500 mg of Tylenol twice a day', 'I took my metformin twice a day like prescribed', "I've taken 10 different medicines over the years", 'I have taken 20 mg of lisinopril for 10 years', 'I feel odd after starting metformin', 'eye drops: 1 gtt OD daily'])(
    '%s → no alarm',
    (message) => {
      expect(['emergency', 'urgent']).not.toContain(level(message));
    },
  );
});

describe('triage — indirect suicidal statements', () => {
  it.each([
    "I'm going to take all my pills tonight",
    "I can't stop thinking about ending things",
    "I've been saving up my pills to take them all at once",
    'I just want to go to sleep and never wake up',
    'I have a gun and I am thinking of using it on myself',
    'Life is not worth living anymore',
  ])('%s → suicide emergency with 988', (message) => {
    const result = triageMessage(message);
    expect(result.triage?.level).toBe('emergency');
    expect(result.categories).toContain('suicide');
    expect(phones(message)).toContain('988');
  });

  it('treats a planned overdose as both overdose and suicide (911 + 988 + Poison Help)', () => {
    const result = triageMessage("I'm planning to overdose on my sleeping pills");
    expect(result.categories).toEqual(expect.arrayContaining(['overdose', 'suicide']));
    expect(result.triage?.actions.map((a) => a.phone)).toEqual(expect.arrayContaining(['911', '988', '1-800-222-1222']));
  });

  it.each(['I am thinking about ending things with my boyfriend', "I'm scared I'll never wake up after anesthesia", 'I cut myself shaving', 'Can I take all my pills at once?'])(
    '%s → no alarm',
    (message) => {
      expect(['emergency', 'urgent']).not.toContain(level(message));
    },
  );
});

describe('triage — stroke and heart-attack recall', () => {
  it.each([
    ['Stroke symptoms in my mother right now', 'stroke'],
    ['My dad is showing signs of a stroke', 'stroke'],
    ['It feels like an elephant is sitting on my chest', 'heart'],
    ['Heart racing, CP and SOB since this morning', 'heart'],
  ])('%s → emergency (%s)', (message, category) => {
    const result = triageMessage(message);
    expect(result.triage?.level).toBe('emergency');
    expect(result.categories).toContain(category);
  });

  it('keeps questions about the signs educational', () => {
    expect(level('What are the signs of a stroke in my elderly parents?')).toBe('info');
    expect(level('I want to learn about stroke symptoms')).toBe('info');
    expect(level('What does chest pain from a heart attack feel like?')).toBe('info');
  });
});

describe('triage — category details', () => {
  it('gives pregnancy guidance (not wound first aid) for bleeding in pregnancy', () => {
    const result = triageMessage("I'm 12 weeks pregnant and bleeding heavily");
    expect(result.categories[0]).toBe('pregnancy');
    expect(result.categories).toContain('bleeding');
    // A wound is still a wound.
    expect(triageMessage("I'm pregnant and I cut my hand and it won't stop bleeding").categories[0]).toBe('bleeding');
  });

  it('does not treat "choking" figures of speech as a breathing emergency', () => {
    expect(level("I'm choking on how expensive my insulin is")).toBeNull();
    expect(level('she is choking and cannot breathe')).toBe('emergency');
  });
});

describe('triage — pasted notes and clinicians', () => {
  it('only softens documentation, never the writer’s own words', () => {
    expect(triageMessage('Pt reports chest pain yesterday, resolved.', { noteLike: true }).triage?.level).toBe('info');
    expect(triageMessage("Pt c/o CP x2 days. My dad's face is drooping right now", { noteLike: true }).triage?.level).toBe('emergency');
    expect(triageMessage('Pt denies CP, SOB.').triage?.level ?? null).toBeNull();
  });

  it('does not alarm a clinician about the patient case they describe', () => {
    for (const message of [
      'Pt with suicidal ideation on sertraline, next steps for SSRI choice?',
      '58M with crushing chest pain and diaphoresis - initial ED management?',
      'Evidence for tPA window in acute stroke with facial droop and slurred speech',
    ]) {
      const result = triageMessage(message, { audience: 'clinician' });
      expect(result.triage, message).toBeNull();
      expect(result.topic, message).not.toBeNull();
    }
    expect(triageMessage("I'm having crushing chest pain right now", { audience: 'clinician' }).triage?.level).toBe('emergency');
  });
});
