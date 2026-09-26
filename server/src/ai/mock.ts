// Deterministic "demo mode" responder: builds a genuinely useful, cited answer from the
// triage rules, the glossary and the retrieved evidence (MedlinePlus, FDA labels, PubMed)
// without an LLM. Also the safety net when the LLM is unavailable or declines.

import type { CitationDraft } from '../evidence/types';
import { evidenceType, keyFinding, otcWarningHighlights, summarizeBoxedWarning, summarizeSection } from '../evidence';
import { splitSentences, takeSentences, titleCase, truncateWords } from '../evidence/text';
import { classDescription, findDrugMentions, knownInteraction, lookupDrug } from './drugs';
import { findGlossaryTerms, isGlossaryQuestion, keyTerms, looksLikeClinicalNote, toPlainLanguage, type GlossaryEntry } from './glossary';
import { commonSideEffects, interactionItems, plainLabel, summaryToLines, summaryToText } from './label-text';
import { describePrescription } from './prompts';
import { detectAspect, detectTopics, type Aspect } from './topics';
import { CATEGORY_INFO, type TriageCategory } from './triage';
import type { ChatInput, DrugEvidence, EvidenceBundle } from './types';

export const DEMO_FOOTER = 'Demo mode — add ANTHROPIC_API_KEY for full AI answers.';

export interface MockOptions {
  /** Why the mock answered (e.g. the LLM failed); shown instead of the demo footer. */
  fallbackReason?: string | null;
}

// ── Small formatting helpers ─────────────────────────────────────────────────

const cite = (id: string | null | undefined): string => (id ? ` [${id}]` : '');
const heading = (text: string): string => `### ${text}`;
const bullets = (items: string[]): string => items.map((item) => `- ${item}`).join('\n');
const numbered = (items: string[]): string => items.map((item, i) => `${i + 1}. ${item}`).join('\n');
const article = (phrase: string): string => {
  const first = phrase.split(/[\s(]/)[0] ?? '';
  if (/^[A-Z]{2,}s?$/.test(first)) return /^[AEFHILMNORSX]/.test(first) ? 'an' : 'a'; // acronyms: "an NSAID", "an ACE…"
  return /^[aeiou]/i.test(phrase) && !/^(u[bcfhjkqrstn]|eu|one)/i.test(phrase) ? 'an' : 'a';
};
const endWithPeriod = (text: string): string => (/[.!?:]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);
const listJoin = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

function safetyLine(input: ChatInput): string {
  return input.role === 'doctor'
    ? 'Evidence summary assembled from the listed sources — verify details against the primary literature and full prescribing information.'
    : 'BRIAN is an AI health guide, not a substitute for professional medical care. In an emergency, call 911.';
}

function footer(options: MockOptions): string {
  return options.fallbackReason ? options.fallbackReason : DEMO_FOOTER;
}

// Verified reference pages used to back glossary definitions.
const LAB_SOURCES: Record<string, CitationDraft> = {
  A1c: { source: 'MedlinePlus', title: 'Hemoglobin A1C (HbA1c) Test', url: 'https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/', publisher: 'MedlinePlus (National Library of Medicine)' },
  CMP: { source: 'MedlinePlus', title: 'Comprehensive Metabolic Panel (CMP)', url: 'https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/', publisher: 'MedlinePlus (National Library of Medicine)' },
  LDL: { source: 'MedlinePlus', title: 'Cholesterol Levels', url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/', publisher: 'MedlinePlus (National Library of Medicine)' },
  HDL: { source: 'MedlinePlus', title: 'Cholesterol Levels', url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/', publisher: 'MedlinePlus (National Library of Medicine)' },
  'lipid panel': { source: 'MedlinePlus', title: 'Cholesterol Levels', url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/', publisher: 'MedlinePlus (National Library of Medicine)' },
  lipids: { source: 'MedlinePlus', title: 'Cholesterol Levels', url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/', publisher: 'MedlinePlus (National Library of Medicine)' },
};
const MEDICAL_WORDS: CitationDraft = {
  source: 'MedlinePlus',
  title: 'Understanding Medical Words Tutorial',
  url: 'https://medlineplus.gov/medicalwords.html',
  publisher: 'MedlinePlus (National Library of Medicine)',
};
const DRUG_INFO_HOME: CitationDraft = {
  source: 'MedlinePlus',
  title: 'Drugs, Herbs and Supplements',
  url: 'https://medlineplus.gov/druginformation.html',
  publisher: 'MedlinePlus (National Library of Medicine)',
};
const dailyMedSearch = (drug: string): CitationDraft => ({
  source: 'NIH',
  title: `${titleCase(drug)} — DailyMed label search`,
  url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${encodeURIComponent(drug)}`,
  publisher: 'DailyMed (National Library of Medicine)',
});

/** First 1–2 sentences of a MedlinePlus summary paragraph. */
function topicLead(bundle: EvidenceBundle, index = 0, maxChars = 320): { title: string; text: string; id: string } | null {
  const entry = bundle.topics[index];
  if (!entry) return null;
  const paragraph = entry.topic.blocks.find((b) => b.kind === 'paragraph')?.text ?? entry.topic.snippet;
  return paragraph ? { title: entry.topic.title, text: takeSentences(paragraph, maxChars, 3), id: entry.sourceId } : null;
}

/**
 * The opening section of a MedlinePlus summary, keeping its lists ("Get at least 150
 * minutes…" + bullets), plus a section matching the question's aspect when present.
 */
function topicDetail(
  bundle: EvidenceBundle,
  aspect: Aspect,
): { title: string; body: string; section: { heading: string; items: string[] } | null; id: string } | null {
  const entry = bundle.topics[0];
  if (!entry) return null;
  const blocks = entry.topic.blocks;
  const id = entry.sourceId;

  // Overview: from the start until a new "question" heading (or the budget) after some content.
  const lines: string[] = [];
  let used = 0;
  let items: string[] = [];
  const flushItems = () => {
    if (items.length > 0) lines.push(`${bullets(items.slice(0, 5))}${cite(id)}`);
    items = [];
  };
  let paragraphs = 0;
  for (const [index, block] of blocks.entries()) {
    if (used > 900) break;
    if (block.kind === 'heading') {
      if (index === 0) continue;
      if (paragraphs > 0 && /\?$/.test(block.text.trim())) break;
      flushItems();
      if (paragraphs > 0 && !/\?$/.test(block.text.trim())) lines.push(`**${block.text.replace(/\s+\?/, '?')}**`);
      continue;
    }
    if (block.kind === 'item') {
      items.push(truncateWords(block.text, 220));
      used += Math.min(block.text.length, 220);
      continue;
    }
    flushItems();
    if (paragraphs >= 3) break;
    const text = takeSentences(block.text, 380, 3);
    lines.push(/:$/.test(text) ? text : `${text}${cite(id)}`);
    used += text.length;
    paragraphs += 1;
  }
  flushItems();
  // Drop a trailing bold sub-heading with nothing under it.
  while (lines.length > 0 && /^\*\*[^*]+\*\*$/.test(lines[lines.length - 1]!)) lines.pop();

  const aspectWords: Record<Exclude<Aspect, null>, RegExp> = {
    symptoms: /symptom|sign/i,
    prevention: /prevent/i,
    treatment: /treat/i,
    safety: /risk|side effect|safe/i,
    dosing: /take|dose/i,
    interactions: /interact/i,
    pregnancy: /pregnan/i,
    lifestyle: /prevent|lifestyle|healthy/i,
    diagnosis: /diagnos|test/i,
    recommendations: /how much|how often|recommend|guideline/i,
  };
  let section: { heading: string; items: string[] } | null = null;
  const matcher = aspect ? aspectWords[aspect] : /symptom|treat/i;
  const headingIndex = blocks.findIndex((b, i) => i > 0 && b.kind === 'heading' && matcher.test(b.text));
  if (headingIndex >= 0) {
    const found: string[] = [];
    let lead = '';
    for (const block of blocks.slice(headingIndex + 1)) {
      if (block.kind === 'heading') break;
      if (block.kind === 'item') found.push(truncateWords(block.text, 200));
      else if (!lead && block.kind === 'paragraph') lead = takeSentences(block.text, 300, 2);
    }
    const headingText = blocks[headingIndex]!.text.replace(/\s+\?/, '?');
    const overviewText = lines.join(' ');
    if (found.length > 0 && !found.every((f) => overviewText.includes(f.slice(0, 40)))) section = { heading: headingText, items: found.slice(0, 7) };
    else if (lead && !overviewText.includes(lead.slice(0, 40))) section = { heading: headingText, items: [lead] };
  }
  return { title: entry.topic.title.replace(/\s+\?/, '?'), body: lines.join('\n\n'), section, id };
}

function researchSection(bundle: EvidenceBundle, max = 3, withSnippets = false): string | null {
  if (bundle.articles.length === 0) return null;
  const lines = bundle.articles.slice(0, max).map(({ article, sourceId }) => {
    const kind = evidenceType(article);
    const meta = [kind, article.journal, article.year].filter(Boolean).join(', ');
    const title = article.title.replace(/\.$/, '');
    const finding = withSnippets ? keyFinding(article, 260) : null;
    const detail = finding ? ` ${finding}` : '';
    return `**${title}** (${meta}).${detail}${cite(sourceId)}`;
  });
  const intro =
    bundle.articles.length > 0
      ? 'Recent reviews and studies on this topic (written for health professionals — your doctor can help put them in context):'
      : '';
  return [heading('What the research says'), intro, bullets(lines)].filter(Boolean).join('\n');
}

function questionsSection(questions: string[], title = 'Questions to ask your doctor'): string | null {
  const unique = [...new Set(questions)].slice(0, 4);
  return unique.length > 0 ? `${heading(title)}\n${bullets(unique)}` : null;
}

function limitedEvidenceNote(bundle: EvidenceBundle): string | null {
  if (bundle.offline) return 'Live evidence lookups are turned off right now, so this answer uses BRIAN’s built-in guidance.';
  if (bundle.sources.size === 0 && bundle.failures.length > 0) {
    return "I couldn't reach the medical reference services just now, so this answer uses BRIAN's built-in guidance. Try again in a moment for cited details.";
  }
  return null;
}

// ── Emergency / urgent ───────────────────────────────────────────────────────

function triageAnswer(input: ChatInput, bundle: EvidenceBundle): string[] {
  const triage = bundle.triage.triage!;
  const category = bundle.triage.categories[0] as TriageCategory;
  const info = CATEGORY_INFO[category];
  const refId = bundle.triageSourceIds[0] ?? bundle.topics[0]?.sourceId ?? null;
  const blocks: string[] = [];

  if (category === 'suicide') {
    blocks.push(heading("You're not alone — help is available right now"));
    blocks.push("Thank you for telling me. What you're feeling matters, and you deserve support right now.");
    blocks.push(
      bullets([
        '**Call or text 988** (Suicide & Crisis Lifeline) — free, confidential and open 24/7. You can also chat at 988lifeline.org.',
        'If you might act on these thoughts soon, **call 911** or go to the nearest emergency room.',
      ]),
    );
    blocks.push(
      `${heading('Right now, you can')}\n${numbered([
        'Put some distance between yourself and anything you could use to hurt yourself.',
        'Reach out to someone you trust — a friend, family member, or faith leader — and tell them how you feel, or ask them to stay with you.',
        'Focus on getting through the next few minutes and hours. Feelings this intense can ease with support.',
      ])}${cite(refId)}`,
    );
    blocks.push("If you're worried about someone else: stay with them, ask them directly whether they're thinking about suicide, and call or text 988 together.");
    if (bundle.triage.categories.includes('overdose')) {
      blocks.push(`If any pills or other substances have been taken, **call 911 now** — Poison Help (1-800-222-1222) can also advise.${cite(bundle.triageSourceIds[1])}`);
    }
    blocks.push('Your doctor can help too, when you feel ready — you can message them any time from the Care tab.');
    return blocks;
  }

  blocks.push(heading(triage.title));
  const lead = triage.level === 'emergency' ? `**${firstSentence(triage.message)}**` : firstSentence(triage.message);
  blocks.push(`${lead}${info.citeLead === false ? '' : cite(refId)}`);
  blocks.push(`${heading(triage.level === 'emergency' ? 'What to do right now' : 'What to do now')}\n${numbered(info.steps)}`);
  if (info.signs) blocks.push(`${heading(info.signs.heading)}\n${bullets(info.signs.items)}${cite(refId)}`);

  // Extra context for the patient's own situation.
  const meds = input.patient?.medications ?? [];
  if (category === 'anaphylaxis' && meds.some((rx) => lookupDrug(rx.drugName)?.classes.includes('ace-inhibitor'))) {
    const aceName = meds.find((rx) => lookupDrug(rx.drugName)?.classes.includes('ace-inhibitor'))!.drugName;
    blocks.push(
      `Because you take **${aceName}**, tell the 911 team and the ER. Swelling of the face, lips, tongue or throat (angioedema) is a known, serious reaction to ACE inhibitors and can happen even after years of use.`,
    );
  }
  if ((category === 'low-sugar' || category === 'high-sugar') && input.patient?.conditions.some((c) => /diabet/i.test(c))) {
    blocks.push('Because you have diabetes, keep a log of these readings and share it with your doctor — your treatment plan may need adjusting.');
  }
  if (triage.level === 'urgent') {
    const onMeds = (input.patient?.medications ?? []).filter((rx) => rx.status === 'active' && !rx.selfReported);
    if (onMeds.length > 0 && ['bp-crisis', 'low-sugar', 'high-sugar', 'fainting', 'extra-dose'].includes(category)) {
      blocks.push(`Have your medicine list handy when you call: ${listJoin(onMeds.map((rx) => `${rx.drugName} ${rx.strength}`))}.`);
    }
    const learn = bundle.topics[0];
    if (learn) blocks.push(`Learn more: **${learn.topic.title}** on MedlinePlus.${cite(learn.sourceId)}`);
    const q = questionsSection(info.questions ?? []);
    if (q) blocks.push(q);
  }
  if (triage.level === 'emergency') {
    blocks.push("Please don't wait for more information here — get help first. You can come back to BRIAN afterward with questions.");
  }
  return blocks;
}

function firstSentence(text: string): string {
  return splitSentences(text)[0] ?? text;
}

// ── Visit notes ──────────────────────────────────────────────────────────────

type MedAction = 'start' | 'continue' | 'stop' | 'increase' | 'decrease' | 'as-needed' | 'mentioned';

function classifyAction(sentence: string, drugIndex: number): MedAction {
  const before = sentence.slice(0, drugIndex).toLowerCase();
  const all = sentence.toLowerCase();
  if (/\b(start|begin|initiate|add|new rx|trial of)\b/.test(before) || /→\s*start/.test(all)) return 'start';
  if (/\b(stop|d\/c|discontinue|hold|off)\b/.test(before)) return 'stop';
  if (/\b(increase|incr|↑|titrate up|raise|uptitrate)\b/.test(before)) return 'increase';
  if (/\b(decrease|decr|↓|reduce|lower|taper)\b/.test(before)) return 'decrease';
  if (/\b(cont|continue|continuing|remain on|stay on|on)\b/.test(before)) return 'continue';
  if (/\b(prn|as needed)\b/i.test(all)) return 'as-needed';
  return 'mentioned';
}

const ACTION_LABEL: Record<MedAction, string> = {
  start: 'New',
  continue: 'Keep taking',
  stop: 'Stop (as your doctor advised)',
  increase: 'Dose going up',
  decrease: 'Dose going down',
  'as-needed': 'Use when needed',
  mentioned: 'Mentioned',
};

function noteSentences(body: string): string[] {
  return body
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/))
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter((s) => s.length > 1);
}

function noteAnswer(input: ChatInput, bundle: EvidenceBundle, noteBody: string, noteTitle: string | null): string[] {
  const blocks: string[] = [];
  const sentences = noteSentences(noteBody);
  if (input.role === 'doctor') {
    blocks.push(`Plain-language version of ${noteTitle ? `**"${noteTitle}"**` : 'this note'}, line by line — handy for sharing with the patient.`);
  } else {
    blocks.push(noteTitle ? `Here's your visit note **"${noteTitle}"** in plain language, line by line.` : `Here's your visit note in plain language, line by line.`);
  }

  const lines = sentences.map((sentence) => {
    const plain = toPlainLanguage(sentence);
    const same = plain.replace(/\W/g, '').toLowerCase() === sentence.replace(/\W/g, '').toLowerCase();
    return same ? `**"${sentence}"** — ${endWithPeriod(plain)}` : `**"${sentence}"** → ${endWithPeriod(plain)}`;
  });
  const clinician = input.role === 'doctor';
  blocks.push(`${heading(clinician ? 'What the note says → plain language' : 'What your doctor wrote → what it means')}\n${bullets(lines)}`);

  // Medicine plan.
  const medNames = (input.patient?.medications ?? []).map((rx) => rx.drugName);
  const plan: string[] = [];
  const seen = new Set<string>();
  for (const sentence of sentences) {
    for (const mention of findDrugMentions(sentence, medNames)) {
      if (seen.has(mention.name)) continue;
      seen.add(mention.name);
      const action = classifyAction(sentence, mention.index);
      const fragment = sentence.slice(mention.index).split(/[.;]|→|,\s*(?=[A-Z])/)[0] ?? mention.matched;
      const how = toPlainLanguage(fragment).replace(/\.$/, '');
      const drug = bundle.drugs.find((d) => d.name === mention.name);
      const cls = classDescription(mention.name, drug?.label?.pharmClasses ?? []);
      const clsText = cls ? ` It's ${article(cls)} ${cls}.` : '';
      const sourceId = drug ? bundle.medlineSource(drug) : null;
      plan.push(`**${ACTION_LABEL[action]}:** ${how}.${clsText}${cite(sourceId)}`);
    }
  }
  if (plan.length > 0) {
    blocks.push(
      clinician
        ? `${heading('Medicine plan')}\n${bullets(plan)}`
        : `${heading('Your medicine plan')}\n${bullets(plan)}\n\nTake your medicines exactly as your doctor and your prescription label say. If anything here doesn't match your pill bottles, ask your pharmacist or doctor.`,
    );
  }

  // Next steps.
  const nextSteps = sentences
    .filter((s) => /\b(recheck|repeat|labs?|blood work|f\/u|follow[- ]?up|rtc|return|refer\w*|schedule|appointment|in \d)/i.test(s))
    .filter((s) => !findDrugMentions(s, medNames).length || /\b(recheck|labs?|rtc|return)\b/i.test(s))
    .filter((s, i) => i > 0 || !/^f\/u\b/i.test(s))
    .map((s) => endWithPeriod(toPlainLanguage(s)));
  const counseling = sentences.filter((s) => /\b(counsel\w*|discussed|advised|educated|reviewed)\b/i.test(s)).map((s) => endWithPeriod(toPlainLanguage(s)));
  const stepItems = [...nextSteps, ...counseling.map((c) => `You talked about: ${c.replace(/^Patient counseled about /i, '').replace(/^\w/, (ch) => ch.toLowerCase())}`)];
  if (stepItems.length > 0) blocks.push(`${heading('Next steps')}\n${bullets([...new Set(stepItems)])}`);

  // Words to know.
  const terms = keyTerms(noteBody, 12).filter((t) => ['lab', 'drug-class', 'test'].includes(t.kind) || (t.kind === 'jargon' && t.term !== 'well controlled'));
  if (terms.length > 0) {
    const termLines = terms.slice(0, 6).map((entry: GlossaryEntry) => {
      const lab = LAB_SOURCES[entry.term];
      const id = lab ? bundle.sources.add(lab) : null;
      return `**${entry.term}:** ${entry.definition}${cite(id)}`;
    });
    blocks.push(`${heading('Words to know')}\n${bullets(termLines)}`);
  }

  // Learn more.
  const learn = bundle.topics.slice(0, 4).map(({ topic, sourceId }) => {
    const title = topic.title.toLowerCase();
    const key = title.split(/\s+/).find((w) => w.length > 3 && !['high', 'type', 'what', 'about'].includes(w)) ?? '';
    const paragraphs = topic.blocks.filter((b) => b.kind === 'paragraph').map((b) => b.text);
    const paragraph =
      paragraphs.find((p) => p.toLowerCase().includes(title)) ??
      paragraphs.find((p) => key && p.toLowerCase().includes(key.replace(/s$/, ''))) ??
      paragraphs[0] ??
      topic.snippet;
    return `**${topic.title}:** ${takeSentences(paragraph, 240, 2)}${cite(sourceId)}`;
  });
  if (learn.length > 0) blocks.push(`${heading('Learn more (MedlinePlus)')}\n${bullets(learn)}`);
  if (bundle.sources.size === 0 || learn.length === 0) {
    const id = bundle.sources.add(MEDICAL_WORDS);
    blocks.push(`Want to decode more medical words? MedlinePlus has a free tutorial on how medical terms are built.${cite(id)}`);
  }

  // Questions.
  const questions: string[] = [];
  const started = plan.find((p) => p.startsWith('**New:**'));
  if (started) {
    const drugName = findDrugMentions(started)[0]?.name;
    if (drugName) {
      questions.push(`What side effects of ${drugName} should I watch for, and when should I call you?`);
      if (lookupDrug(drugName)?.classes.includes('statin')) questions.push(`If I get muscle aches on ${drugName}, what should I do?`);
    }
  }
  if (/\b(labs?|lipids|cmp|bmp|cbc|a1c|recheck)\b/i.test(noteBody)) questions.push('Do I need to fast before my blood tests, and where should I get them done?');
  const goals = [/\ba1c\b/i.test(noteBody) ? 'A1c' : null, /\b(bp|htn|blood pressure)\b/i.test(noteBody) ? 'blood pressure' : null, /\b(ldl|lipids?)\b/i.test(noteBody) && !/\ba1c\b/i.test(noteBody) ? 'cholesterol' : null].filter(
    (g): g is string => g !== null,
  );
  if (goals.length > 0) questions.push(`What ${listJoin(goals)} ${goals.length > 1 ? 'goals are' : 'goal is'} right for me?`);
  questions.push('Is there anything I should change in my diet or activity before my next visit?');
  const q = questionsSection(questions);
  if (q && !clinician) blocks.push(q);
  return blocks;
}

// ── Medicines ────────────────────────────────────────────────────────────────

function labelKind(drug: DrugEvidence): string {
  return drug.label?.productType?.includes('OTC') ? 'Drug Facts label' : 'prescription label';
}

function medicationAnswer(input: ChatInput, bundle: EvidenceBundle): string[] {
  const blocks: string[] = [];
  const asked = bundle.drugs.filter((d) => d.role === 'asked');
  const patientMeds = bundle.drugs.filter((d) => d.role === 'patient-med');
  const aspect = detectAspect(input.message, true);
  const comboQuestion = asked.length >= 2 || (aspect === 'interactions' && patientMeds.length > 0);
  const isClinician = input.role === 'doctor';

  // Short answer.
  const shortAnswer: string[] = [];
  for (const allergy of bundle.allergyWarnings) {
    shortAnswer.push(
      `**Talk to your doctor or pharmacist before taking ${allergy.drug}.** ${allergy.reason} Make sure whoever prescribed it knows about your ${allergy.allergy.toLowerCase()} allergy — they may choose a different medicine.`,
    );
  }
  const relevantInteractions = bundle.interactions.filter(
    (f) => asked.some((d) => d.name === f.labelDrug || d.name === f.otherDrug),
  );
  if (relevantInteractions.length > 0) {
    const first = relevantInteractions[0]!;
    const askedName = asked[0]?.name ?? first.otherDrug;
    const otherName = askedName === first.labelDrug ? first.otherDrug : first.labelDrug;
    const otherIsPatientMed = patientMeds.some((m) => m.name === otherName) || asked.some((d) => d.name === otherName && d.prescription);
    const effect = plainLabel(first.text.replace(/^[^:]{2,60}:\s*/, '')).replace(/\.$/, '');
    const via = first.viaClass ? `${first.via}, the group of medicines ${first.otherDrug} belongs to` : first.via;
    shortAnswer.push(
      `**Check with your doctor or pharmacist before taking ${askedName} with ${otherName}${otherIsPatientMed && !asked.some((d) => d.name === otherName) ? ' (which is on your medicine list)' : ''}.** The FDA label for ${first.labelDrug} warns about taking it with ${via}: ${effect.charAt(0).toLowerCase()}${effect.slice(1)}.${cite(first.sourceId)}`,
    );
  } else if (comboQuestion) {
    const labelled = asked.filter((d) => d.label);
    const checkedAgainst = asked.length >= 2 ? asked.slice(1) : patientMeds;
    if (labelled.length === asked.length && asked.length > 0) {
      const ids = [...asked, ...checkedAgainst].map((d) => (d.label ? bundle.labelSource(d) : null)).filter(Boolean);
      const others = listJoin(checkedAgainst.map((d) => d.name));
      shortAnswer.push(
        `The FDA labels I checked don't list an interaction between ${asked[0]!.name} and ${asked.length >= 2 ? others : `your other medicines (${others})`}. That's reassuring but not a guarantee — your pharmacist can check your complete medicine list, including supplements.${[...new Set(ids)].map(cite).join('')}`,
      );
    } else if (asked.length > 0) {
      const pairs = (asked.length >= 2 ? [[asked[0]!, asked[1]!]] : patientMeds.map((m) => [asked[0]!, m])) as Array<[DrugEvidence, DrugEvidence]>;
      const known = pairs
        .map(([x, y]) => ({ x, y, effect: knownInteraction(x.name, y.name) }))
        .find((k) => k.effect !== null);
      if (known?.effect) {
        shortAnswer.push(
          `**Check with your doctor or pharmacist before taking ${known.x.name} with ${known.y.name}.** ${known.effect} (This is BRIAN's built-in check — I couldn't load the FDA labels just now.)`,
        );
      } else {
        shortAnswer.push(
          `I couldn't load the FDA labels needed to check this combination. Please ask your pharmacist before combining ${listJoin(pairs.flat().map((d) => d.name).filter((n, i, all) => all.indexOf(n) === i))}.`,
        );
      }
    }
  }
  if (bundle.conditionWarnings.length > 0) {
    const byDrug = new Map<string, { conditions: string[]; sourceId: string }>();
    for (const w of bundle.conditionWarnings) {
      const entry = byDrug.get(w.drug) ?? { conditions: [], sourceId: w.sourceId };
      if (!entry.conditions.includes(w.plainCondition)) entry.conditions.push(w.plainCondition);
      byDrug.set(w.drug, entry);
    }
    for (const [drug, entry] of byDrug) {
      shortAnswer.push(
        `The ${drug} label also says to ask a doctor first if you have **${listJoin(entry.conditions)}** — ${entry.conditions.length > 1 ? 'both are' : 'this is'} on your health record.${cite(entry.sourceId)}`,
      );
    }
  }
  if (shortAnswer.length > 0) blocks.push(`${heading(isClinician ? 'Bottom line' : 'Short answer')}\n${shortAnswer.join('\n\n')}`);

  // Label details per interaction / condition.
  const labelLines: string[] = [];
  for (const f of relevantInteractions.slice(0, 3)) {
    labelLines.push(`**${titleCase(f.labelDrug)} (${labelKind(bundle.drugs.find((d) => d.name === f.labelDrug)!)}):** ${endWithPeriod(isClinician ? f.text : plainLabel(f.text))}${cite(f.sourceId)}`);
  }
  for (const w of bundle.conditionWarnings.slice(0, 2)) {
    const line = `**${titleCase(w.drug)} (${labelKind(bundle.drugs.find((d) => d.name === w.drug)!)}):** ${endWithPeriod(isClinician ? w.text : plainLabel(w.text))}${cite(w.sourceId)}`;
    if (!labelLines.includes(line)) labelLines.push(line);
  }
  if (labelLines.length > 0) blocks.push(`${heading('What the FDA labels say')}\n${bullets(labelLines)}`);

  // Per-drug facts.
  for (const drug of asked.slice(0, comboQuestion ? 2 : 1)) {
    const facts: string[] = [];
    if (comboQuestion && drug.prescription && !isClinician) {
      blocks.push(
        `${heading(`Your ${drug.name}`)}\nYou already take this: ${describePrescription(drug.prescription)} Keep taking it as prescribed unless your doctor tells you otherwise.${cite(bundle.medlineSource(drug))}`,
      );
      continue;
    }
    const labelId = bundle.labelSource(drug);
    const medlineId = bundle.medlineSource(drug);
    const otcLabel = drug.label?.productType?.includes('OTC') ?? false;
    const summary = drug.medline?.summary ?? '';
    // For over-the-counter questions, lead with MedlinePlus's "Nonprescription …" sentence.
    const otcStart = otcLabel ? summary.search(/\bNonprescription\b/) : -1;
    const about = summary ? takeSentences(otcStart > 0 ? summary.slice(otcStart) : summary, 520, 4) : null;
    const lines: string[] = [];
    if (about) lines.push(`${about}${cite(medlineId)}`);
    else {
      const cls = classDescription(drug.name, drug.label?.pharmClasses ?? []);
      if (cls) lines.push(`${drug.displayName} is ${article(cls)} ${cls}.`);
    }
    if (drug.label) {
      const uses = summaryToText(summarizeSection(drug.label.sections.indications ?? drug.label.sections.purpose, 320, 4), { plain: !isClinician });
      if (uses && (!about || isClinician)) facts.push(`**Used for:** ${uses}${cite(labelId)}`);
      const allergic = bundle.allergyWarnings.some((a) => a.drug === drug.name);
      const wantsDosing = !allergic && (aspect === 'dosing' || !comboQuestion);
      if (wantsDosing) {
        const dosing = summaryToText(summarizeSection(drug.label.sections.dosage, 380, 5), { plain: !isClinician });
        if (dosing) facts.push(`**How it's usually taken (label):** ${dosing}${cite(labelId)}`);
      }
      if (drug.prescription) {
        facts.push(`**Your prescription:** ${describePrescription(drug.prescription)} Always follow your own prescription label — it's tailored to you.`);
      }
      const boxed = summarizeBoxedWarning(drug.label.sections.boxedWarning);
      if (boxed) facts.push(`**Boxed warning${boxed.title ? ` (${boxed.title.toLowerCase()})` : ''}:** ${isClinician ? boxed.text : plainLabel(boxed.text)}${cite(labelId)}`);
      const otc = otcWarningHighlights(drug.label.sections.warnings, 3);
      if (otc.length > 0) facts.push(`**Key warnings:** ${otc.map((w) => endWithPeriod(isClinician ? w : plainLabel(w))).join(' ')}${cite(labelId)}`);
      else {
        const warn = summarizeSection(drug.label.sections.warningsAndCautions ?? drug.label.sections.warnings, 360, 4);
        const warnText = summaryToText(warn, { plain: !isClinician });
        if (warnText && !comboQuestion) facts.push(`**Key warnings:** ${warnText}${cite(labelId)}`);
      }
      if (!comboQuestion || aspect === 'safety') {
        const side = summarizeSection(drug.label.sections.adverseReactions ?? drug.label.sections.stopUse, 300, 4);
        const sideText = (!isClinician ? commonSideEffects(drug.label.sections.adverseReactions) : null) ?? summaryToText(side, { plain: !isClinician });
        if (sideText) facts.push(`**${drug.label.sections.adverseReactions ? 'Common side effects' : 'Stop and ask a doctor if'}:** ${sideText}${cite(labelId)}`);
      }
      if (!comboQuestion && relevantInteractions.length === 0) {
        const table = interactionItems(drug.label.sections.interactions, 3);
        const inter =
          table.length > 0
            ? table
            : summaryToLines(summarizeSection(drug.label.sections.interactions ?? drug.label.sections.askDoctorOrPharmacist, 320, 4), { plain: !isClinician });
        if (inter.length > 0) facts.push(`**Interactions listed on the label:** ${inter.map((i) => i.replace(/\.$/, '')).join('; ')}.${cite(labelId)}`);
      }
    } else if (!bundle.offline) {
      facts.push(`I couldn't find an FDA label for ${drug.displayName} just now${lookupDrug(drug.name)?.classes.includes('supplement') ? ' (supplements usually don’t have FDA drug labels)' : ''}.`);
    }
    const title = comboQuestion ? `About ${drug.displayName.toLowerCase()}` : `${drug.displayName} at a glance`;
    blocks.push([heading(title), ...lines, facts.length > 0 ? bullets(facts) : ''].filter(Boolean).join('\n'));
  }

  // Offline fallback for drugs.
  if (bundle.offline || asked.every((d) => !d.label && !d.medline)) {
    const names2 = asked.length > 0 ? asked.map((d) => d.name) : findDrugMentions(input.message).map((m) => m.name);
    const refs = names2.slice(0, 2).map((n) => cite(bundle.sources.add(dailyMedSearch(n)))).join('');
    const home = cite(bundle.sources.add(DRUG_INFO_HOME));
    blocks.push(
      `You can read the full FDA label on DailyMed and plain-language drug guides on MedlinePlus.${refs}${home} Your pharmacist can also check this for you in a minute or two — it's free.`,
    );
  }

  if (!isClinician) {
    const r = researchSection(bundle, 2);
    if (r) blocks.push(r);
  }

  const questions: string[] = [];
  if (comboQuestion && asked.length >= 1) {
    const otherDrug = asked[1] ?? bundle.drugs.find((d) => relevantInteractions.some((f) => f.labelDrug === d.name || f.otherDrug === d.name) && d !== asked[0]);
    const onIt = Boolean(otherDrug?.prescription);
    const context = bundle.conditionWarnings.length > 0 ? ', given my health conditions' : '';
    questions.push(
      otherDrug
        ? `Is it safe for me to take ${asked[0]!.name} ${onIt ? "while I'm on" : 'with'} ${otherDrug.name}${context}?`
        : `Is ${asked[0]!.name} safe with the other medicines I take?`,
    );
    if (asked.some((d) => d.classes.includes('nsaid'))) questions.push('Is there a pain reliever that is a better fit with my medicines and health conditions?');
    questions.push('If I do take it, what dose and for how long — and what side effects should make me stop and call you?');
  } else if (bundle.allergyWarnings[0]) {
    const a = bundle.allergyWarnings[0];
    questions.push(`Is ${a.drug} safe for me with my ${a.allergy.toLowerCase()} allergy, or is there a better choice?`);
    questions.push(`Should I be tested to find out whether I'm truly allergic to ${a.allergy.toLowerCase()}?`);
    questions.push('What reactions should I watch for, and when should I get emergency help?');
  } else if (asked[0]) {
    const name = asked[0].displayName.toLowerCase();
    questions.push(`What should I do if I miss a dose of ${name}?`);
    questions.push(`Which side effects of ${name} are serious enough to call you about?`);
    questions.push(`Does ${name} interact with any of my other medicines, foods or supplements?`);
  }
  const q = isClinician ? null : questionsSection(questions, 'Questions to ask your pharmacist or doctor');
  if (q) blocks.push(q);
  return blocks;
}

// ── Topics (general / symptoms / lesson) ────────────────────────────────────

const SIG_FREQUENCY: Record<string, RegExp> = {
  BID: /twice|two times|2 times|bid/i,
  TID: /three times|3 times|tid/i,
  QID: /four times|4 times|qid/i,
  qd: /once (a )?dai?ly|once a day|every day|daily/i,
  qhs: /bedtime|at night/i,
  PRN: /as needed|when needed|prn/i,
};

function topicAnswer(input: ChatInput, bundle: EvidenceBundle): string[] {
  const blocks: string[] = [];
  const aspect = detectAspect(input.message, false);
  const infoCategory = bundle.triage.triage?.level === 'info' ? (bundle.triage.categories[0] as TriageCategory | undefined) : undefined;
  const refId = bundle.triageSourceIds[0] ?? bundle.topics[0]?.sourceId ?? null;

  if (infoCategory) {
    const info = CATEGORY_INFO[infoCategory];
    if (info.signs) {
      const supportId = bundle.topics[0]?.sourceId ?? refId;
      blocks.push(`${heading(info.signs.heading)}\n${bullets(info.signs.items)}${cite(supportId)}`);
      const action =
        infoCategory === 'suicide'
          ? 'If you or someone you know is struggling, call or text 988 any time — free and confidential.'
          : 'If you notice any of these signs — even if they go away — call 911 right away.';
      blocks.push(`**${action}**`);
    } else {
      blocks.push(`${heading(info.infoTitle)}\n${info.message}${cite(refId)}`);
    }
    if (infoCategory === 'stroke' || infoCategory === 'heart') {
      blocks.push(`${heading('If it happens')}\n${numbered(info.steps.slice(0, 3))}`);
    }
  }

  const detail = topicDetail(bundle, aspect);
  if (detail && detail.body) {
    blocks.push(`${heading(infoCategory ? `More about ${detail.title.toLowerCase()}` : detail.title)}\n${detail.body}`);
    const sectionIsSigns = infoCategory && CATEGORY_INFO[infoCategory].signs && /symptom|sign/i.test(detail.section?.heading ?? '');
    if (detail.section && !sectionIsSigns) blocks.push(`${heading(detail.section.heading)}\n${bullets(detail.section.items.map((i) => `${i}`))}${cite(detail.id)}`);
    const second = topicLead(bundle, 1, 260);
    if (second) blocks.push(`Related: **${second.title}** — ${second.text}${cite(second.id)}`);
  }

  // Terms the person asked about ("what does BID mean?").
  const terms = findGlossaryTerms(input.message)
    .map((m) => m.entry)
    .filter((entry, i, all) => all.indexOf(entry) === i)
    .slice(0, 5);
  if (terms.length > 0 && isGlossaryQuestion(input.message)) {
    const lab = terms.map((t) => LAB_SOURCES[t.term]).find(Boolean);
    const id = lab ? bundle.sources.add(lab) : bundle.sources.add(MEDICAL_WORDS);
    const extra: string[] = [];
    for (const term of terms.filter((t) => t.kind === 'sig')) {
      const key = SIG_FREQUENCY[term.term];
      const matching = (input.patient?.medications ?? []).filter((rx) => key && key.test(`${rx.frequency} ${rx.instructions}`));
      if (matching.length > 0) {
        extra.push(
          `In your medicine list, ${listJoin(matching.map((rx) => `**${rx.drugName} ${rx.strength}**`))} ${matching.length > 1 ? 'are' : 'is'} taken ${term.plain}${matching[0]!.times.length > 0 ? ` (${matching[0]!.times.join(' and ')})` : ''}.`,
        );
      } else {
        extra.push(`For example, "1 tablet PO ${term.term}" means take 1 tablet by mouth ${term.plain}.`);
      }
    }
    extra.push('Pharmacists are glad to explain any abbreviation on a prescription label — just ask at the counter.');
    blocks.unshift(`${heading('In plain words')}\n${bullets(terms.map((t) => `**${t.term}** — ${t.definition}`))}${cite(id)}\n\n${extra.join('\n\n')}`);
  }

  if (input.mode === 'symptoms' && !bundle.triage.triage) {
    blocks.push(
      `${heading('When to get care')}\n${bullets([
        '**Call 911** for chest pain, trouble breathing, signs of a stroke (face drooping, arm weakness, trouble speaking), fainting, or severe bleeding.',
        '**See a doctor today or go to urgent care** if symptoms are severe, getting worse, or come with a high fever.',
        '**Call your doctor** if symptoms last more than a few days, keep coming back, or worry you.',
      ])}`,
    );
  }

  if (!detail && !infoCategory && terms.length === 0) {
    const fallback = limitedEvidenceNote(bundle);
    blocks.push(
      fallback ??
        "I couldn't find a MedlinePlus summary that matches this question closely. Try naming the condition, symptom or medicine you're curious about (for example, \"high blood pressure\" or \"metformin side effects\").",
    );
  }

  const r = researchSection(bundle, input.role === 'doctor' ? 5 : 3, input.role === 'doctor');
  if (r) blocks.push(r);

  const detected = detectTopics(input.message)[0]?.key ?? null;
  const lessonTopic = input.lessonTitle && !/\?$/.test(input.lessonTitle) ? input.lessonTitle.toLowerCase() : null;
  const titleTopic = detail && !/\?$/.test(detail.title) ? detail.title.toLowerCase() : null;
  const topicName = detected ?? lessonTopic ?? titleTopic;
  const questions: string[] = [];
  if (input.mode === 'symptoms') {
    questions.push('What could be causing my symptoms, and do I need any tests?', 'What can I do at home, and which changes mean I should call you?');
  } else if (infoCategory === 'stroke' || infoCategory === 'heart') {
    const what = infoCategory === 'stroke' ? 'stroke' : 'a heart attack';
    questions.push(`What is my personal risk of ${what}, and how can I lower it?`);
    if (input.patient?.conditions.length) {
      questions.push(`How do my ${listJoin(input.patient.conditions.slice(0, 3).map((c) => c.toLowerCase()))} affect my risk?`);
    }
    questions.push('Which warning signs should my family know, and what should they do?');
  } else if (topicName) {
    questions.push(`What does this mean for me, given my health history?`);
    questions.push('What are the most important next steps for me?');
    const condition = input.patient?.conditions.find((c) => !detectTopics(c).some((t) => t.key === detected));
    if (condition && input.patient?.conditions.length) {
      questions.push(`Does my ${condition.toLowerCase()} change anything about this?`);
    }
  }
  const q = questionsSection(questions);
  if (q && input.role !== 'doctor') blocks.push(q);
  return blocks;
}

// ── Clinician evidence view ─────────────────────────────────────────────────

const TYPE_RANK: Record<string, number> = {
  Guideline: 0,
  'Meta-analysis': 1,
  'Systematic review': 2,
  'Consensus statement': 3,
  'Randomized trial': 4,
  Review: 5,
};

function clinicianEvidence(bundle: EvidenceBundle, max = 5): string | null {
  if (bundle.articles.length === 0) return null;
  const ordered = [...bundle.articles]
    .map((entry, index) => ({ ...entry, index, rank: TYPE_RANK[evidenceType(entry.article) ?? ''] ?? 6 }))
    .sort((a, b) => a.rank - b.rank || Number(b.article.year ?? 0) - Number(a.article.year ?? 0) || a.index - b.index)
    .slice(0, max);
  const lines = ordered.map(({ article, sourceId }) => {
    const meta = [evidenceType(article), article.journal, article.year].filter(Boolean).join(', ');
    const finding = keyFinding(article, 300);
    const detail = finding ? ` ${finding}` : '';
    return `**${article.title.replace(/\.$/, '')}** (${meta}).${detail}${cite(sourceId)}`;
  });
  return `${heading('Evidence summary')}\n${bullets(lines)}`;
}

function clinicianTopicAnswer(bundle: EvidenceBundle): string[] {
  const blocks: string[] = [];
  const evidence = clinicianEvidence(bundle);
  if (evidence) blocks.push(evidence);
  else blocks.push('No closely matching PubMed reviews were retrieved for this query. Try a more specific clinical question (population, intervention, outcome).');
  const lead = topicLead(bundle, 0, 220);
  if (lead) blocks.push(`${heading('Patient education')}\n- **${lead.title}** (MedlinePlus) — plain-language overview to share with patients.${cite(lead.id)}`);
  return blocks;
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function mockRespond(input: ChatInput, bundle: EvidenceBundle, options: MockOptions = {}): string {
  const blocks: string[] = [];
  const triage = bundle.triage.triage;
  const liveConcern = triage && triage.level !== 'info';

  if (liveConcern) blocks.push(...triageAnswer(input, bundle));

  const noteBody = input.note?.body ?? (looksLikeClinicalNote(input.message) ? input.message : null);
  const asked = bundle.drugs.filter((d) => d.role === 'asked');
  const emergency = triage?.level === 'emergency';

  if (!emergency) {
    if (noteBody && (input.mode === 'explain-note' || !input.note || looksLikeClinicalNote(input.message) || asked.length === 0)) {
      blocks.push(...noteAnswer(input, bundle, noteBody, input.note?.title ?? null));
    } else if (asked.length > 0) {
      blocks.push(...medicationAnswer(input, bundle));
      if (input.role === 'doctor') {
        const evidence = clinicianEvidence(bundle);
        if (evidence) blocks.push(evidence);
      }
    } else if (input.role === 'doctor' && !liveConcern) {
      blocks.push(...clinicianTopicAnswer(bundle));
    } else if (!liveConcern || bundle.topics.length > 0) {
      // An urgent answer already covers next steps and questions.
      if (!liveConcern) blocks.push(...topicAnswer(input, bundle));
    }
  }

  const limited = limitedEvidenceNote(bundle);
  if (limited && !blocks.some((b) => b.includes(limited))) blocks.push(limited);
  blocks.push(safetyLine(input));
  blocks.push(footer(options));
  return blocks.filter((b) => b.trim().length > 0).join('\n\n');
}

/** Short safe reply used when the LLM declines (refusal) — still triaged and cited. */
export function refusalFallbackReason(): string {
  return "BRIAN's AI model couldn't answer this one, so here is guidance from trusted sources instead.";
}

