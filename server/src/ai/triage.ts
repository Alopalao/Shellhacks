// Rule-based red-flag triage. Always runs before any AI/evidence work.
//
// Design goals: catch real emergencies described in plain words, keep false positives low
// ("no chest pain", "what are the signs of a stroke?", "I had a seizure years ago"), and
// give concrete, safe next steps. Educational questions get an info-level card instead of
// an alarm. This is not a diagnostic tool; every message errs toward getting help.
//
// Framing is judged per match, not per message: "I had a heart attack 2 years ago and now I
// have chest pain" is live, and "what should I do?" after a symptom never makes it a lesson.

import type { Triage, TriageAction, TriageLevel } from '../shared/contracts';
import type { CitationDraft } from '../evidence/types';
import { DRUGS } from './drugs';

export type TriageCategory =
  | 'suicide'
  | 'battery'
  | 'overdose'
  | 'stroke'
  | 'heart'
  | 'breathing'
  | 'anaphylaxis'
  | 'unconscious'
  | 'seizure'
  | 'bleeding'
  | 'head-injury'
  | 'pregnancy'
  | 'meningitis'
  | 'sepsis'
  | 'bp-crisis'
  | 'low-sugar'
  | 'high-sugar'
  | 'extra-dose'
  | 'fainting'
  | 'breathing-mild'
  | 'high-fever'
  | 'infant-fever'
  | 'dehydration'
  | 'infection'
  | 'gi-bleed'
  | 'wound'
  | 'severe-pain';

export const CALL_911: TriageAction = { label: 'Call 911', phone: '911' };
export const CALL_988: TriageAction = { label: 'Call or text 988', phone: '988' };
export const CHAT_988: TriageAction = { label: 'Chat with 988 online', url: 'https://988lifeline.org/chat/' };
export const POISON_HELP: TriageAction = { label: 'Call Poison Help', phone: '1-800-222-1222' };
export const BATTERY_HOTLINE: TriageAction = { label: 'Battery Ingestion Hotline', phone: '1-800-498-8666' };
export const FIND_URGENT_CARE: TriageAction = {
  label: 'Find urgent care near me',
  url: 'https://www.google.com/maps/search/urgent+care+near+me',
};

interface CategoryInfo {
  level: Exclude<TriageLevel, 'info' | 'routine'>;
  title: string;
  message: string;
  actions: TriageAction[];
  /** "What to do right now" steps (emergency/urgent answers lead with these). */
  steps: string[];
  /** Warning signs to know (used for educational questions). */
  signs?: { heading: string; items: string[] };
  /** Title for educational (info-level) questions about this topic. */
  infoTitle: string;
  /** One-line addition when this is a secondary match. */
  also: string;
  /** Questions for the clinician (urgent answers). */
  questions?: string[];
  /** False when the lead message states specifics the reference page may not (thresholds etc.). */
  citeLead?: boolean;
  /** Title/message when a normally-emergency category is detected without danger signs. */
  urgentTitle?: string;
  urgentMessage?: string;
  /** MedlinePlus topic query for evidence retrieval. */
  topic: string;
  /** Verified, stable reference pages (used when live evidence is unavailable). */
  sources: CitationDraft[];
}

const MP = 'MedlinePlus (National Library of Medicine)';
const mp = (title: string, url: string): CitationDraft => ({ source: 'MedlinePlus', title, url, publisher: MP });
const nih = (title: string, url: string, publisher: string): CitationDraft => ({ source: 'NIH', title, url, publisher });

export const CATEGORY_INFO: Record<TriageCategory, CategoryInfo> = {
  suicide: {
    level: 'emergency',
    title: "You don't have to go through this alone",
    message:
      "If you're thinking about suicide or hurting yourself, call or text 988 (Suicide & Crisis Lifeline) now — it's free, confidential and open 24/7. If you're in immediate danger, call 911.",
    actions: [CALL_988, CHAT_988, CALL_911],
    steps: [
      "Call or text **988**, or chat at 988lifeline.org. A trained counselor will listen and help — you don't need to be in crisis \"enough\" to call.",
      'If you might act on these thoughts soon, call **911** or go to the nearest emergency room.',
      'Put distance between yourself and anything you could use to hurt yourself, and stay near someone you trust.',
      "Worried about someone else? Stay with them, ask them directly if they're thinking about suicide, and call 988 together.",
    ],
    signs: {
      heading: 'Warning signs to take seriously',
      items: [
        'Talking about wanting to die, being a burden, or having no reason to live',
        'Pulling away from friends, family and activities',
        'Giving away belongings or saying goodbye',
        'Big mood changes, or using more alcohol or drugs',
        'Looking for ways to hurt themselves',
      ],
    },
    infoTitle: 'Help is available 24/7 — call or text 988',
    also: "If you're having thoughts of hurting yourself, call or text 988 any time.",
    topic: 'suicide',
    sources: [
      mp('Suicide', 'https://medlineplus.gov/suicide.html'),
      nih('Suicide Prevention', 'https://www.nimh.nih.gov/health/topics/suicide-prevention', 'National Institute of Mental Health (NIMH)'),
    ],
  },
  battery: {
    level: 'emergency',
    title: 'Swallowed battery — go to the ER now',
    message:
      "A swallowed button or coin battery can badly burn the food pipe within hours, even if the person seems fine. Go to the nearest emergency room now — an X-ray is usually needed right away — and call Poison Help (1-800-222-1222) or the National Button Battery Ingestion Hotline (1-800-498-8666) on the way. Call 911 for trouble breathing, drooling, or trouble swallowing.",
    actions: [CALL_911, POISON_HELP, BATTERY_HOTLINE],
    steps: [
      'Go to the nearest **emergency room now**, even if there are no symptoms — a swallowed battery may cause none at first. Call **911** if they have trouble breathing, are drooling, or can’t swallow.',
      'On the way, call the **National Button Battery Ingestion Hotline at 1-800-498-8666** or **Poison Help at 1-800-222-1222**. Bring the battery package or a matching battery if you can.',
      "For a child **1 year or older** who can swallow, if it was swallowed in the last 12 hours: the National Capital Poison Center advises **2 teaspoons (10 mL) of honey every 10 minutes** (up to 6 doses) on the way to the ER. Don't delay leaving to do this, and never give honey to a baby under 1.",
      "Don't make them throw up, and don't give other food or drink until an X-ray shows where the battery is.",
    ],
    infoTitle: 'Swallowed battery: go to the ER',
    also: 'A swallowed button battery needs the ER right away.',
    topic: 'poisoning',
    sources: [
      mp('Button batteries', 'https://medlineplus.gov/ency/article/002764.htm'),
      mp('Poisoning', 'https://medlineplus.gov/poisoning.html'),
    ],
  },
  overdose: {
    level: 'emergency',
    title: 'Possible poisoning or overdose — get help now',
    message:
      "Call Poison Help at 1-800-222-1222 right away (free, 24/7). If the person is unconscious, having a seizure, having trouble breathing, or can't be woken, call 911 first.",
    actions: [CALL_911, POISON_HELP],
    steps: [
      "If the person is unconscious, having a seizure, or struggling to breathe, call **911** now.",
      'Otherwise call **Poison Help at 1-800-222-1222** — poison experts will tell you exactly what to do.',
      'Keep the bottle or package nearby so you can say what was taken, how much, and when.',
      "Don't try to make the person vomit unless Poison Help tells you to.",
      'For a suspected opioid overdose, give naloxone (Narcan) if you have it and call 911.',
    ],
    infoTitle: 'Poison Help: 1-800-222-1222',
    also: 'For a possible poisoning, Poison Help (1-800-222-1222) is free and open 24/7.',
    topic: 'poisoning',
    sources: [
      mp('Poisoning', 'https://medlineplus.gov/poisoning.html'),
      mp('Opioid Overdose', 'https://medlineplus.gov/opioidoverdose.html'),
    ],
  },
  stroke: {
    level: 'emergency',
    title: 'These can be signs of a stroke — call 911 now',
    message:
      'Face drooping, arm or leg weakness, slurred speech, sudden vision loss, loss of balance or a sudden severe headache can mean a stroke. Call 911 right away — every minute counts — and note the time the symptoms started.',
    actions: [CALL_911],
    steps: [
      "Call **911** now. Don't drive to the hospital — paramedics can start care on the way and alert the stroke team.",
      'Note the time the symptoms started (or when the person was last seen well). Doctors use this to decide on treatment.',
      "Stay with the person. Don't give food, drinks or medicine unless the 911 dispatcher tells you to.",
      "If they stop responding and aren't breathing normally, start CPR if you know how — the dispatcher can coach you.",
    ],
    // Mirrors MedlinePlus's F.A.S.T. test and symptom list (https://medlineplus.gov/stroke.html).
    signs: {
      heading: 'Stroke warning signs: think F.A.S.T.',
      items: [
        '**F — Face:** one side of the face droops when smiling',
        '**A — Arm:** one arm is weak — when both arms are raised, one drifts downward',
        '**S — Speech:** speech is slurred or strange',
        '**T — Time:** time to call 911 right away',
        'Other sudden signs: numbness or weakness of the face, arm or leg (especially on one side), confusion or trouble understanding speech, trouble seeing in one or both eyes, trouble walking or loss of balance, or a severe headache with no known cause',
      ],
    },
    infoTitle: 'Know the signs of a stroke: think F.A.S.T.',
    also: 'Sudden face drooping, arm weakness or trouble speaking means call 911.',
    topic: 'stroke',
    sources: [
      mp('Stroke', 'https://medlineplus.gov/stroke.html'),
      mp('Transient Ischemic Attack', 'https://medlineplus.gov/transientischemicattack.html'),
    ],
  },
  heart: {
    level: 'emergency',
    title: 'Chest pain can be a heart attack — call 911',
    message:
      "Chest pain, pressure or tightness — especially with shortness of breath, sweating, nausea, or pain spreading to the arm, jaw, neck or back — can be a heart attack. Call 911 now; don't drive yourself.",
    actions: [CALL_911],
    steps: [
      "Call **911** now — don't wait to see if it passes, and don't drive yourself.",
      'Sit down, rest, and loosen tight clothing.',
      'If you have chest pain medicine prescribed for a known heart condition (such as nitroglycerin), take it as directed. Only take aspirin if a doctor or the 911 dispatcher tells you to.',
      "If the person stops responding and isn't breathing normally, start CPR and use an AED if one is nearby.",
    ],
    // Mirrors MedlinePlus's symptom list (https://medlineplus.gov/heartattack.html).
    signs: {
      heading: 'Heart attack warning signs',
      items: [
        'Chest discomfort — pressure, squeezing, fullness or pain, often in the center or left side of the chest — that lasts more than a few minutes, or goes away and comes back',
        'Pain or discomfort in one or both arms, the back, shoulders, neck, jaw or upper stomach',
        'Shortness of breath, with or without chest discomfort',
        'Nausea, vomiting, dizziness or light-headedness, a racing or pounding heart, or a cold sweat',
        'Women sometimes have different symptoms than men — for example, they are more likely to feel tired for no reason',
      ],
    },
    infoTitle: 'Know the signs of a heart attack',
    also: 'Chest pain or pressure is a reason to call 911.',
    urgentTitle: 'Chest pain should be checked today',
    urgentMessage:
      'Chest pain that comes and goes, or shows up with activity, can be a sign of heart disease — contact your doctor today. Call 911 if chest pain lasts more than a few minutes, happens at rest, or comes with shortness of breath, sweating, nausea or light-headedness.',
    topic: 'heart attack',
    sources: [
      mp('Heart Attack', 'https://medlineplus.gov/heartattack.html'),
      mp('Heart attack first aid', 'https://medlineplus.gov/ency/article/000063.htm'),
      nih('Heart Attack — Symptoms', 'https://www.nhlbi.nih.gov/health/heart-attack/symptoms', 'National Heart, Lung, and Blood Institute (NHLBI)'),
    ],
  },
  breathing: {
    level: 'emergency',
    title: 'Severe trouble breathing — call 911',
    message:
      "Struggling to breathe, gasping, choking, being unable to speak in full sentences, or blue or gray lips are emergencies. Call 911 now.",
    actions: [CALL_911],
    steps: [
      'Call **911** now.',
      'If you have a rescue inhaler or an epinephrine auto-injector prescribed for this, use it as directed.',
      'Sit upright and loosen tight clothing. Stay with someone if you can.',
      'For choking: if the person can’t cough, speak or breathe, give abdominal thrusts (the Heimlich maneuver) if you are trained.',
    ],
    signs: {
      heading: 'Breathing emergency signs',
      items: [
        'Struggling to breathe or breathing very fast',
        "Can't speak in full sentences",
        'Blue or gray lips, face or fingertips',
        'Skin pulling in around the ribs or neck with each breath',
        'A rescue inhaler that isn’t helping',
      ],
    },
    infoTitle: 'When trouble breathing is an emergency',
    also: 'Severe trouble breathing means call 911.',
    topic: 'breathing problems',
    sources: [mp('Breathing Problems', 'https://medlineplus.gov/breathingproblems.html'), mp('Choking', 'https://medlineplus.gov/choking.html')],
  },
  anaphylaxis: {
    level: 'emergency',
    title: 'Possible severe allergic reaction — use epinephrine and call 911',
    message:
      'Swelling of the lips, tongue or throat, trouble breathing, or hives with dizziness can be anaphylaxis. Use an epinephrine auto-injector if you have one and call 911 — even if you start to feel better.',
    actions: [CALL_911],
    steps: [
      'Use an epinephrine auto-injector (such as EpiPen) right away if one has been prescribed.',
      'Call **911** — symptoms can come back even after they improve.',
      "Lie down with your legs raised unless it's hard to breathe (then sit up). Don't stand up suddenly.",
      'Swelling of the face, lips or tongue while taking an ACE inhibitor such as lisinopril (angioedema) is also an emergency.',
    ],
    signs: {
      heading: 'Signs of a severe allergic reaction',
      items: [
        'Swelling of the lips, tongue, throat or face',
        'Trouble breathing, wheezing or a tight throat',
        'Hives or widespread itching with dizziness or fainting',
        'Vomiting or belly cramps after a food, sting or medicine',
      ],
    },
    infoTitle: 'Know the signs of anaphylaxis',
    also: 'Throat or tongue swelling means use epinephrine (if prescribed) and call 911.',
    topic: 'anaphylaxis',
    sources: [mp('Anaphylaxis', 'https://medlineplus.gov/anaphylaxis.html')],
  },
  unconscious: {
    level: 'emergency',
    title: 'Unresponsive person — call 911 now',
    message: "If someone won't wake up, isn't responding, or isn't breathing normally, call 911 right away.",
    actions: [CALL_911],
    steps: [
      'Call **911** (or have someone call) and put the phone on speaker.',
      "Check for breathing. If they're not breathing normally, start CPR — push hard and fast in the center of the chest; the dispatcher can guide you.",
      "If they are breathing, roll them onto their side and stay with them until help arrives.",
      'Use an AED if one is available.',
    ],
    infoTitle: 'What to do if someone is unresponsive',
    also: "Someone who won't wake up needs 911.",
    topic: 'unconsciousness first aid',
    sources: [mp('Unconsciousness - first aid', 'https://medlineplus.gov/ency/article/000022.htm')],
  },
  seizure: {
    level: 'emergency',
    title: 'Seizure — keep them safe and call 911 if needed',
    message:
      "Call 911 if a seizure lasts longer than 5 minutes, another one follows, it's the person's first seizure, they're hurt, pregnant or have diabetes, or they don't wake up or breathe normally afterward.",
    actions: [CALL_911],
    steps: [
      'Stay calm and time the seizure.',
      'Ease the person to the floor, turn them onto their side, and cushion their head.',
      "Move hard or sharp objects away. Don't hold them down and don't put anything in their mouth.",
      "Call **911** if it lasts more than 5 minutes, they don't wake up, have trouble breathing, or it's their first seizure.",
    ],
    infoTitle: 'Seizure first aid',
    also: 'A seizure lasting more than 5 minutes needs 911.',
    topic: 'seizures',
    sources: [mp('Seizures', 'https://medlineplus.gov/seizures.html')],
  },
  bleeding: {
    level: 'emergency',
    title: 'Severe bleeding — call 911',
    message:
      "Bleeding that won't stop, spurting blood, or vomiting or coughing up blood needs emergency care. Call 911.",
    actions: [CALL_911],
    steps: [
      'Call **911**.',
      'If the blood is coming from a wound, press firmly on it with a clean cloth or bandage and keep pressing. If blood soaks through, add more cloth on top — don’t remove the first layer.',
      'If an arm or leg is injured, raise it above the level of the heart if you can.',
      "If someone is vomiting or coughing up blood, don't give food or drink; keep them sitting up or on their side.",
    ],
    infoTitle: 'How to handle serious bleeding',
    also: "Bleeding that won't stop needs 911.",
    topic: 'bleeding',
    sources: [mp('Bleeding', 'https://medlineplus.gov/bleeding.html')],
  },
  'head-injury': {
    level: 'emergency',
    title: 'Head injury with warning signs — get emergency care',
    message:
      'After a blow to the head, vomiting, confusion, passing out, a seizure, a worsening headache, unusual sleepiness, or trouble walking or talking need emergency care. Call 911 or go to the ER now.',
    actions: [CALL_911],
    steps: [
      'Call **911** if the person passed out, is confused or very sleepy, keeps vomiting, has a seizure, or has fluid or blood coming from the nose or ears.',
      "If a neck injury is possible, don't move their head or neck.",
      "Don't let them drive; someone should stay with them.",
      'People who take blood thinners should be checked after any significant head injury.',
    ],
    infoTitle: 'Head injury warning signs',
    also: 'A head injury with vomiting or confusion needs the ER.',
    urgentTitle: 'Watch closely after a head injury',
    urgentMessage:
      'Watch closely for the next day or two, and get checked today if you take a blood thinner, are 65 or older, or the hit was hard. Go to the ER or call 911 for vomiting, confusion, a worsening headache, unusual sleepiness, a seizure, weakness, or trouble walking or talking.',
    topic: 'head injuries',
    sources: [mp('Head Injuries', 'https://medlineplus.gov/headinjuries.html'), mp('Concussion', 'https://medlineplus.gov/concussion.html')],
  },
  pregnancy: {
    level: 'emergency',
    title: 'Pregnancy warning signs — get care now',
    message:
      'During pregnancy, heavy bleeding, severe belly pain, fluid leaking, a severe headache or vision changes, a seizure, trouble breathing, or the baby moving much less than usual need care right away. Call 911 for severe symptoms, or call your OB or labor & delivery unit now.',
    actions: [CALL_911],
    steps: [
      'Call **911** for heavy bleeding, a seizure, severe pain, fainting or trouble breathing.',
      'For other warning signs, call your OB or the labor & delivery unit right now — they are available 24/7.',
      "Don't wait for your next appointment to mention these symptoms.",
    ],
    infoTitle: 'Pregnancy warning signs',
    also: 'Heavy bleeding or severe pain in pregnancy needs care now.',
    topic: 'health problems in pregnancy',
    sources: [mp('Health Problems in Pregnancy', 'https://medlineplus.gov/healthproblemsinpregnancy.html')],
  },
  meningitis: {
    level: 'emergency',
    title: 'Fever with a stiff neck — get emergency care',
    message:
      "A fever with a stiff neck, severe headache, confusion, or a rash that doesn't fade when pressed can be meningitis, which needs treatment right away. Call 911 or go to the nearest ER now.",
    actions: [CALL_911],
    steps: ['Call **911** or go to the nearest emergency room now.', "Tell them about the fever, the neck stiffness and when it started."],
    infoTitle: 'Warning signs of meningitis',
    also: 'Fever with a stiff neck needs emergency care.',
    topic: 'meningitis',
    sources: [mp('Meningitis', 'https://medlineplus.gov/meningitis.html')],
  },
  sepsis: {
    level: 'emergency',
    title: 'Possible sepsis — get emergency care',
    message:
      'An infection with confusion, very fast breathing, a racing heart, clammy or blotchy skin, severe pain, or feeling extremely ill can be sepsis. Call 911 or go to the ER now and tell them about the infection.',
    actions: [CALL_911],
    steps: ['Call **911** or go to the emergency room now.', 'Tell the team about the infection and ask, "Could this infection be leading to sepsis?"'],
    infoTitle: 'Warning signs of sepsis',
    also: 'An infection with confusion or a racing heart can be sepsis — go to the ER.',
    topic: 'sepsis',
    sources: [mp('Sepsis', 'https://medlineplus.gov/sepsis.html')],
  },
  'bp-crisis': {
    citeLead: false,
    questions: ['What should I do if my home readings stay high?', 'Does my blood pressure treatment need to change?', 'How can I make sure my home blood pressure readings are accurate?'],
    level: 'urgent',
    title: 'Very high blood pressure reading',
    message:
      'A reading of 180/120 or higher is dangerously high. Rest for a few minutes and check again; if it is still that high, contact your doctor right away. Call 911 if you also have chest pain, shortness of breath, back pain, numbness or weakness, vision changes, or trouble speaking.',
    actions: [CALL_911, FIND_URGENT_CARE],
    steps: [
      'Sit quietly for a few minutes, then recheck your blood pressure.',
      'If it is still 180/120 or higher, contact your doctor right away or go to urgent care.',
      'Call **911** if you have chest pain, shortness of breath, back pain, numbness or weakness, vision changes, trouble speaking, or a severe headache.',
      "Don't take extra doses of your blood pressure medicine unless your doctor has told you to.",
    ],
    infoTitle: 'Understanding blood pressure readings',
    also: 'A blood pressure of 180/120 or higher needs prompt attention.',
    topic: 'high blood pressure',
    sources: [mp('High Blood Pressure', 'https://medlineplus.gov/highbloodpressure.html')],
  },
  'low-sugar': {
    citeLead: false,
    questions: ['Why did my blood sugar drop, and do my diabetes medicines need adjusting?', 'What is my plan for treating a low at home?'],
    level: 'urgent',
    title: 'Low blood sugar — treat it now',
    message:
      "Follow your diabetes plan for low blood sugar right away (usually fast-acting sugar such as juice or glucose tablets), then recheck. Call 911 if the person is confused, can't swallow safely, has a seizure, or passes out.",
    actions: [CALL_911],
    steps: [
      'Follow your care plan: eat or drink fast-acting sugar (such as juice, regular soda or glucose tablets), then recheck in about 15 minutes.',
      "Call **911** if the person is confused, can't swallow safely, has a seizure, or passes out.",
      'Tell your doctor about any low readings — your medicines may need adjusting.',
    ],
    infoTitle: 'Know the signs of low blood sugar',
    also: 'Low blood sugar with confusion needs 911.',
    topic: 'hypoglycemia',
    sources: [mp('Hypoglycemia', 'https://medlineplus.gov/hypoglycemia.html')],
  },
  'high-sugar': {
    citeLead: false,
    questions: ['What should I do when my blood sugar is this high?', 'Do my diabetes medicines need adjusting?'],
    level: 'urgent',
    title: 'Very high blood sugar — contact your doctor today',
    message:
      'Blood sugar that stays very high needs attention today. Get emergency care if you also have vomiting, belly pain, trouble breathing, a fruity smell on your breath, or confusion.',
    actions: [FIND_URGENT_CARE, CALL_911],
    steps: [
      'Follow your diabetes care plan and recheck.',
      'Contact your doctor today if readings stay high.',
      'Go to the ER or call **911** if you have vomiting, belly pain, trouble breathing, fruity-smelling breath or confusion.',
    ],
    infoTitle: 'High blood sugar',
    also: 'Very high blood sugar with vomiting or confusion needs emergency care.',
    topic: 'hyperglycemia',
    sources: [mp('Hyperglycemia', 'https://medlineplus.gov/hyperglycemia.html')],
  },
  'extra-dose': {
    citeLead: false,
    questions: ['How can I avoid mixing up doses (pill organizer, reminders)?', 'Is there anything I should watch for after this extra dose?'],
    level: 'urgent',
    title: 'Took an extra dose? Call Poison Help',
    message:
      "Call Poison Help at 1-800-222-1222 (free, 24/7) or your pharmacist to ask what to do. If you feel very unwell, faint, or have trouble breathing, call 911.",
    actions: [POISON_HELP, CALL_911],
    steps: [
      'Call **Poison Help at 1-800-222-1222** or your pharmacist and have the bottle in hand.',
      "Don't take your next dose until you've gotten advice.",
      'Call **911** if you feel faint, very dizzy, confused, or have trouble breathing.',
    ],
    infoTitle: 'What to do after a medication mistake',
    also: 'After a medicine mix-up, Poison Help (1-800-222-1222) can advise you.',
    topic: 'medication errors',
    sources: [mp('Medication Errors', 'https://medlineplus.gov/medicationerrors.html'), mp('Poisoning', 'https://medlineplus.gov/poisoning.html')],
  },
  fainting: {
    questions: ['What might have caused me to faint, and do I need any tests?', 'Could any of my medicines be making me dizzy or faint?'],
    level: 'urgent',
    title: 'Fainting should be checked',
    message:
      "If you fainted, contact your doctor today or get checked at urgent care. Call 911 if fainting came with chest pain, a racing or irregular heartbeat, trouble breathing, confusion, weakness on one side, or if the person doesn't wake up within a minute or two.",
    actions: [FIND_URGENT_CARE, CALL_911],
    steps: [
      'Lie down with your legs raised until you feel better; get up slowly.',
      'Contact your doctor today or go to urgent care to find out why it happened.',
      'Call **911** for chest pain, a racing heartbeat, trouble breathing, confusion, or weakness on one side.',
    ],
    infoTitle: 'Fainting: when to get help',
    also: 'Fainting should be checked by a clinician.',
    topic: 'fainting',
    sources: [mp('Fainting', 'https://medlineplus.gov/fainting.html')],
  },
  'breathing-mild': {
    questions: ['What could be causing my shortness of breath?', 'Do I need any tests, such as a chest X-ray or breathing tests?'],
    level: 'urgent',
    title: 'Shortness of breath should be checked soon',
    message:
      "New or worsening shortness of breath should be checked today by your doctor or urgent care. Call 911 if it's severe, comes on suddenly, or comes with chest pain, fainting, or blue or gray lips.",
    actions: [FIND_URGENT_CARE, CALL_911],
    steps: [
      'Rest and sit upright. Use your rescue inhaler if one is prescribed for this.',
      'Contact your doctor today or go to urgent care.',
      "Call **911** if it becomes severe, you can't speak in full sentences, or you have chest pain.",
    ],
    infoTitle: 'Shortness of breath: when to get help',
    also: 'Worsening shortness of breath should be checked today.',
    topic: 'breathing problems',
    sources: [mp('Breathing Problems', 'https://medlineplus.gov/breathingproblems.html')],
  },
  'high-fever': {
    questions: ['What could be causing this fever, and do I need to be seen?', 'Which fever reducer is safe with my other medicines?'],
    level: 'urgent',
    title: 'High fever — get checked soon',
    message:
      'Contact your doctor today or visit urgent care for a fever that stays at or above 103°F (39.4°C) or lasts longer than 2–3 days. Get emergency care for a fever with a stiff neck, confusion, trouble breathing, a seizure, or a rash.',
    actions: [FIND_URGENT_CARE, CALL_911],
    steps: [
      'Drink plenty of fluids and rest.',
      'Contact your doctor today or go to urgent care if the fever stays at or above 103°F (39.4°C) or lasts more than 2–3 days.',
      'Get emergency care for a stiff neck, confusion, trouble breathing, a seizure, or a rash.',
    ],
    infoTitle: 'Fever: when to call the doctor',
    also: 'A fever that stays at or above 103°F (39.4°C) should be checked.',
    topic: 'fever',
    sources: [mp('Fever', 'https://medlineplus.gov/fever.html'), mp('Fever (Medical Encyclopedia)', 'https://medlineplus.gov/ency/article/003090.htm')],
  },
  'infant-fever': {
    questions: ['Does my baby need to be seen today?', 'How should I take my baby’s temperature accurately?'],
    level: 'urgent',
    title: 'Fever in a young baby — call the doctor now',
    message:
      "For a baby 3 months or younger, any fever (100.4°F / 38°C or higher, taken rectally) needs a call to the baby's doctor right away, even at night. Call 911 if the baby is hard to wake, has trouble breathing, or has a seizure.",
    actions: [CALL_911],
    steps: [
      "Call your baby's doctor or the after-hours line now.",
      "Don't give fever medicine to a baby 3 months or younger unless the doctor tells you to.",
      'Call **911** if the baby is hard to wake, limp, has trouble breathing, or has a seizure.',
    ],
    infoTitle: 'Fever in babies',
    also: 'Any fever in a baby 3 months or younger needs a call to the doctor.',
    topic: 'fever',
    sources: [mp('Fever (Medical Encyclopedia)', 'https://medlineplus.gov/ency/article/003090.htm')],
  },
  dehydration: {
    questions: ['How much should I drink, and what should I drink?', 'Should I hold any of my medicines while I’m sick?'],
    level: 'urgent',
    title: 'Signs of dehydration — act soon',
    message:
      "If you can't keep fluids down, are peeing very little, feel very dizzy, or have had vomiting or diarrhea for more than a day or two, contact your doctor today or go to urgent care. Confusion, fainting or a racing heart need emergency care.",
    actions: [FIND_URGENT_CARE, CALL_911],
    steps: [
      'Take small, frequent sips of water or an oral rehydration drink.',
      "Contact your doctor today or go to urgent care if you can't keep fluids down or are peeing very little.",
      'Get emergency care for confusion, fainting or a racing heart.',
    ],
    infoTitle: 'Signs of dehydration',
    also: "If you can't keep fluids down, get checked today.",
    topic: 'dehydration',
    sources: [mp('Dehydration', 'https://medlineplus.gov/dehydration.html')],
  },
  infection: {
    questions: ['Does this wound need antibiotics?', 'What signs mean the infection is spreading?'],
    level: 'urgent',
    title: "An infection that's getting worse needs care soon",
    message:
      'Spreading redness, red streaks, pus, warmth, increasing pain, or a fever with a wound or skin infection should be checked today by your doctor or urgent care.',
    actions: [FIND_URGENT_CARE],
    steps: [
      'Contact your doctor today or go to urgent care.',
      'You can draw a line around the edge of the redness with a pen to see if it spreads.',
      'Get emergency care if you develop a high fever, confusion, or feel very ill.',
    ],
    infoTitle: 'Signs a wound may be infected',
    also: 'Spreading redness around a wound should be checked today.',
    topic: 'skin infections',
    sources: [mp('Skin Infections', 'https://medlineplus.gov/skininfections.html')],
  },
  'gi-bleed': {
    questions: ['What could be causing the bleeding, and do I need tests?', 'Could any of my medicines be contributing?'],
    level: 'urgent',
    title: 'Blood in your stool should be checked promptly',
    message:
      'Black, tarry stools or blood in your stool should be checked by a clinician today. Call 911 if you feel faint or dizzy, are vomiting blood, or are passing a lot of blood.',
    actions: [FIND_URGENT_CARE, CALL_911],
    steps: [
      'Contact your doctor today or go to urgent care.',
      'Call **911** if you feel faint, are vomiting blood, or are passing a lot of blood.',
      'Mention any blood thinners, aspirin or NSAIDs (like ibuprofen) you take.',
    ],
    infoTitle: 'Blood in the stool',
    also: 'Black or bloody stools should be checked today.',
    topic: 'gastrointestinal bleeding',
    sources: [mp('Gastrointestinal Bleeding', 'https://medlineplus.gov/gastrointestinalbleeding.html')],
  },
  wound: {
    questions: ['Do I need a tetanus shot?', 'How should I care for the wound while it heals?'],
    level: 'urgent',
    title: 'A deep cut may need stitches',
    message:
      "Deep or gaping cuts often need stitches, ideally within a few hours. Press firmly to stop the bleeding and get to urgent care. Call 911 if bleeding won't stop.",
    actions: [FIND_URGENT_CARE, CALL_911],
    steps: [
      'Press firmly with a clean cloth for several minutes without peeking.',
      'Go to urgent care for deep, gaping or dirty cuts, or cuts on the face or joints.',
      "Call **911** if the bleeding won't stop.",
    ],
    infoTitle: 'Caring for cuts',
    also: 'Deep cuts may need stitches.',
    topic: 'wounds and injuries',
    sources: [mp('Cuts and puncture wounds', 'https://medlineplus.gov/ency/article/000043.htm')],
  },
  'severe-pain': {
    questions: ['What could be causing this pain?', 'Which tests do I need?'],
    level: 'urgent',
    title: 'Severe pain should be checked today',
    message:
      "Sudden, severe belly or pelvic pain — especially with fever, vomiting, a hard belly, or after an injury — needs prompt care. Go to urgent care or the ER; call 911 if it's unbearable or you feel faint.",
    actions: [FIND_URGENT_CARE, CALL_911],
    steps: [
      'Go to urgent care or the emergency room today.',
      "Call **911** if the pain is unbearable, you feel faint, or you're vomiting blood.",
      "Avoid eating until you've been checked, in case you need a procedure.",
    ],
    infoTitle: 'Belly pain: when to get help',
    also: 'Severe belly pain should be checked today.',
    topic: 'abdominal pain',
    sources: [mp('Abdominal Pain', 'https://medlineplus.gov/abdominalpain.html')],
  },
};

// ── Text normalization & clause handling ─────────────────────────────────────

/**
 * Clinician shorthand that patients type ("CP and SOB", "my friend ODd"), expanded while
 * letter case still tells "SOB" / "OD" apart from ordinary words. A bare "OD" is left alone
 * (it also means "right eye" on eye-drop directions).
 */
function expandShorthand(message: string): string {
  return message
    .replace(/\bCP\b/g, 'chest pain')
    .replace(/\bSOB\b/g, 'shortness of breath')
    .replace(/\bDOE\b/g, 'shortness of breath with activity')
    .replace(/\bOD(?:'?e?d)\b/g, 'overdosed')
    .replace(/\bOD'?ing\b/g, 'overdosing')
    .replace(/\b(an|the|to) OD\b|\bOD (?=on\b)/g, (match) => match.replace('OD', 'overdose'));
}

export function normalizeForTriage(text: string): string {
  return ` ${text} `
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\bcan not\b/g, 'cannot')
    .replace(/\bcant\b/g, "can't")
    .replace(/\bdont\b/g, "don't")
    .replace(/\bdoesnt\b/g, "doesn't")
    .replace(/\bdidnt\b/g, "didn't")
    .replace(/\bwont\b/g, "won't")
    .replace(/\bisnt\b/g, "isn't")
    .replace(/\bwasnt\b/g, "wasn't")
    .replace(/\bhavent\b/g, "haven't")
    .replace(/\bhasnt\b/g, "hasn't")
    .replace(/\bim\b/g, "i'm")
    .replace(/\bive\b/g, "i've")
    .replace(/\bhes\b/g, "he's")
    .replace(/\bshes\b/g, "she's")
    .replace(/\bits\b/g, "it's")
    .replace(/\s+/g, ' ');
}

interface Clause {
  text: string;
  /** The whole clause continues a negated list: "denies chest pain, shortness of breath". */
  negatedList: boolean;
}

/** Sentence punctuation, commas, and contrastive conjunctions start a new clause. */
const CLAUSE_BREAK = /[.!?;\n]+|,|\b(?:but|however|although|though|except|yet|whereas)\b/g;
/** A clause that opens a negated list ("no fever", "pt denies chest pain"). */
const LIST_LEAD = /^(?:(?:pt|patient) )?(?:no|denies|denied|negative for|without|free of)\b/;
const VERBISH = /\b(is|are|was|were|am|has|have|had|feel\w*|hurt\w*|keeps?|started|getting|got|'s|'m|'re)\b/;

function splitClauses(text: string): Clause[] {
  const out: Clause[] = [];
  let start = 0;
  let afterComma = false;
  const push = (end: number) => {
    const piece = text.slice(start, end).trim();
    if (!piece) return;
    const prev = out[out.length - 1];
    const prevOpensList = prev ? LIST_LEAD.test(prev.text) || prev.negatedList : false;
    const bareNounPhrase = piece.split(/\s+/).length <= 4 && !VERBISH.test(piece) && !PERSONAL_SUBJECT.test(piece);
    out.push({ text: piece, negatedList: afterComma && prevOpensList && bareNounPhrase });
  };
  for (const m of text.matchAll(CLAUSE_BREAK)) {
    push(m.index);
    afterComma = m[0] === ',';
    start = m.index + m[0].length;
  }
  push(text.length);
  return out;
}

const NEGATION = /\b(no|not|never|without|denies|denied|deny|none|nor|isn't|aren't|wasn't|weren't|don't|doesn't|didn't|haven't|hasn't|hadn't|no longer|free of|negative for)\b/g;
const HEDGE_AFTER_NEGATION = /^\s*(know|think|sure|understand|want to wait|care|remember|believe)\b/;

const LIST_NEGATION =
  /\b(no|not|without|denies|denied|don't have|doesn't have|haven't had|hasn't had|never had|free of)\b(?:\s+[\w'-]+){0,6}\s+(or|nor)\s+(?:[\w'-]+\s+){0,2}$/;

/** True when a negation word appears within the 4 words before `index` in the clause. */
function isNegated(clause: string, index: number): boolean {
  const before = clause.slice(0, index);
  // "no chest pain or shortness of breath": the negation carries across an or-list.
  if (LIST_NEGATION.test(before)) return true;
  const words = before.trim().split(/\s+/);
  const windowText = words.slice(-4).join(' ');
  const windowStart = before.length - windowText.length - (before.endsWith(' ') ? 1 : 0);
  NEGATION.lastIndex = 0;
  for (let m = NEGATION.exec(windowText); m; m = NEGATION.exec(windowText)) {
    const after = clause.slice(Math.max(0, windowStart) + m.index + m[0].length);
    if (!HEDGE_AFTER_NEGATION.test(after)) return true;
  }
  return false;
}

/** True when the phrase at `index` of raw `text` is negated in its clause ("No chest pain today"). */
export function isNegatedInText(text: string, index: number): boolean {
  const lower = text.toLowerCase().replace(/[’‘`´]/g, "'");
  let start = 0;
  for (const m of lower.slice(0, index).matchAll(CLAUSE_BREAK)) start = m.index + m[0].length;
  return isNegated(lower.slice(start), index - start);
}

interface Hit {
  category: TriageCategory;
  /** The matched text. */
  match: string;
  clause: string;
  /** Position of the clause in the message (-1 for message-level readings). */
  clauseIndex: number;
  index: number;
  /** A first-person statement of self-harm intent: question framing never softens it. */
  strong?: boolean;
}

type Accept = (clause: string, match: RegExpExecArray) => boolean;

/** Every non-negated match of any pattern, clause by clause. */
function findHits(clauses: Clause[], patterns: RegExp[], category: TriageCategory, accept?: Accept): Hit[] {
  const hits: Hit[] = [];
  clauses.forEach((clause, clauseIndex) => {
    if (clause.negatedList) return;
    for (const pattern of patterns) {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      for (let m = re.exec(clause.text); m; m = re.exec(clause.text)) {
        if (m[0].length === 0) re.lastIndex++;
        if (isNegated(clause.text, m.index) || (accept && !accept(clause.text, m))) continue;
        hits.push({ category, match: m[0], clause: clause.text, clauseIndex, index: m.index });
      }
    }
  });
  return hits;
}

function hasAny(clauses: Clause[], patterns: RegExp[]): boolean {
  return findHits(clauses, patterns, 'stroke').length > 0;
}

/** A message-level reading (BP, temperature, glucose) anchored to the clause that mentions it. */
function readingHit(clauses: Clause[], category: TriageCategory, anchor: RegExp): Hit {
  for (const [clauseIndex, clause] of clauses.entries()) {
    const m = anchor.exec(clause.text);
    if (m) return { category, match: m[0], clause: clause.text, clauseIndex, index: m.index };
  }
  return { category, match: '', clause: clauses[0]?.text ?? '', clauseIndex: 0, index: 0 };
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Patterns ─────────────────────────────────────────────────────────────────

const PILL_WORDS =
  "pills?|tablets?|tabs|caps|capsules?|gummies|vitamins|meds|medicines?|medications?|painkillers?|sleeping pills|sleep aids?|doses";
/** Every known medicine name, brand and alias (longest first), for "took 20 Tylenol". */
const DRUG_NAMES = [...new Set(DRUGS.flatMap((d) => [d.name, ...d.brands, ...(d.aliases ?? [])]).map((n) => n.toLowerCase()))]
  .filter((n) => n.length >= 4)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join('|');
const COUNT_WORDS: Record<string, number> = {
  three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, 'a dozen': 12, 'a couple dozen': 24, dozens: 24,
  'a hundred': 100, hundreds: 200,
};
const NOT_A_PILL_COUNT =
  'mg|mcg|milligrams?|micrograms?|g|grams?|ml|milliliters?|cc|units?|iu|%|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|yrs?|am|pm|times?|x|puffs?|drops?';
/** "took 20 Tylenol", "my son swallowed 15 of my ibuprofen", "she took 40 of her Xanax". */
const COUNT_TAKEN = new RegExp(
  `\\b(?:took|taken|swallowed|ate|eaten|popped|downed|chewed|gave (?:him|her|them))\\s+` +
    `(?:like |about |around |maybe |over |almost |nearly |at least |more than |probably )?` +
    `(\\d{1,3}|${Object.keys(COUNT_WORDS).join('|')})(?!\\s*(?:${NOT_A_PILL_COUNT})\\b)\\s+` +
    `(?:of\\s+)?(?:(?:my|his|her|their|the|our|these|those|[a-z]+'s)\\s+)?` +
    `(?:(?!different\\b|kinds?\\b|types?\\b|brands?\\b|sorts?\\b)[\\w'-]+\\s+){0,2}?` +
    `(?:${PILL_WORDS}|${DRUG_NAMES})\\b`,
  'g',
);
const CHILD_SUBJECT =
  /\b(son|daughter|toddler|baby|infant|kid|kids|child|children|grandson|granddaughter|\d+[- ](?:year|yr|month)s?[- ]old|\d+ ?(?:y\/?o|yo))\b/;
const BATTERY = /\bbatter(?:y|ies)\b|\b(?:button|coin) cells?\b/;
/** "took all my morning pills" is a routine, not an overdose. */
const ROUTINE_DOSE =
  /^took all (?:of )?(?:my |the |his |her )?(?:morning|evening|night|nighttime|bedtime|daily|usual|regular|today's|scheduled|prescribed)\b|\b(this morning|today|on time|as (prescribed|directed)|at (breakfast|lunch|dinner|bedtime)|with (breakfast|dinner|food|meals)|like (i'm|i am) supposed to)\b/;
const USUAL_SCHEDULE = /\btwice (a|per|each|every) (day|week)\b|\b(two|2) (times|doses) (a|per|each) day\b/;

const P = {
  /** First-person / intent statements: framing as a question never softens these. */
  suicideSelf: [
    /\b(kill|killing|hurt|hurting|harm|harming|end|shoot|shooting|hang|hanging|stab|stabbing|drown|drowning|poison|poisoning|starve|starving) (my|him|her|them)sel(f|ves)\b/,
    /\b(cut|cutting) (my|him|her|them)sel(f|ves)\b(?! (shaving|cooking|chopping|slicing|on |while|by accident|accidentally|in the kitchen|at work))/,
    /\b(end|ending|take|taking) (my|his|her|their) (own )?life\b/,
    /\bend it all\b/,
    /\b(want|wanna|wanted|wish|going|ready|plan|planning) (to )?die\b/,
    /\bwish (i|he|she) (was|were) dead\b/,
    /\bbetter off (dead|without me)\b/,
    /\bno (reason|point) (to|in) (live|living|going on)\b/,
    /\b(life|living) (is|isn't|is not) (not )?worth (it|living)\b/,
    /\bdon't want to (live|be alive|be here anymore|wake up)\b/,
    /\bon purpose\b.*\b(overdose|pills)\b|\b(overdose|pills)\b.*\bon purpose\b/,
    /\b(going|gonna|planning|plan|want|wanna|ready|about) to (take|swallow) (all|every one|the rest) (of )?(my|the|his|her|these|those)( \w+)? (pills|meds|medicines?|medications?|tablets|capsules)\b(?! (at the same time|together|in the morning|with (food|breakfast|dinner|meals|water)|at (breakfast|lunch|dinner|bedtime)))/,
    /\b(saving|stockpiling|hoarding|collecting|stashing) (up )?(all )?(of )?(my |the |his |her )?(sleeping )?(pills|meds|medicines?|medications?|tablets)\b/,
    /\bending (it|things|everything|it all)\b(?! with\b)/,
    /\bend (things|everything)\b(?! with\b)/,
    /\b(want|wanna|wish|hope|hoping|pray|praying)\b[^.]{0,30}\bnever wake up\b/,
    /\b(gun|firearm|pistol|rifle|rope|noose|knife|blade|razor)\b[^.]{0,50}\b(on|against|to) (myself|my head)\b/,
    /\b(going|gonna|planning|plan|want|wanna|intend|intending|thinking (about|of)|decided|ready) (to |on )?(overdose|overdosing|od|od'?ing)\b/,
  ],
  suicideWord: [/\bsuicid\w*/, /\bself[- ]?harm\w*/],
  suicideMention: [/\bsuicid\w*/, /\bself[- ]?harm/, /\b988\b/, /\bcrisis line\b/],

  overdose: [
    /\boverdos\w*/,
    /\bod'e?d\b|\boded\b|\bod'ing\b/,
    /\btook (all|a (whole|full) (bottle|pack|box)|too many|way too many|a bunch|a handful|handfuls)\b/,
    /\b(swallowed|drank|drunk|ate|eaten|ingested|licked|chewed|got into)\b[^.]{0,30}\b(bleach|poison|detergent|laundry (pod|packet)s?|tide pods?|batter(y|ies)|button battery|coin cells?|antifreeze|cleaner|chemicals?|rat poison|mushrooms?|lighter fluid|gasoline|pesticide|weed killer|vape (juice|liquid)|e-liquid|nicotine|someone else's (pills|medicine)|a whole bottle)\b/,
    /\bgot into\b[^.]{0,40}\b(pills|meds|medicines?|medications?|tablets|vitamins|gummies)\b/,
    /\b(swallowed|ate|eaten|chewed|took)\b[^.]{0,20}\b(a (bottle|handful|bunch|lot|ton|pile) of|all (of )?(my|his|her|the|their|the rest of)|someone else's|(grandma|grandpa|mom|dad|nana|papa|grandmother|grandfather)'s)\b[^.]{0,20}\b(pills|meds|medicines?|medications?|tablets|capsules|vitamins|gummies)\b/,
    /\bpoison(ed|ing)\b/,
    /\bcarbon monoxide\b/,
    /\b(gave|give|used|use|need|needed) (him |her |them )?(narcan|naloxone)\b/,
  ],
  overdoseMention: [/\boverdose\b/, /\bpoison\w*/, /\bnarcan\b|\bnaloxone\b/],
  extraDose: [
    /\b(took|taken|accidentally took|i've taken)\b[^.]{0,30}\b(double dose|extra (doses?|pills?|tablets?|capsules?)|two doses|2 doses|twice|second dose|dose twice)\b/,
    /\b(double|doubled) (up )?(my|the|on my) (dose|pills?|medicine|meds)\b/,
    /\baccidentally (took|taken|swallowed|gave|double[- ]?dosed)\b/,
    /\btook (my|his|her) \w+ (twice|two times)\b/,
    /\b(took|taken|gave|given|swallowed)\b[^.]{0,25}\bwrong (pills?|medicines?|medications?|dose|meds)\b/,
    /\bdouble[- ]?dos(e|ed|es)\b[^.]{0,40}\bby (accident|mistake)\b/,
    /\bby (accident|mistake)\b[^.]{0,40}\bdouble[- ]?dos(e|ed)\b/,
    /\b(took|taken|swallowed|gave (him|her|them))\b[^.]{0,40}\bby (accident|mistake)\b/,
    /\bdouble[- ]dosed\b/,
  ],

  stroke: [
    /\b(face|smile|mouth|lip)s?\b[^.]{0,30}\b(droop\w*|lopsided|crooked|uneven|sagging|paralyz\w*)/,
    /\b(droop\w*|sagging)\b[^.]{0,20}\b(face|facial|mouth|smile)\b/,
    /\bfacial (droop|weakness|numbness|paralysis)\b/,
    /\bone side of (my|his|her|their|the) (face|body)\b[^.]{0,30}\b(droop\w*|numb|weak|paralyz\w*|dead|won't move)/,
    /\b(can't|cannot|unable to|couldn't|trouble|hard to|won't) (lift|raise|move|use) (my|his|her|their|one|an|the|either)? ?(left |right )?(arm|leg|hand)\b/,
    /\b(sudden(ly)?|all of a sudden)\b[^.]{0,30}\b(weak|weakness|numb|numbness|paralyz\w*|can't move)\b/,
    /\b(weak|weakness|numb|numbness|paralyz\w*)\b[^.]{0,25}\b(on )?(one|the (left|right)|his (left|right)|her (left|right)|my (left|right)) side\b/,
    /\b(left|right|one) side\b[^.]{0,25}\b(weak|numb|limp|paralyz\w*|droop\w*)/,
    /\b(arm|leg) (is |went |has gone |feels |just went )?(limp|dead|paralyzed)\b/,
    /\bslurr\w*/,
    /\b(speech|talking|words)\b[^.]{0,20}\b(slurred|garbled|jumbled|strange|weird|confused|gibberish)\b/,
    /\b(can't|cannot|unable to|trouble|difficulty|hard time|struggling to) (speak|speaking|talk|talking|get (the |his |her |my )?words out|find (the |his |her |my )?words)\b/,
    /\b(sudden(ly)?|all of a sudden)\b[^.]{0,30}\b(blind|vision|can't see|trouble seeing|double vision)\b/,
    /\b(lost|losing|loss of) (vision|sight|my vision|his vision|her vision)\b/,
    /\bcan't see out of (one|my|his|her) (left |right )?eye\b/,
    /\bworst headache\b/,
    /\bthunderclap headache\b/,
    /\bsudden(ly)?,? (a )?(severe|terrible|excruciating|explosive|horrible) headache\b/,
    /\bhaving a (stroke|mini[- ]?stroke|tia)\b/,
    /\b(it's|is it|might be|could be|think it's|think i'm having|think he's having|think she's having) a stroke\b/,
    /\b(showing|having|getting|has|had) (the )?(signs?|symptoms?) of (a )?(stroke|mini[- ]?stroke|tia)\b/,
    /\b(stroke|tia) (symptoms|signs)\b[^.]{0,25}\b(in|on|from) (my|his|her|our|their)\b/,
    /\b(signs?|symptoms?) of (a )?stroke\b[^.]{0,10}\b(in|on) (my|his|her|our|their)\b/,
  ],
  strokeMention: [/\bstrokes?\b/, /\btia\b/, /\bmini[- ]?stroke\b/, /\bf\.?a\.?s\.?t\.?\b(?= (test|signs?|acronym))/],

  heart: [
    /\bchest\b[^.]{0,20}\b(pain|pains|pressure|tightness|tight|discomfort|heaviness|heavy|squeez\w*|crushing|hurts?|hurting|aches?|aching)\b/,
    /\b(pain|pressure|tightness|discomfort|squeezing)\b[^.]{0,15}\b(in|on) (my|his|her|their|the) chest\b/,
    /\b(elephant|weight|something heavy|ton of bricks|bricks?)\b[^.]{0,25}\b(on|against) (my|his|her|their|the) chest\b/,
    /\bhaving a heart attack\b/,
    /\b(it's|is it|might be|could be|think it's|think i'm having|think he's having|think she's having) a heart attack\b/,
    /\b(showing|having|getting) (the )?(signs?|symptoms?) of a heart attack\b/,
    /\b(pain|ache|discomfort|tightness)\b[^.]{0,30}\b(spread\w*|radiat\w*|going|goes|moving|shoot\w*) (down|to|into|up) (my|his|her|the)? ?(left )?(arm|jaw|neck|back|shoulder)\b/,
    /\bcardiac arrest\b/,
  ],
  heartMention: [/\bheart attacks?\b/, /\bchest pain\b/, /\bangina\b/],

  breathing: [
    /\b(can't|cannot|unable to|struggling to|fighting to|could not|couldn't) (breathe|breath|catch (my|his|her|their) breath|get (enough )?air)\b/,
    /\b(gasping|suffocating|turning blue)\b/,
    // Not the figure of speech: "choking on how expensive my insulin is", "choking up".
    /\bchoking\b(?! (up|back)\b| on (how|what|the (price|prices|cost|costs|bill|bills)|my words|the words|those words)\b)/,
    /\blips? (are |is |look |looks |turning |turned )?(blue|gray|grey|purple)\b/,
    /\b(severe(ly)?|very|really|extremely)\b[^.]{0,15}\b(short(ness)? of breath|trouble breathing|difficulty breathing)\b/,
    /\b(short(ness)? of breath|trouble breathing|difficulty breathing)\b[^.]{0,25}\b(at rest|resting|sitting still|lying down|can't talk|can't speak|getting worse fast)\b/,
    /\b(inhaler|albuterol|nebulizer)\b[^.]{0,30}\b(isn't|is not|not|doesn't|didn't|won't) (help|helping|work|working)\b/,
    /\bsevere asthma attack\b/,
    /\b(trouble|difficulty|hard time|having trouble|problems?) breathing\b/,
    /\bbarely (breathe|breathing)\b/,
  ],
  breathingMild: [/\bshort(ness)? of breath\b/, /\b(winded|out of breath|breathless|wheez\w*)\b/, /\basthma attack\b/],
  breathingMention: [/\btrouble breathing\b/, /\bshortness of breath\b/, /\bchoking\b/],
  mildQualifier: /\b(a little|a bit|slight(ly)?|mild(ly)?|sometimes|occasionally|when (i|he|she) (exercise|run|climb|walk|work out)|with (exercise|activity)|climbing stairs|after (running|exercise))\b/,

  anaphylaxis: [
    /\b(throat|tongue|lips?|mouth)\b[^.]{0,20}\b(swell\w*|swollen|closing|tight|tightening|puff\w*)/,
    /\bswell\w*\b[^.]{0,20}\b(of|in) (my|his|her|the|their) (throat|tongue|lips?|mouth)\b/,
    /\banaphyla\w*/,
    /\b(used|gave|give|need|needed|using|use) (my|his|her|an|the|their)? ?(epipen|epi-pen|epinephrine|auvi-q)\b/,
  ],
  anaphylaxisFace: [/\bface\b[^.]{0,20}\b(swell\w*|swollen|puff\w*)/, /\bswollen face\b/],
  allergyContext: [/\b(allerg\w*|hives|sting|stung|bee|wasp|peanut|shellfish|reaction|after (taking|eating)|lisinopril|ace inhibitor|breath\w*|wheez\w*)\b/],
  hives: [/\b(hives|welts)\b/],
  hivesDanger: [/\b(breath\w*|wheez\w*|throat|dizzy|faint\w*|light-?headed|passing out)\b/],
  anaphylaxisMention: [/\banaphyla\w*/, /\ballergic reactions?\b/, /\bepipen\b|\bepinephrine\b/],

  unconscious: [
    /\b(unconscious|unresponsive|not responding|won't respond|isn't responding|won't wake( up)?|can't wake (him|her|them|up)|not waking up|isn't waking up|won't open (his|her|their) eyes)\b/,
    /\b(not breathing|stopped breathing|isn't breathing|no pulse|no heartbeat)\b/,
    /\bcollapsed\b/,
    /\b(just|suddenly) (passed out|fainted|blacked out)\b/,
  ],
  fainting: [/\b(passed out|fainted|fainting|blacked out|blackout|syncope)\b/],
  unconsciousMention: [/\bcpr\b/, /\bunconscious\b/, /\bfaint(ing)?\b/],

  seizure: [
    /\b(having|is having|am having|had|just had) (a |another )?(seizure|fit|convulsion)\b/,
    /\bseizing\b/,
    /\bconvuls\w*/,
    /\bseizure\b[^.]{0,30}\b(won't stop|not stopping|more than (5|five) minutes|lasting|for \d+ minutes)\b/,
    /\b(shaking|jerking)\b[^.]{0,20}\b(uncontrollably|all over|and (won't|isn't|not) respond\w*)\b/,
  ],
  /** "I have epilepsy and I'm having one now" (only when seizures are mentioned). */
  seizureOne: [/\b(am|is|are|'m|'s|'re|just) (having|had) (one|another( one)?)\b/],
  seizureMention: [/\bseizures?\b/, /\bepilepsy\b/],

  bleeding: [
    /\b(bleeding|blood)\b[^.]{0,25}\b(won't|will not|doesn't|does not|isn't|can't|cannot) (stop|slow)\w*/,
    /\b(won't|will not|doesn't|does not|can't|cannot) stop bleeding\b/,
    /\b(bleeding|bleed\w*) (heavily|a lot|badly|profusely|everywhere|really bad)\b/,
    /\b(heavy|severe|massive|uncontrolled|uncontrollable|really bad) bleeding\b/,
    /\b(spurting|gushing|pouring|squirting) (blood|out)\b/,
    /\bblood (is )?(spurting|gushing|pouring)\b/,
    /\b(vomit\w*|throwing up|threw up|puking|coughing up|coughed up) (blood|bright red)\b/,
    /\bblood in (my|his|her) (vomit|throw up)\b/,
  ],
  bleedingMention: [/\bbleeding\b/, /\btourniquet\b/],
  giBleed: [/\b(black|tarry|maroon)\b[^.]{0,15}\b(stool|stools|poop|bowel movements?)\b/, /\bblood(y)? (in (my|his|her|the) )?(stool|stools|poop|diarrhea)\b/],
  wound: [/\b(deep|large|big|gaping|long) (cut|wound|gash|laceration)\b/, /\bneeds? stitches\b/],

  head: [
    /\b(hit|bumped|banged|smacked|struck|hurt|injured|cracked) (my|his|her|their|the) head\b/,
    /\bhead (injury|trauma|wound)\b/,
    /\bconcussion\b/,
    /\bfell\b[^.]{0,30}\bhead\b/,
    /\bknocked out\b/,
  ],
  headDanger: [
    /\b(vomit\w*|throw\w* up|threw up|confus\w*|passed out|knocked out|unconscious|seizure|won't wake|hard to wake|very sleepy|drowsy|slurred|can't remember|memory|worst headache|headache (is )?getting worse|clear fluid|blood (from|coming out of) (the |his |her |my )?(ear|nose)|unequal pupils|blood thinner|warfarin|eliquis|xarelto)\b/,
  ],
  headMention: [/\bconcussion\b/, /\bhead injur\w*/],

  pregnant: [/\b(pregnant|pregnancy|weeks along|expecting a baby)\b/],
  pregnancyDanger: [
    /\b(bleed\w*|heavy bleeding|severe (pain|cramp\w*|headache|belly|stomach|abdominal)|water (broke|breaking)|leaking fluid|fluid leaking|baby (isn't|is not|hasn't|stopped|not) (moving|kicking)|not feeling (the )?baby|baby moving less|less movement|blurr(y|ed) vision|seeing spots|seizure|swelling (in|of) (my )?(face|hands)|fever|contractions)\b/,
  ],

  fever: [/\b(fever|feverish|febrile|high temp(erature)?)\b/, /\btemp(erature)? (of|is|was) (10[0-9]|3[89]|4[0-2])/],
  stiffNeck: [/\bstiff neck\b/, /\bneck (is |feels )?(really |very )?(stiff|rigid)\b/, /\bcan't (bend|touch|move) (my|his|her) (neck|chin)/],
  badRash: [/\brash\b[^.]{0,40}\b(doesn't fade|won't fade|not fad\w*|purple|spots that don't|glass)\b/, /\bpurple (spots|rash)\b/],
  meningitisMention: [/\bmeningitis\b/],

  sepsis: [/\b(sepsis|septic)\b/],
  infectionContext: [/\b(infection|infected|uti|pneumonia|cellulitis|abscess|fever)\b/],
  sepsisSigns: [
    /\b(confus\w*|disoriented|very sleepy|hard to wake|lethargic|clammy|mottled|blotchy|racing heart|heart (is )?racing|fast heart|breathing (really )?fast|shivering uncontrollably|extreme pain|worst pain|feel like (i'm|i am) dying|pale and cold)\b/,
  ],

  infant: [/\b(baby|infant|newborn|(\d|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[- ](week|month)s?[- ]old)\b/],
  highFeverWords: [/\b(high|very high|really high|spiking) fever\b/, /\bfever\b[^.]{0,30}\b(for|over|more than) (3|4|5|6|7|three|four|five|six|seven|several) days\b/, /\bfever\b[^.]{0,20}\b(a|one|over a) week\b/],

  dehydration: [
    /\b(can't|cannot|unable to) keep (anything|any fluids|fluids|water|liquids|food) down\b/,
    /\b(haven't|hasn't|not) (peed|urinated)\b/,
    /\b(very little|barely any|no) (urine|pee)\b/,
    /\b(vomiting|throwing up|diarrhea)\b[^.]{0,30}\b(for|all|over) (\d+|two|three|several|a couple of) days?\b/,
    /\b(vomiting|throwing up|diarrhea) all (day|night)\b/,
    /\b(severely |very |really )?dehydrated\b/,
  ],
  dehydrationMention: [/\bdehydrat\w*/],

  infection: [
    /\b(red(ness)?|swelling|swollen|warm|hot|pus|oozing)\b[^.]{0,40}\b(spreading|getting (worse|bigger|redder)|worse|growing)\b/,
    /\bred (streaks?|line)\b/,
    /\binfected (cut|wound|bite|incision|tooth|toe|finger)\b/,
    /\b(cut|wound|bite|incision)\b[^.]{0,30}\b(pus|oozing|infected|red and (hot|warm|swollen))\b/,
    /\b(cellulitis|abscess)\b/,
  ],

  lowSugarWords: [/\blow blood sugar\b/, /\bhypoglycemi\w*/, /\b(blood )?sugar (is |is really |dropped|crashed|went )?(low|dropping|crashing)\b/],
  sugarSevere: [/\b(confus\w*|passed out|unconscious|seizure|can't swallow|won't wake|not making sense)\b/],
  dkaSigns: [/\b(vomit\w*|throwing up|belly pain|stomach pain|fruity|breathing (fast|hard)|confus\w*)\b/],

  severePain: [
    /\b(severe|excruciating|unbearable|worst|terrible|intense|sharp)\b[^.]{0,20}\b(belly|stomach|abdominal|abdomen|pelvic|testic\w*|flank|side) (pain|ache|cramps?)\b/,
    /\b(belly|stomach|abdominal) pain\b[^.]{0,30}\b(severe|unbearable|worst|can't stand|won't go away)\b/,
    /\b(worst|unbearable) pain\b/,
    /\b10 ?(out of|\/) ?10 pain\b|\bpain (is )?(a )?10 ?(out of|\/) ?10\b/,
  ],

  bpSymptoms: [
    /\b(chest pain|short(ness)? of breath|back pain|numb\w*|weak\w*|vision|can't see|trouble (speaking|talking)|confus\w*|severe headache|worst headache)\b/,
  ],
};

// ── Framing: educational vs. happening now vs. in the past ───────────────────

const EDUCATIONAL =
  /\b(what (are|is|were|does|do|would|should|can|happens)|what's|how (do|does|can|would|should|to|long|common|likely)|why (do|does|is|are)|when (should|to|do)|is it (normal|true|possible|safe)|signs? of|symptoms? of|warning signs?|explain|tell me about|learn( about)?|teach me|difference between|risk factors?|recogni[sz]e|how to (tell|spot|prevent|help|respond)|in case|prevent\w*|lesson|quiz|definition|mean|means|side effects?|can \w+ cause|does \w+ cause|statistics|first aid)\b/;
const EDUCATIONAL_G = new RegExp(EDUCATIONAL.source, 'g');
/**
 * "What should I do?", "what does that mean?" after describing a symptom ask for help with
 * something happening — they are not what makes a message educational.
 */
const ACTION_QUESTION =
  /\bwhat (should|do|can|must|shall) (i|we|you|he|she|they) do\b|\bwhat (does|do) (that|this|it) mean( about me| for me)?\b|\bwhat now\b|\bshould (i|we) (go|call|worry|be worried|get help|see someone|head)\b|\bis (that|this) (normal|bad|serious|dangerous|an emergency|ok|okay)\b/g;
const HYPOTHETICAL =
  /\b(if|in case|when|whether) (someone|somebody|a person|people|you|your|a child|a friend|anyone|a loved one|someone's)\b|\bif (my|his|her|our|i) (\w+ ){1,2}?(ever|has|had|gets|got|were)\b|\bif i ever\b|\bif (my|his|her|our) \w+ (says|said|tells|told|talks|mentions)\b/;
const TIME_CUE =
  /\b(right now|currently|at the moment|just (started|happened|now|began)|this (morning|afternoon|evening)|tonight|minutes? ago|an hour ago|hours? ago|since (this|last night|yesterday|\d)|all of a sudden|suddenly|help me|please help|hurry|is happening|happening now|won't stop)\b/;
/** Recurring, not-happening-now symptoms: worth a same-day call rather than 911. */
const RECURRENT_CUE = /\b(sometimes|occasionally|now and then|from time to time|every so often|every now and then|on and off|comes and goes|come and go)\b/;
/** Words that put a phrase in the present, even next to an old event ("…and now I have chest pain"). */
const CURRENT_CUE =
  /\b(now|right now|currently|at the moment|today|tonight|still|again|this (morning|afternoon|evening)|just (started|happened|now|began)|minutes? ago|an hour ago|hours? ago|since)\b/;
/** Long-past events ("had a seizure years ago"): an info card. */
const DISTANT_PAST =
  /\b(last (month|year)|(a few|few|several|many|a couple of?|\d+|two|three|four|five|six|ten) (months|years) ago|a (month|year) ago|years? ago|months? ago|used to|in the past|history of|hx of|a while ago|long time ago|previously|once had|back in|when i was (a kid|a child|young|younger|little|pregnant|in)|as a (kid|child|teen|teenager)|growing up)\b/;
/** Recent, finished events ("chest pain last week, it went away"): chest pain still needs a check today. */
const RECENT_PAST =
  /\b(yesterday|last (night|week|weekend)|(a few|few|several|a couple of?|\d+|two|three|four|five|six) (days|weeks) ago|a (day|week) ago|days? ago|weeks? ago|over the weekend|went away|has gone away|goes away|go away|came and went|resolved|stopped on its own)\b/;
const SEGMENT_BREAK = /\b(?:and|then|so|now|while|because|when|after)\b/g;
const PERSONAL_SUBJECT =
  /\b(i|i'm|i am|i've|my|me|he|she|he's|she's|they|they're|we|we're|mom|mum|dad|husband|wife|spouse|son|daughter|baby|toddler|child|kid|teen|teenager|friend|partner|boyfriend|girlfriend|grandma|grandpa|grandmother|grandfather|mother|father|brother|sister|uncle|aunt|roommate|coworker|neighbor)\b/;
const PRESENT_VERB =
  /\b(is|are|am|'s|'re|'m|keeps?|can't|cannot|won't|isn't|feels?|feeling|hurts?|hurting|aches?|aching|have|has|having|getting|got|started|took|taken|swallowed|overdosed|ate|drank|looks?|seems?|showing)\b/;
/** A clause in the writer's own voice inside a pasted note ("my dad's face is drooping right now"). */
const OWN_VOICE = /\b(i|i'm|i am|i've|my|me|myself|we|we're|our)\b/;
const FAMILY = /\b(mom|mum|dad|husband|wife|son|daughter|baby|toddler|kid|grandma|grandpa)\b/;
const PLEA = /\b(right now|help me|please help|hurry|should (i|we) go)\b/;
/** Self-injury that may be accidental ("cut myself"): after the fact it is an info card, not an alarm. */
const CUT_SELF = /^(cut|cutting) /;
/** Clinical scenarios about a patient ("58M with crushing chest pain", "pt with SI"). */
const CLINICAL_CASE = /\b(pt|pts|patient|patients|my patient|\d+ ?(y\/?o|yo|year[- ]olds?|yom|yof|m|f)|presents?|presenting)\b/;
const CLINICIAN_SELF = /\b(i|i'm|i am|i've|me|myself)\b/;
/** A bleeding clause about a wound or vomiting/coughing blood (wound first aid applies). */
const WOUND_CONTEXT =
  /\b(cut|cuts|wound|gash|laceration|injur\w*|hand|finger|arm|leg|foot|knee|head|nose|face|vomit\w*|throwing up|threw up|puking|cough\w*|spurting|gushing|squirting)\b/;

/** In a pasted note, words the patient or a family member typed themselves (never downgraded). */
function writersOwnVoice(clause: string, text: string): boolean {
  return OWN_VOICE.test(clause) || (FAMILY.test(clause) && !/\b(pt|patient)\b/.test(clause)) || PLEA.test(text);
}

/** A clause about the person themselves right now, ignoring question words ("what are", "signs of"). */
function personalNow(clause: string): boolean {
  return PERSONAL_SUBJECT.test(clause) && PRESENT_VERB.test(clause.replace(EDUCATIONAL_G, ' '));
}

type Timing = 'current' | 'recent' | 'past';

/** The stretch of a clause around `index`, cut at "and", "now", "then"… (the cut word starts the next stretch). */
function segmentAround(clause: string, index: number): string {
  let start = 0;
  let end = clause.length;
  for (const m of clause.matchAll(SEGMENT_BREAK)) {
    if (m.index <= index) start = m.index;
    else {
      end = m.index;
      break;
    }
  }
  return clause.slice(start, end);
}

function pastKind(text: string): Exclude<Timing, 'current'> | null {
  if (DISTANT_PAST.test(text)) return 'past';
  if (RECENT_PAST.test(text)) return 'recent';
  return null;
}

/** When the matched phrase happened, judged from its own part of the sentence. */
function timingOf(hit: Hit, clauses: Clause[]): Timing {
  const segment = segmentAround(hit.clause, hit.index);
  if (CURRENT_CUE.test(segment)) return 'current';
  const own = pastKind(segment);
  if (own) return own;
  // A short lead-in such as "Last week," or "Years ago," sets the time for the clause after it.
  const prev = hit.clauseIndex > 0 ? clauses[hit.clauseIndex - 1] : undefined;
  if (prev && prev.text.split(/\s+/).length <= 4) return pastKind(prev.text) ?? 'current';
  return 'current';
}

// ── BP / temperature / glucose numbers ───────────────────────────────────────

function bloodPressureReading(text: string): { systolic: number; diastolic: number } | null {
  if (!/\b(bp|blood pressure|pressure|reading|systolic)\b/.test(text)) return null;
  for (const m of text.matchAll(/\b(\d{2,3})\s*(?:\/|over)\s*(\d{2,3})\b/g)) {
    const systolic = Number(m[1]);
    const diastolic = Number(m[2]);
    if (systolic >= 60 && systolic <= 300 && diastolic >= 30 && diastolic <= 200 && systolic > diastolic) return { systolic, diastolic };
  }
  return null;
}

function temperatureF(text: string): number | null {
  if (!/\b(fever|temp|temperature|thermometer|degrees|°)\b|°/.test(text)) return null;
  for (const m of text.matchAll(/\b(\d{2,3}(?:\.\d)?)\s*(°|degrees?|deg)?\s*(f|c|fahrenheit|celsius)?\b/g)) {
    const value = Number(m[1]);
    const unit = m[3] ?? '';
    if (unit.startsWith('c') || (value >= 35 && value <= 43 && !unit.startsWith('f'))) return value * 1.8 + 32;
    if (value >= 95 && value <= 110) return value;
  }
  return null;
}

function glucoseReading(text: string): number | null {
  const m = text.match(/\b(blood sugar|blood glucose|glucose|sugar|bg|bs|reading)\b[^.\d]{0,20}(\d{2,3})\b/);
  if (!m) return null;
  const value = Number(m[2]);
  return value >= 20 && value <= 900 ? value : null;
}

// ── Main entry ───────────────────────────────────────────────────────────────

export interface TriageResult {
  triage: Triage | null;
  /** Matched categories, most important first. */
  categories: TriageCategory[];
  /** True when the message reads as a general/educational question (info-level card). */
  educational: boolean;
  /** MedlinePlus query suggested by the top category. */
  topic: string | null;
}

export interface TriageOptions {
  /**
   * The message is a pasted clinician note: its findings become an info card — except
   * clauses in the writer's own voice ("I have chest pain right now").
   */
  noteLike?: boolean;
  /**
   * 'clinician': case descriptions about a patient are not alarms for the doctor asking
   * (no triage card); only first-person reports ("I'm having chest pain") are.
   */
  audience?: 'patient' | 'clinician';
}

const ORDER: TriageCategory[] = [
  'battery',
  'overdose',
  'suicide',
  'stroke',
  'heart',
  'anaphylaxis',
  'breathing',
  'unconscious',
  'seizure',
  'bleeding',
  'head-injury',
  'pregnancy',
  'meningitis',
  'sepsis',
  'bp-crisis',
  'low-sugar',
  'high-sugar',
  'extra-dose',
  'infant-fever',
  'high-fever',
  'breathing-mild',
  'fainting',
  'dehydration',
  'infection',
  'gi-bleed',
  'wound',
  'severe-pain',
];

interface Detection {
  category: TriageCategory;
  level: 'emergency' | 'urgent';
  hits: Hit[];
}

/** Count-based ingestions: ≥10 pills (≥5 for a child) is an overdose, fewer extra pills an extra dose. */
function countHits(clauses: Clause[], text: string): { overdose: Hit[]; extra: Hit[] } {
  const child = CHILD_SUBJECT.test(text);
  const overdose: Hit[] = [];
  const extra: Hit[] = [];
  clauses.forEach((clause, clauseIndex) => {
    if (clause.negatedList) return;
    for (const m of clause.text.matchAll(COUNT_TAKEN)) {
      if (isNegated(clause.text, m.index)) continue;
      const raw = m[1] ?? '';
      const count = COUNT_WORDS[raw] ?? Number(raw);
      if (!Number.isFinite(count)) continue;
      const hit: Hit = { category: 'overdose', match: m[0], clause: clause.text, clauseIndex, index: m.index };
      if (count >= 10 || (child && count >= 5)) overdose.push(hit);
      else if (count >= 5 || (child && count >= 3)) extra.push({ ...hit, category: 'extra-dose' });
    }
  });
  return { overdose, extra };
}

function detect(text: string, clauses: Clause[]): Detection[] {
  const found: Detection[] = [];
  const has = (category: TriageCategory) => found.some((f) => f.category === category);
  const add = (category: TriageCategory, hits: Hit[], level: 'emergency' | 'urgent' = CATEGORY_INFO[category].level) => {
    if (hits.length > 0 && !has(category)) found.push({ category, level, hits });
  };
  const hitsFor = (patterns: RegExp[], category: TriageCategory, accept?: Accept) => findHits(clauses, patterns, category, accept);

  const selfHarm = hitsFor(P.suicideSelf, 'suicide').map((hit) => ({ ...hit, strong: true }));
  add('suicide', [...selfHarm, ...hitsFor(P.suicideWord, 'suicide')]);

  // "Took all my pills" is routine ("…this morning") unless the person is also talking about suicide.
  const notRoutine: Accept = (clause, m) => has('suicide') || !/^took all\b/.test(m[0]) || !ROUTINE_DOSE.test(clause.slice(m.index));
  const counted = countHits(clauses, text);
  const poison = [...hitsFor(P.overdose, 'overdose', notRoutine), ...counted.overdose];
  add('battery', poison.filter((h) => BATTERY.test(h.clause)).map((h) => ({ ...h, category: 'battery' as const })));
  add('overdose', poison.filter((h) => !BATTERY.test(h.clause)));
  if (!has('overdose') && !has('battery')) {
    const usual: Accept = (clause) => !USUAL_SCHEDULE.test(clause);
    add('extra-dose', [...hitsFor(P.extraDose, 'extra-dose', usual), ...counted.extra]);
  }
  add('stroke', hitsFor(P.stroke, 'stroke'));
  add('heart', hitsFor(P.heart, 'heart'));

  const severeBreathing = hitsFor(P.breathing, 'breathing');
  if (severeBreathing.length > 0) {
    const isMild = (hit: Hit) => P.mildQualifier.test(hit.clause) && !/\b(can't|cannot|gasping|choking|blue)\b/.test(hit.clause);
    const serious = severeBreathing.filter((hit) => !isMild(hit));
    if (serious.length > 0) add('breathing', serious);
    else add('breathing-mild', severeBreathing.map((hit) => ({ ...hit, category: 'breathing-mild' as const })));
  } else {
    add('breathing-mild', hitsFor(P.breathingMild, 'breathing-mild'));
  }

  add('anaphylaxis', hitsFor(P.anaphylaxis, 'anaphylaxis'));
  if (hasAny(clauses, P.allergyContext)) add('anaphylaxis', hitsFor(P.anaphylaxisFace, 'anaphylaxis'));
  if (hasAny(clauses, P.hivesDanger)) add('anaphylaxis', hitsFor(P.hives, 'anaphylaxis'));

  add('unconscious', hitsFor(P.unconscious, 'unconscious'));
  if (!has('unconscious')) add('fainting', hitsFor(P.fainting, 'fainting'));
  add('seizure', hitsFor(P.seizure, 'seizure'));
  if (hasAny(clauses, P.seizureMention)) add('seizure', hitsFor(P.seizureOne, 'seizure'));
  add('bleeding', hitsFor(P.bleeding, 'bleeding'));
  add('gi-bleed', hitsFor(P.giBleed, 'gi-bleed'));
  if (!has('bleeding')) add('wound', hitsFor(P.wound, 'wound'));

  const head = hitsFor(P.head, 'head-injury');
  add('head-injury', head, hasAny(clauses, P.headDanger) ? 'emergency' : 'urgent');

  if (hasAny(clauses, P.pregnancyDanger)) add('pregnancy', hitsFor(P.pregnant, 'pregnancy'));

  const fever = hitsFor(P.fever, 'meningitis');
  const tempF = temperatureF(text);
  const hasFever = fever.length > 0 || (tempF !== null && tempF >= 100.4);
  const tempHit = (category: TriageCategory) => readingHit(clauses, category, /\b(fever|temp\w*|thermometer|degrees)\b|\d{2,3}(\.\d)?\s*°/);
  if (hasFever && (hasAny(clauses, P.stiffNeck) || hasAny(clauses, P.badRash))) {
    add('meningitis', fever.length > 0 ? fever : [tempHit('meningitis')]);
  }

  const sepsisWord = hitsFor(P.sepsis, 'sepsis');
  if (sepsisWord.length > 0) add('sepsis', sepsisWord);
  else if (hasAny(clauses, P.infectionContext)) add('sepsis', hitsFor(P.sepsisSigns, 'sepsis'));

  const bp = bloodPressureReading(text);
  if (bp && (bp.systolic >= 180 || bp.diastolic >= 120)) {
    const symptomatic = hasAny(clauses, P.bpSymptoms);
    add('bp-crisis', [readingHit(clauses, 'bp-crisis', /\d{2,3}\s*(?:\/|over)\s*\d{2,3}/)], symptomatic ? 'emergency' : 'urgent');
  }

  const glucose = glucoseReading(text);
  const lowWords = hitsFor(P.lowSugarWords, 'low-sugar');
  const glucoseHit = (category: TriageCategory) => readingHit(clauses, category, /\b(blood sugar|blood glucose|glucose|sugar|bg|bs|reading)\b/);
  if ((glucose !== null && glucose < 70) || lowWords.length > 0) {
    add('low-sugar', lowWords.length > 0 ? lowWords : [glucoseHit('low-sugar')], hasAny(clauses, P.sugarSevere) ? 'emergency' : 'urgent');
  } else if (glucose !== null && glucose >= 300) {
    add('high-sugar', [glucoseHit('high-sugar')], hasAny(clauses, P.dkaSigns) ? 'emergency' : 'urgent');
  }

  if (hasFever) {
    const infant = hitsFor(P.infant, 'infant-fever');
    if (infant.length > 0 && !/\b([4-9]|1[0-2]|four|five|six|seven|eight|nine|ten|eleven|twelve)[- ]months?[- ]old\b|\byears? old\b/.test(text)) {
      add('infant-fever', infant);
    } else if ((tempF !== null && tempF >= 103) || hasAny(clauses, P.highFeverWords)) {
      add('high-fever', fever.length > 0 ? fever.map((hit) => ({ ...hit, category: 'high-fever' as const })) : [tempHit('high-fever')]);
    }
  }

  add('dehydration', hitsFor(P.dehydration, 'dehydration'));
  add('infection', hitsFor(P.infection, 'infection'));
  add('severe-pain', hitsFor(P.severePain, 'severe-pain'));
  return found;
}

/** Most important first; bleeding in pregnancy gets the pregnancy steps, not wound first aid. */
function orderDetections(found: Detection[]): Detection[] {
  const sorted = [...found].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  const bleeding = sorted.findIndex((d) => d.category === 'bleeding');
  const pregnancy = sorted.find((d) => d.category === 'pregnancy');
  if (bleeding >= 0 && pregnancy && !sorted[bleeding]!.hits.some((hit) => WOUND_CONTEXT.test(hit.clause))) {
    const rest = sorted.filter((d) => d !== pregnancy);
    rest.splice(bleeding, 0, pregnancy);
    return rest;
  }
  return sorted;
}

const MENTIONS: Array<[TriageCategory, RegExp[]]> = [
  ['suicide', P.suicideMention],
  ['overdose', P.overdoseMention],
  ['stroke', P.strokeMention],
  ['heart', P.heartMention],
  ['anaphylaxis', P.anaphylaxisMention],
  ['breathing', P.breathingMention],
  ['seizure', P.seizureMention],
  ['unconscious', P.unconsciousMention],
  ['bleeding', P.bleedingMention],
  ['head-injury', P.headMention],
  ['meningitis', P.meningitisMention],
  ['sepsis', P.sepsis],
  ['dehydration', P.dehydrationMention],
];

function dedupeActions(actions: TriageAction[]): TriageAction[] {
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key = a.phone ?? a.url ?? a.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** How a match reads: happening now, a general question, a past event, a pasted note, or a clinician's case. */
type Framing = 'live' | 'educational' | 'note' | 'past' | 'clinical';
const FRAMING_RANK: Record<Framing, number> = { live: 0, educational: 1, note: 2, past: 3, clinical: 4 };

export function triageMessage(message: string, options: TriageOptions = {}): TriageResult {
  const text = normalizeForTriage(expandShorthand(message));
  const clauses = splitClauses(text);
  const detections = orderDetections(detect(text, clauses));

  const educationalFraming = EDUCATIONAL.test(text.replace(ACTION_QUESTION, ' '));
  const timeCue = TIME_CUE.test(text);
  const clinician = options.audience === 'clinician';
  const clinicalCase = clinician && CLINICAL_CASE.test(text);

  const frame = (hit: Hit, timing: Timing): Framing => {
    if (clinician && (clinicalCase || !CLINICIAN_SELF.test(hit.clause))) return 'clinical';
    if (timing === 'past') return 'past';
    if (timing === 'recent' && hit.category === 'suicide' && (!hit.strong || CUT_SELF.test(hit.match))) return 'past';
    if (options.noteLike && !writersOwnVoice(hit.clause, text)) return 'note';
    if (timeCue) return 'live';
    // "If someone has chest pain, …" — judged for the clause (and an "if …," lead-in right before it),
    // so "I read that if you have chest pain you call 911. I have crushing chest pain" stays live.
    const leadIn = hit.clauseIndex > 0 ? clauses[hit.clauseIndex - 1]!.text : '';
    if (HYPOTHETICAL.test(hit.clause) || (/^(if|in case|when|whether)\b/.test(leadIn) && HYPOTHETICAL.test(leadIn))) return 'educational';
    if (hit.strong) return 'live';
    return educationalFraming && !personalNow(hit.clause) ? 'educational' : 'live';
  };

  // Each category is judged by its most "live" match.
  const judged = detections.map((d) => {
    const readings = d.hits.map((hit) => {
      const timing = timingOf(hit, clauses);
      return { timing, framing: frame(hit, timing) };
    });
    const best = readings.reduce((a, b) => (FRAMING_RANK[b.framing] < FRAMING_RANK[a.framing] ? b : a));
    return { ...d, ...best };
  });

  const recurrent = RECURRENT_CUE.test(text) && !timeCue;
  const live = judged
    .filter((d) => d.framing === 'live')
    // Chest pain that comes and goes, or that has already passed, needs a same-day check (urgent), not 911.
    .map((d) => (d.category === 'heart' && d.level === 'emergency' && (recurrent || d.timing === 'recent') ? { ...d, level: 'urgent' as const } : d));

  if (live.length > 0) {
    const top = live.find((d) => d.level === 'emergency') ?? live[0]!;
    const primary = CATEGORY_INFO[top.category];
    const others = live.filter((d) => d !== top);
    const suicideAndOverdose = live.some((d) => d.category === 'suicide') && live.some((d) => d.category === 'overdose' || d.category === 'battery');

    let actions = [...primary.actions, ...others.flatMap((d) => CATEGORY_INFO[d.category].actions)];
    if (suicideAndOverdose) actions = [CALL_911, CALL_988, POISON_HELP, CHAT_988];
    if (top.level === 'urgent' && !actions.some((a) => a.url === FIND_URGENT_CARE.url)) actions.push(FIND_URGENT_CARE);

    const extra = others
      .filter((d) => d.level === 'emergency' || top.level !== 'emergency')
      .slice(0, 2)
      .map((d) => CATEGORY_INFO[d.category].also);
    const downgraded = top.level === 'urgent' && primary.level === 'emergency';
    const primaryMessage = downgraded && primary.urgentMessage ? primary.urgentMessage : primary.message;

    return {
      triage: {
        level: top.level,
        title: downgraded ? (primary.urgentTitle ?? `${primary.infoTitle} — get checked soon`) : primary.title,
        message: [primaryMessage, ...extra].join(' '),
        actions: dedupeActions(actions).slice(0, 4),
      },
      categories: live.map((d) => d.category),
      educational: false,
      topic: primary.topic,
    };
  }

  // Educational questions, past events, pasted notes: an info card, never an alarm.
  const mentioned = educationalFraming
    ? MENTIONS.filter(([, patterns]) => patterns.some((p) => p.test(text))).map(([category]) => category)
    : [];
  const infoCategories = [...new Set([...judged.map((d) => d.category), ...mentioned])].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const first = infoCategories[0];
  if (!first) return { triage: null, categories: [], educational: educationalFraming, topic: null };

  const info = CATEGORY_INFO[first];
  // A clinician's case description is the subject of the question, not an alarm for them.
  if (clinician) return { triage: null, categories: infoCategories, educational: true, topic: info.topic };

  const framing = judged.find((d) => d.category === first)?.framing ?? 'educational';
  const infoActions =
    first === 'suicide' ? [CALL_988, CHAT_988] : first === 'overdose' || first === 'extra-dose' || first === 'battery' ? [POISON_HELP, CALL_911] : [CALL_911];
  const infoMessage =
    framing === 'note'
      ? 'This note mentions symptoms that can be serious. If you are having them right now, call 911.'
      : framing === 'past'
        ? `${info.also} If anything like this is happening now, get help right away.`
        : info.level === 'emergency'
          ? `If you notice these signs in yourself or someone else, don't wait: ${info.message.charAt(0).toLowerCase()}${info.message.slice(1)}`
          : info.message;
  return {
    triage: { level: 'info', title: info.infoTitle, message: infoMessage, actions: infoActions },
    categories: infoCategories,
    educational: true,
    topic: info.topic,
  };
}

/** Static reference citations for a category (used offline or to back triage guidance). */
export function triageSources(category: TriageCategory): CitationDraft[] {
  return CATEGORY_INFO[category].sources;
}
