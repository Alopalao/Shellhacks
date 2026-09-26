// Role-aware configuration for the AI chat: persona copy, modes, suggested prompts, progress stages.
// Patient = "BRIAN AI" (plain-language health guide); doctor = "Evidence AI" (clinical literature assistant).
import type { IoniconName } from '@/components/ui';
import type { AiMode, EvidenceSource, Role } from '@/lib/contracts';
import type { TabBadgeKey } from '@/lib/tab-badges';

export interface AiModeOption {
  mode: AiMode;
  /** Chip label. */
  label: string;
  icon: IoniconName;
  /** Composer placeholder while this mode is selected. Keep it to one line on a 375 px phone (~30 characters). */
  placeholder: string;
  /** Screen-reader hint for the chip. */
  description: string;
  /** Suggested prompts shown in the empty state (3–4). */
  prompts: readonly string[];
}

export interface AiPersona {
  role: Role;
  /** Header title ("BRIAN AI"). */
  title: string;
  /** Header subtitle ("Your AI health guide"). */
  subtitle: string;
  /** Name shown above each assistant answer. */
  assistantName: string;
  /** Mode chips always visible, in order. The first one is the default. */
  modes: readonly AiModeOption[];
  /** Modes reachable only by deep link; their chip appears while selected. */
  extraModes: readonly AiModeOption[];
  /** Empty-state heading. */
  welcomeTitle: string;
  welcomeText: string;
  /** Trust panel copy (empty state). */
  trustText: string;
  /** Short note under every answer. */
  answerDisclaimer: string;
  /** Tiny line under the composer. */
  composerNote: string;
  /** Tab root and history routes. */
  chatHref: '/patient/ai' | '/doctor/ai';
  historyHref: '/patient/ai/history' | '/doctor/ai/history';
  tabBadgeKey: TabBadgeKey;
  /** Whether the "attach a visit note" picker is available (patients only: GET /api/notes returns their own). */
  canPickNotes: boolean;
}

// ───────────────────────── Patient ─────────────────────────

const PATIENT_MODES: readonly AiModeOption[] = [
  {
    mode: 'general',
    label: 'General',
    icon: 'sparkles-outline',
    placeholder: 'Ask BRIAN a health question…',
    description: 'General health questions',
    prompts: [
      'How can I lower my blood pressure with everyday habits?',
      'What does an A1c number mean?',
      'What should I ask my doctor at my next visit?',
      'How much physical activity do adults need each week?',
    ],
  },
  {
    mode: 'explain-note',
    label: "Explain my doctor's note",
    icon: 'document-text-outline',
    placeholder: 'Ask about your visit note…',
    description: "Plain-language explanation of your doctor's visit note",
    prompts: [
      'Explain my visit note in plain language.',
      'What do the abbreviations in my note mean?',
      'What are the next steps my doctor wants me to take?',
      'What questions should I ask about this note?',
    ],
  },
  {
    mode: 'medication',
    label: 'Medications & dosing',
    icon: 'medkit-outline',
    placeholder: 'Ask about a medicine or dose…',
    description: 'Questions about medicines, dosing and side effects, based on FDA labels',
    prompts: [
      'What should I do if I miss a dose?',
      'What are common side effects of statins?',
      'Can I take ibuprofen with my blood pressure medicine?',
      'Should I take metformin with food?',
    ],
  },
  {
    mode: 'symptoms',
    label: 'Symptoms',
    icon: 'pulse-outline',
    placeholder: 'Describe what you are feeling…',
    description: 'Check symptoms and learn when to get care',
    prompts: [
      'I have a headache and feel dizzy. What should I do?',
      'When is a fever serious enough to see a doctor?',
      'My ankles are swollen. What could cause that?',
      'How can I tell a cold from the flu or COVID-19?',
    ],
  },
];

const PATIENT_EXTRA_MODES: readonly AiModeOption[] = [
  {
    mode: 'lesson',
    label: 'Lesson follow-up',
    icon: 'school-outline',
    placeholder: 'Ask a follow-up about this lesson…',
    description: 'Follow-up questions about a health lesson',
    prompts: [
      'Can you summarize this lesson in three points?',
      'How does this apply to someone with my conditions?',
      'What should I ask my doctor about this topic?',
    ],
  },
];

// ───────────────────────── Doctor ─────────────────────────

const DOCTOR_MODES: readonly AiModeOption[] = [
  {
    mode: 'general',
    label: 'Literature',
    icon: 'library-outline',
    placeholder: 'Ask a clinical question…',
    description: 'Clinical questions answered from PubMed literature',
    prompts: [
      'Summarize the evidence for SGLT2 inhibitors in heart failure.',
      'First-line antihypertensives for adults with type 2 diabetes?',
      'Evidence for statins in primary prevention after age 75.',
      'What do recent meta-analyses show for GLP-1 receptor agonists and weight loss?',
    ],
  },
  {
    mode: 'medication',
    label: 'Drug label',
    icon: 'flask-outline',
    placeholder: 'Ask about dosing or interactions…',
    description: 'FDA drug label lookups: dosing, warnings, interactions',
    prompts: [
      'Atorvastatin: contraindications, warnings and key interactions.',
      'Metformin dosing with reduced eGFR per FDA labeling.',
      'Lisinopril adverse reactions and monitoring.',
      'Clarithromycin with simvastatin: what does the label say?',
    ],
  },
  {
    mode: 'lesson',
    label: 'Patient-education draft',
    icon: 'create-outline',
    placeholder: 'What should the handout explain?',
    description: 'Draft plain-language patient education with sources',
    prompts: [
      'Draft a plain-language handout on starting a statin.',
      'Explain home blood pressure monitoring for a new patient.',
      'Write a patient guide to recognizing low blood sugar.',
      'Create a one-page explainer on using an asthma inhaler.',
    ],
  },
];

const DOCTOR_EXTRA_MODES: readonly AiModeOption[] = [
  {
    mode: 'explain-note',
    label: 'Explain note',
    icon: 'document-text-outline',
    placeholder: 'Ask about this note…',
    description: 'Explain a visit note',
    prompts: ['Rewrite this note in plain language for the patient.'],
  },
  {
    mode: 'symptoms',
    label: 'Symptoms',
    icon: 'pulse-outline',
    placeholder: 'Describe the presentation…',
    description: 'Differential and red flags for a presentation',
    prompts: ['Red flags to screen for in new-onset headache in adults.'],
  },
];

// ───────────────────────── Personas ─────────────────────────

const TRUST_SOURCES = 'Answers cite PubMed, NIH MedlinePlus and FDA drug labels.';

export const PERSONAS: Record<Role, AiPersona> = {
  patient: {
    role: 'patient',
    title: 'BRIAN AI',
    subtitle: 'Your AI health guide',
    assistantName: 'BRIAN',
    modes: PATIENT_MODES,
    extraModes: PATIENT_EXTRA_MODES,
    welcomeTitle: 'What would you like to understand?',
    welcomeText: 'Ask about your health, your medicines, or what your doctor wrote. BRIAN explains it in plain language.',
    trustText: `${TRUST_SOURCES} BRIAN is an AI — not a substitute for your clinician.`,
    answerDisclaimer:
      'BRIAN is an AI, not your clinician. Check with your doctor or pharmacist before changing any medicine.',
    composerNote: 'BRIAN is an AI and can make mistakes. In an emergency, call 911.',
    chatHref: '/patient/ai',
    historyHref: '/patient/ai/history',
    tabBadgeKey: 'patient/ai',
    canPickNotes: true,
  },
  doctor: {
    role: 'doctor',
    title: 'Evidence AI',
    subtitle: 'Clinical literature assistant',
    assistantName: 'Evidence AI',
    modes: DOCTOR_MODES,
    extraModes: DOCTOR_EXTRA_MODES,
    welcomeTitle: 'Ask the literature',
    welcomeText: 'Search PubMed, check FDA labeling, or draft patient education — every claim linked to its source.',
    trustText: `${TRUST_SOURCES} Evidence AI summarizes sources — verify primary literature and apply clinical judgment.`,
    answerDisclaimer: 'AI-generated summary. Verify against the cited sources and your clinical judgment.',
    composerNote: 'AI-generated summaries can be incomplete. Verify before acting.',
    chatHref: '/doctor/ai',
    historyHref: '/doctor/ai/history',
    tabBadgeKey: 'doctor/ai',
    canPickNotes: false,
  },
};

/** All modes known to a persona (visible + deep-link-only). */
export function allModes(persona: AiPersona): readonly AiModeOption[] {
  return [...persona.modes, ...persona.extraModes];
}

/** Mode option for `mode`, falling back to the persona's default. */
export function modeOption(persona: AiPersona, mode: AiMode): AiModeOption {
  return allModes(persona).find((m) => m.mode === mode) ?? persona.modes[0]!;
}

/** The chips to show: visible modes plus the active deep-link-only mode (if any). */
export function visibleModes(persona: AiPersona, active: AiMode): readonly AiModeOption[] {
  if (persona.modes.some((m) => m.mode === active)) return persona.modes;
  const extra = persona.extraModes.find((m) => m.mode === active);
  return extra ? [...persona.modes, extra] : persona.modes;
}

export function defaultMode(persona: AiPersona): AiMode {
  return persona.modes[0]!.mode;
}

const AI_MODES: readonly AiMode[] = ['general', 'explain-note', 'medication', 'symptoms', 'lesson'];

export function isAiMode(value: unknown): value is AiMode {
  return typeof value === 'string' && (AI_MODES as readonly string[]).includes(value);
}

// ───────────────────────── Thinking stages ─────────────────────────

export interface ThinkingStage {
  /** Milliseconds after sending when this stage starts. */
  at: number;
  label: string;
}

/** Staged progress while waiting for an answer (triage runs first, then evidence, then writing). */
export const THINKING_STAGES: readonly ThinkingStage[] = [
  { at: 0, label: 'Checking for red flags…' },
  { at: 1_600, label: 'Searching PubMed…' },
  { at: 4_200, label: 'Reading NIH MedlinePlus…' },
  { at: 7_000, label: 'Checking FDA drug labels…' },
  { at: 10_000, label: 'Writing your answer…' },
];

/** After this long, the thinking bubble adds a "still working" reassurance. */
export const SLOW_ANSWER_MS = 20_000;

// ───────────────────────── Evidence sources ─────────────────────────

export interface SourceMeta {
  label: string;
  icon: IoniconName;
  /** Long name for screen readers. */
  a11y: string;
}

export const SOURCE_META: Record<EvidenceSource, SourceMeta> = {
  PubMed: { label: 'PubMed', icon: 'library-outline', a11y: 'PubMed research article' },
  MedlinePlus: { label: 'MedlinePlus', icon: 'medkit-outline', a11y: 'NIH MedlinePlus health topic' },
  openFDA: { label: 'FDA', icon: 'shield-checkmark-outline', a11y: 'FDA drug label' },
  RxNorm: { label: 'RxNorm', icon: 'flask-outline', a11y: 'RxNorm drug name record' },
  NIH: { label: 'NIH', icon: 'business-outline', a11y: 'National Institutes of Health page' },
  CDC: { label: 'CDC', icon: 'globe-outline', a11y: 'CDC page' },
  Glossary: { label: 'Glossary', icon: 'book-outline', a11y: 'Medical glossary entry' },
};

export function sourceMeta(source: EvidenceSource | string): SourceMeta {
  return SOURCE_META[source as EvidenceSource] ?? { label: String(source), icon: 'link-outline', a11y: String(source) };
}

/** Storage key for the current conversation id (per signed-in user). */
export function conversationStorageKey(userId: string): string {
  return `brian.ai.currentConversation.${userId}`;
}
