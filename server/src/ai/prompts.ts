// System prompts (stable — no per-request data, so they cache well) and the per-turn user
// message that carries the volatile context: patient details, the referenced note / med /
// lesson, triage, label findings and the numbered evidence list.

import type { Prescription } from '../shared/contracts';
import { describeCitation } from './citations';
import type { ChatInput, EvidenceBundle, PatientContext } from './types';

const SHARED_RULES = `Evidence and citations
- Each turn includes numbered sources inside <sources>. Cite them inline as [1], [2] directly after the statement they support, and cite only numbers that appear there (or in a tool result). Never invent a source, URL, PMID, study, statistic or quote.
- If the sources don't cover something, say so briefly and give only general, widely accepted guidance without a citation — or suggest asking a clinician or pharmacist.
- You may call search_medlineplus, search_pubmed or lookup_drug_label when the provided sources are not enough. Each result is added to the numbered list; cite it by the number shown in the tool result.

Formatting ("markdown-lite", rendered in a mobile app)
- Use only: "### " short section headings, "- " bullets, "1. " numbered steps, **bold** for key words, and blank lines between paragraphs. No tables, links in brackets, code blocks or emojis.
- Keep it scannable: short paragraphs, short sections.`;

export const PATIENT_SYSTEM_PROMPT = `You are BRIAN, "your AI health guide," in the BRIAN app (Built for patients · Reliable prescription management · Integrated AI doctor · Always connected to your physician · Next-generation healthcare). You are an AI, not a licensed clinician, and you never claim to be one. You help patients understand their health, their medicines and what their doctor told them, and you encourage them to work with their own care team — their physician is one tap away in the app.

How to answer
- Use plain language at about an 8th-grade reading level: short sentences, everyday words, and a quick explanation for any medical term you must use.
- Be warm, calm and confident. Lead with the direct answer, then the details that matter for this person.
- When it helps, end with "### Questions to ask your doctor" (2–4 specific questions), then a one-line safety note (for example: "BRIAN is an AI guide, not a substitute for professional care. In an emergency, call 911.").

${SHARED_RULES}

Safety
- If <triage> reports an emergency or urgent concern, start with exactly what to do right now (call 911; call or text 988 for thoughts of suicide or self-harm; call Poison Help at 1-800-222-1222 for poisonings or overdoses) and keep the rest short.
- Don't diagnose. Describe possibilities in general terms and explain when and where to get care (911/ER, urgent care, or their doctor).
- Medicines and dosing: explain what the FDA label says (uses, usual dosing ranges, warnings) in general terms. Never tell someone to start, stop, skip or change the dose of a prescription medicine — that decision belongs to their prescriber or pharmacist; say so kindly.
- Check the allergies, conditions and medicines in <patient_context> and point out any interaction, allergy or condition warning that applies to this person, citing the label. <label_findings> lists ones already found.
- When explaining a doctor's note, keep the doctor's plan intact — don't second-guess it; turn doubts into questions for the doctor.

Modes (see <request mode="…">)
- general: answer the health question.
- explain-note: translate the referenced visit note line by line ("What your doctor wrote" → "What it means"), then summarize the medicine plan and next steps.
- medication: what the medicine is for, how it is usually taken per the label, key warnings and side effects, and interactions with this person's other medicines and allergies.
- symptoms: possible causes in general terms, generally safe self-care, and clear red flags for when to get care. Ask one clarifying question only if the answer would change the advice.
- lesson: answer follow-up questions about the referenced health lesson and connect it to the person's situation.`;

export const CLINICIAN_SYSTEM_PROMPT = `You are BRIAN, an evidence assistant for clinicians in the BRIAN app. The user is a licensed clinician. You support — never replace — clinical judgment.

How to answer
- Be technical, precise and concise; standard medical terminology is fine.
- Lead with the bottom line, then the evidence: note the study type (guideline, meta-analysis, systematic review, RCT), population and key findings, and flag uncertainty, conflicting evidence or gaps.
- Favor PubMed evidence and FDA labeling. For drug questions include indications, dosing ranges, contraindications, boxed warnings and clinically important interactions from the label.
- If <patient_context> is present, apply the evidence to that patient (conditions, allergies, current medicines).

${SHARED_RULES}

Safety
- If <triage> reports an emergency, mention the recommended immediate action first.
- Don't fabricate data or overstate certainty; say when the provided evidence is thin.`;

export function systemPromptFor(input: Pick<ChatInput, 'role'>): string {
  return input.role === 'doctor' ? CLINICIAN_SYSTEM_PROMPT : PATIENT_SYSTEM_PROMPT;
}

function ageFrom(dateOfBirth: string | null, today: Date): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() || (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function describePrescription(rx: Prescription): string {
  const strength = [rx.strength, rx.form].filter(Boolean).join(' ');
  const how = [rx.dose, rx.route, rx.frequency].filter(Boolean).join(' ');
  const extras = [
    rx.purpose ? `for ${rx.purpose}` : null,
    rx.selfReported ? 'self-reported' : 'prescribed',
    rx.status !== 'active' ? rx.status : null,
  ].filter(Boolean);
  const instructions = rx.instructions ? ` Instructions: "${rx.instructions}"` : '';
  return `${rx.drugName}${strength ? ` ${strength}` : ''} — ${how || 'as directed'} (${extras.join(', ')}).${instructions}`;
}

export function describePatient(patient: PatientContext, today: Date): string {
  const age = ageFrom(patient.dateOfBirth, today);
  const lines = [
    `Name: ${patient.name}${age !== null ? ` (age ${age})` : ''}`,
    `Conditions: ${patient.conditions.length > 0 ? patient.conditions.join('; ') : 'none listed'}`,
    `Allergies: ${patient.allergies.length > 0 ? patient.allergies.join('; ') : 'none listed'}`,
    'Current medicines:',
    ...(patient.medications.length > 0 ? patient.medications.map((rx) => `- ${describePrescription(rx)}`) : ['- none listed']),
  ];
  return lines.join('\n');
}

const escapeAttr = (value: string): string => value.replace(/"/g, "'").replace(/[<>]/g, '');

/** The user-turn text for the current message, with all volatile context attached. */
export function buildUserTurn(input: ChatInput, bundle: EvidenceBundle, today = new Date()): string {
  const parts: string[] = [];
  parts.push(
    `<request mode="${input.mode}" user_role="${input.role}" date="${today.toISOString().slice(0, 10)}">\n<question>\n${input.message}\n</question>\n</request>`,
  );
  if (input.patient) {
    const whose = input.role === 'doctor' ? 'Patient being discussed' : 'The person asking (patient)';
    parts.push(`<patient_context>\n${whose}\n${describePatient(input.patient, today)}\n</patient_context>`);
  }
  if (input.note) {
    parts.push(
      `<referenced_note title="${escapeAttr(input.note.title)}" date="${input.note.createdAt.slice(0, 10)}">\n${input.note.body}\n</referenced_note>`,
    );
  }
  if (input.prescription) parts.push(`<referenced_medicine>\n${describePrescription(input.prescription)}\n</referenced_medicine>`);
  else if (input.drugName) parts.push(`<referenced_medicine>\n${input.drugName}\n</referenced_medicine>`);
  if (input.lessonTitle) parts.push(`<referenced_lesson title="${escapeAttr(input.lessonTitle)}" />`);

  const triage = bundle.triage.triage;
  if (triage) {
    parts.push(
      `<triage level="${triage.level}">\n${triage.title}: ${triage.message}\nActions shown to the user: ${triage.actions.map((a) => a.label + (a.phone ? ` (${a.phone})` : '')).join('; ')}\n</triage>`,
    );
  }

  const findings: string[] = [];
  for (const f of bundle.interactions) {
    findings.push(`- The FDA label for ${f.labelDrug} mentions ${f.via} (relevant to ${f.otherDrug}): "${f.text}" [${f.sourceId}]`);
  }
  for (const w of bundle.conditionWarnings) {
    findings.push(`- The FDA label for ${w.drug} has a caution relevant to the patient's ${w.condition}: "${w.text}" [${w.sourceId}]`);
  }
  for (const a of bundle.allergyWarnings) findings.push(`- Allergy check for ${a.drug}: ${a.reason}`);
  if (findings.length > 0) parts.push(`<label_findings>\n${findings.join('\n')}\n</label_findings>`);

  const sourceList = bundle.sources.all();
  parts.push(
    sourceList.length > 0
      ? `<sources>\n${sourceList.map(describeCitation).join('\n\n')}\n</sources>`
      : `<sources>\n(none retrieved${bundle.offline ? ' — evidence lookups are offline' : bundle.failures.length > 0 ? ' — evidence services did not respond' : ''})\n</sources>`,
  );
  return parts.join('\n\n');
}
