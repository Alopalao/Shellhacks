// AI doctor orchestration: triage → context resolution (with access checks) → evidence
// pre-retrieval → Claude (tool loop) or the deterministic mock → citation validation →
// conversation persistence. Also serves drug info and evidence search.

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Config } from '../config';
import type { Db } from '../context';
import type {
  AiChatRequest,
  AiChatResponse,
  AiConversation,
  AiMessage,
  AiMode,
  AiStatus,
  Citation,
  DrugInfo,
  DrugInfoSection,
  EvidenceSearchResponse,
  Prescription,
  User,
  VisitNote,
} from '../shared/contracts';
import {
  createEvidenceClient,
  evidenceSettingsFromConfig,
  evidenceStatus,
  labelCitation,
  medlinePlusDrugCitation,
  medlinePlusTopicCitation,
  otcWarningHighlights,
  pubmedCitation,
  summarizeBoxedWarning,
  summarizeSection,
  type DrugLabel,
  type EvidenceClient,
} from '../evidence';
import { takeSentences, titleCase, truncateWords } from '../evidence/text';
import { SourceList, describeCitation, finalizeCitations, stripCitationMarkers } from './citations';
import { ANSWER_DEADLINE_MS, ClaudeResponder, createClaudeClient, describeClaudeError, type ClaudeClientLike, type ToolRuntime } from './claude';
import { classDescription, cleanDrugName, isOtc, isSupplement, lookupDrug } from './drugs';
import { looksLikeClinicalNote, looksLikePastedNote } from './glossary';
import { commonSideEffects, dedupeItems, interactionItems, isBoilerplateIntro, plainLabel, summaryToLines } from './label-text';
import { DEMO_FOOTER, mockRespond, refusalFallbackReason } from './mock';
import { buildUserTurn, systemPromptFor } from './prompts';
import { retrieveEvidence, withDeadline } from './retrieval';
import { triageMessage } from './triage';
import type { ChatInput, ChatTurn, EvidenceBundle, PatientContext } from './types';

// ── Errors & validation ──────────────────────────────────────────────────────

export class AiHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AiHttpError';
  }
}

const MODES = ['general', 'explain-note', 'medication', 'symptoms', 'lesson'] as const satisfies readonly AiMode[];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const chatRequestSchema = z.object({
  conversationId: z.string().trim().min(1).max(100).optional(),
  message: z.string().trim().min(1, 'Please type a message.').max(4000, 'Messages can be up to 4,000 characters.'),
  mode: z.enum(MODES).optional(),
  context: z
    .object({
      noteId: optionalText(100),
      // Same cap as a visit note's body (POST /api/notes): the app sends the note text with its id.
      noteText: optionalText(20_000),
      prescriptionId: optionalText(100),
      drugName: optionalText(120),
      lessonId: optionalText(120),
      lessonTitle: optionalText(200),
    })
    .optional(),
});

/** Validated chat request (the schema output is assignable to the shared contract type). */
export type ChatRequest = AiChatRequest;

const HISTORY_TURNS = 10;
const TITLE_MAX = 60;

export function conversationTitle(message: string): string {
  const clean = message.replace(/\s+/g, ' ').trim();
  if (clean.length <= TITLE_MAX) return clean;
  const cut = clean.slice(0, TITLE_MAX - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 30 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
}

export function inferMode(requested: AiMode | undefined, context: ChatRequest['context'], previous: AiMode | undefined): AiMode {
  if (requested) return requested;
  if (context?.noteId || context?.noteText) return 'explain-note';
  if (context?.prescriptionId || context?.drugName) return 'medication';
  if (context?.lessonId || context?.lessonTitle) return 'lesson';
  return previous ?? 'general';
}

/** AI status from config alone (used by /api/health and /api/ai/status). */
export function aiStatusFromConfig(config: Pick<Config, 'anthropicApiKey' | 'claudeModel' | 'evidenceOffline'>): AiStatus {
  const llm = Boolean(config.anthropicApiKey);
  return { provider: llm ? 'anthropic' : 'mock', model: llm ? config.claudeModel : null, evidence: evidenceStatus(config) };
}

// ── Service ──────────────────────────────────────────────────────────────────

export interface AiServiceOptions {
  config: Config;
  db: Db;
  evidence?: EvidenceClient;
  /** Injected Claude client (tests). `undefined` → created from config; `null` → never use the LLM. */
  claude?: ClaudeClientLike | null;
  now?: () => Date;
  logger?: Pick<Console, 'warn'>;
}

export class AiService {
  readonly evidence: EvidenceClient;
  private readonly responder: ClaudeResponder | null;
  private readonly now: () => Date;
  private readonly logger: Pick<Console, 'warn'>;

  constructor(private readonly options: AiServiceOptions) {
    this.evidence = options.evidence ?? createEvidenceClient(evidenceSettingsFromConfig(options.config));
    const client = options.claude === undefined ? createClaudeClient(options.config) : options.claude;
    this.responder = client ? new ClaudeResponder(client) : null;
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger ?? console;
  }

  private get db(): Db {
    return this.options.db;
  }

  status(): AiStatus {
    return {
      provider: this.responder ? 'anthropic' : 'mock',
      model: this.responder ? this.options.config.claudeModel : null,
      evidence: evidenceStatus(this.options.config),
    };
  }

  // ── Conversations ──────────────────────────────────────────────────────────

  listConversations(user: User): AiConversation[] {
    return this.db.data.aiConversations
      .filter((c) => c.userId === user.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getConversation(user: User, id: string): AiConversation {
    const conversation = this.db.data.aiConversations.find((c) => c.id === id);
    if (!conversation) throw new AiHttpError(404, 'Conversation not found.');
    if (conversation.userId !== user.id) throw new AiHttpError(403, "You don't have access to that conversation.");
    return conversation;
  }

  deleteConversation(user: User, id: string): void {
    this.getConversation(user, id);
    const index = this.db.data.aiConversations.findIndex((c) => c.id === id);
    if (index >= 0) this.db.data.aiConversations.splice(index, 1);
    this.db.save();
  }

  // ── Context resolution (with access control) ──────────────────────────────

  private findUser(id: string | null | undefined): User | undefined {
    return id ? this.db.data.users.find((u) => u.id === id) : undefined;
  }

  private canSeePatient(user: User, patientId: string): boolean {
    if (user.role === 'patient') return user.id === patientId;
    const patient = this.findUser(patientId);
    return patient?.doctorId === user.id;
  }

  private resolveNote(user: User, noteId: string): VisitNote {
    const note = this.db.data.visitNotes.find((n) => n.id === noteId);
    if (!note) throw new AiHttpError(404, 'Visit note not found.');
    const allowed = user.role === 'patient' ? note.patientId === user.id : note.doctorId === user.id || this.canSeePatient(user, note.patientId);
    if (!allowed) throw new AiHttpError(403, "You don't have access to that visit note.");
    return note;
  }

  private resolvePrescription(user: User, id: string): Prescription {
    const rx = this.db.data.prescriptions.find((p) => p.id === id);
    if (!rx) throw new AiHttpError(404, 'Prescription not found.');
    const allowed = user.role === 'patient' ? rx.patientId === user.id : rx.doctorId === user.id || this.canSeePatient(user, rx.patientId);
    if (!allowed) throw new AiHttpError(403, "You don't have access to that prescription.");
    return rx;
  }

  private patientContext(patient: User): PatientContext {
    return {
      name: patient.name,
      dateOfBirth: patient.patient?.dateOfBirth ?? null,
      conditions: patient.patient?.conditions ?? [],
      allergies: patient.patient?.allergies ?? [],
      medications: this.db.data.prescriptions.filter((rx) => rx.patientId === patient.id && rx.status !== 'discontinued'),
    };
  }

  private latestNoteFor(patientId: string): VisitNote | null {
    const notes = this.db.data.visitNotes.filter((n) => n.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return notes[0] ?? null;
  }

  buildInput(user: User, request: ChatRequest, mode: AiMode, history: ChatTurn[]): ChatInput {
    const context: NonNullable<ChatRequest['context']> = request.context ?? {};
    const note = context.noteId ? this.resolveNote(user, context.noteId) : null;
    const prescription = context.prescriptionId ? this.resolvePrescription(user, context.prescriptionId) : null;

    let noteForInput: ChatInput['note'] = note ? { title: note.title, body: note.body, createdAt: note.createdAt } : null;
    if (!noteForInput && context.noteText) noteForInput = { title: 'Pasted note', body: context.noteText, createdAt: this.now().toISOString() };
    if (!noteForInput && mode === 'explain-note' && user.role === 'patient' && !looksLikeClinicalNote(request.message)) {
      const latest = this.latestNoteFor(user.id);
      if (latest) noteForInput = { title: latest.title, body: latest.body, createdAt: latest.createdAt };
    }

    let patient: PatientContext | null = null;
    if (user.role === 'patient') patient = this.patientContext(user);
    else {
      const patientId = note?.patientId ?? prescription?.patientId ?? null;
      const subject = patientId && this.canSeePatient(user, patientId) ? this.findUser(patientId) : undefined;
      if (subject) patient = this.patientContext(subject);
    }

    return {
      message: request.message,
      mode,
      role: user.role,
      userName: user.name,
      patient,
      note: noteForInput,
      prescription,
      drugName: context.drugName ?? null,
      lessonTitle: context.lessonTitle ?? null,
      history,
    };
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  /**
   * Answers and saves the turn. `signal` aborts when the app has disconnected (e.g. its own
   * timeout fired): the answer is then not saved, so a retry doesn't duplicate the question.
   */
  async chat(user: User, request: ChatRequest, options: { signal?: AbortSignal } = {}): Promise<AiChatResponse> {
    const existing = request.conversationId ? this.getConversation(user, request.conversationId) : null;
    const mode = inferMode(request.mode, request.context, existing?.mode);
    const history: ChatTurn[] = (existing?.messages ?? []).slice(-HISTORY_TURNS).map((m) => ({
      role: m.role,
      content: m.role === 'assistant' ? stripCitationMarkers(m.content.replace(DEMO_FOOTER, '')) : m.content,
    }));
    const input = this.buildInput(user, request, mode, history);

    const answer = await this.answer(input, options);
    if (options.signal?.aborted) throw new AiHttpError(499, 'The request was cancelled before the answer was ready.');
    const now = this.now().toISOString();
    const userMessage: AiMessage = { id: `aim_${randomUUID()}`, role: 'user', content: request.message, createdAt: now, mode };
    const reply: AiMessage = {
      id: `aim_${randomUUID()}`,
      role: 'assistant',
      content: answer.content,
      createdAt: new Date(Math.max(this.now().getTime(), Date.parse(now) + 1)).toISOString(),
      mode,
      citations: answer.citations,
      triage: answer.triage,
      mocked: answer.mocked,
    };

    // Re-read in case the conversation was deleted while we were waiting on the model.
    let conversation = existing ? this.db.data.aiConversations.find((c) => c.id === existing.id) ?? null : null;
    if (!conversation) {
      conversation = {
        id: existing?.id ?? `aic_${randomUUID()}`,
        userId: user.id,
        title: conversationTitle(request.message),
        mode,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      this.db.data.aiConversations.push(conversation);
    }
    conversation.messages.push(userMessage, reply);
    conversation.mode = mode;
    conversation.updatedAt = reply.createdAt;
    this.db.save();
    return { conversation, reply };
  }

  /** Produces the assistant reply for a prepared input (no persistence). */
  async answer(
    input: ChatInput,
    options: { signal?: AbortSignal } = {},
  ): Promise<{ content: string; citations: Citation[]; triage: AiMessage['triage']; mocked: boolean }> {
    // One budget for retrieval and every model round (below the app's 120 s timeout).
    const deadline = Date.now() + ANSWER_DEADLINE_MS;
    // Only a genuinely pasted note softens alarms (and never the writer's own words — see triage).
    const triage = triageMessage(input.message, {
      noteLike: looksLikePastedNote(input.message),
      audience: input.role === 'doctor' ? 'clinician' : 'patient',
    });
    const bundle = await retrieveEvidence(input, triage, this.evidence);

    let text: string | null = null;
    let mocked = true;
    let fallbackReason: string | null = null;

    if (this.responder) {
      try {
        const result = await this.responder.run({
          model: this.options.config.claudeModel,
          effort: this.options.config.claudeEffort,
          system: systemPromptFor(input),
          messages: [
            ...input.history.map((turn) => ({ role: turn.role, content: turn.content })),
            { role: 'user' as const, content: buildUserTurn(input, bundle, this.now()) },
          ],
          tools: this.evidence.offline ? null : this.toolRuntime(bundle),
          deadline,
          signal: options.signal,
        });
        if (result.kind === 'refusal') {
          fallbackReason = refusalFallbackReason();
        } else if (result.text) {
          text = result.truncated ? `${result.text}\n\n(This answer was cut short. Ask me to continue if you'd like more.)` : result.text;
          mocked = false;
        } else {
          fallbackReason = "BRIAN's AI model returned an empty answer, so here is guidance from trusted sources instead.";
        }
      } catch (error) {
        if (options.signal?.aborted) throw new AiHttpError(499, 'The request was cancelled before the answer was ready.');
        const reason = describeClaudeError(error);
        this.logger.warn(`[ai] Claude unavailable (${reason}); using the evidence-only responder.`);
        fallbackReason = `Answered in evidence-only mode because ${reason}.`;
      }
    }

    const raw = text ?? mockRespond(input, bundle, { fallbackReason });
    const { content, citations } = finalizeCitations(raw, bundle.sources.all());
    return { content, citations, triage: triage.triage, mocked };
  }

  /** Evidence tools for the Claude loop; every result is appended to the shared source list. */
  toolRuntime(bundle: EvidenceBundle): ToolRuntime {
    const queryInput = z.object({ query: z.string().trim().min(2).max(300) });
    const drugInput = z.object({ drug_name: z.string().trim().min(2).max(120) });
    const evidence = this.evidence;
    const list = (ids: string[]) =>
      ids.length > 0
        ? `Added these numbered sources (cite them by number):\n\n${ids.map((id) => describeCitation(bundle.sources.get(id)!)).join('\n\n')}`
        : 'No matching sources were found.';

    return {
      async execute(name: string, rawInput: unknown): Promise<string> {
        if (name === 'search_pubmed') {
          const { query } = queryInput.parse(rawInput);
          const articles = await evidence.searchPubMed(query, { max: 4 });
          return list(articles.map((a) => bundle.sources.add(pubmedCitation(a))));
        }
        if (name === 'search_medlineplus') {
          const { query } = queryInput.parse(rawInput);
          const topics = await evidence.searchMedlinePlus(query, { max: 2 });
          const ids = topics.map((t) => bundle.sources.add(medlinePlusTopicCitation(t)));
          const detail = topics
            .map((t, i) => `[${ids[i]}] ${t.title} — summary: ${truncateWords(t.summary, 900)}`)
            .join('\n\n');
          return ids.length > 0 ? `${list(ids)}\n\nSummaries:\n${detail}` : list([]);
        }
        if (name === 'lookup_drug_label') {
          const { drug_name: drugName } = drugInput.parse(rawInput);
          const normalized = await evidence.normalizeDrug(drugName).catch(() => null);
          const generic = normalized?.name ?? lookupDrug(drugName)?.name ?? cleanDrugName(drugName);
          const label = await evidence.drugLabel(generic, { rxcui: normalized?.rxcui, preferOtc: isOtc(generic) });
          if (!label) return `No FDA label was found for "${drugName}".`;
          const id = bundle.sources.add(labelCitation(label));
          return `${list([id])}\n\nLabel excerpts for [${id}]:\n${labelDigest(label)}`;
        }
        throw new Error(`Unknown tool "${name}".`);
      },
    };
  }

  // ── Drug info & evidence search ─────────────────────────────────────────────

  async drugInfo(query: string): Promise<DrugInfo> {
    const clean = query.trim();
    const local = lookupDrug(clean);
    if (this.evidence.offline) return offlineDrugInfo(clean);

    const form = /\b(hfa|inhal\w*|puffs?|aerosol|diskus)\b/i.test(clean) ? 'inhaler' : /\bnasal\b/i.test(clean) ? 'nasal spray' : null;
    const extendedRelease = /\b(er|xr|xl|sr|cr|extended[- ]release|8[- ]?hr)\b/i.test(clean);
    const normalized = (await withDeadline(this.evidence.normalizeDrug(clean), 7_000, null)).value;
    const generic = normalized?.name ?? local?.name ?? cleanDrugName(clean);
    const supplement = isSupplement(generic) || isSupplement(clean);
    const [labelResult, medlineResult] = await Promise.all([
      supplement
        ? Promise.resolve({ value: null, timedOut: false, failed: false })
        : withDeadline(this.evidence.drugLabel(generic, { rxcui: normalized?.rxcui, preferOtc: isOtc(generic), form, extendedRelease }), 8_000, null),
      withDeadline(this.evidence.medlinePlusDrug({ name: generic, rxcui: normalized?.rxcui, form }), 8_000, null),
    ]);
    const label = labelResult.value;
    const medline = medlineResult.value;
    if (!label && !medline && !normalized && (labelResult.failed || labelResult.timedOut || medlineResult.failed || medlineResult.timedOut)) {
      return offlineDrugInfo(clean, 'Live drug references are not responding right now.');
    }

    const sources = new SourceList();
    const labelId = label ? sources.add(labelCitation(label)) : null;
    const medlineId = medline ? sources.add(medlinePlusDrugCitation(medline)) : null;
    if (!labelId && !medlineId) {
      sources.add(dailyMedSearchCitation(generic));
      sources.add(DRUG_INFO_HOME_CITATION);
    }

    const sections = label ? labelSections(label, medline?.summary ?? null) : medline ? [{ title: 'Uses', text: takeSentences(medline.summary, 600, 5) }] : [];
    const brandNames = cleanBrands([...(normalized?.brandNames ?? []), ...(local?.brands ?? []), ...(label?.brandNames ?? [])], generic).slice(0, 6);

    return {
      query: clean,
      name: titleCase(generic),
      genericName: normalized?.name ?? label?.genericName ?? local?.name ?? null,
      brandNames,
      rxcui: normalized?.rxcui ?? null,
      sections,
      citations: sources.all(),
      mocked: false,
    };
  }

  async evidenceSearch(query: string): Promise<EvidenceSearchResponse> {
    const q = query.trim();
    const [topics, articles] = await Promise.all([
      withDeadline(this.evidence.searchMedlinePlus(q, { max: 2 }), 8_000, []),
      withDeadline(this.evidence.searchPubMed(q, { max: 5 }), 9_000, []),
    ]);
    const sources = new SourceList();
    for (const topic of topics.value) sources.add(medlinePlusTopicCitation(topic));
    for (const article of articles.value) sources.add(pubmedCitation(article));
    return { query: q, citations: sources.all() };
  }
}

// ── Drug info helpers ────────────────────────────────────────────────────────

/** Brand list without salt-form duplicates of the generic ("Metformin Hydrochloride"). */
function cleanBrands(brands: string[], generic: string): string[] {
  const g = generic.toLowerCase();
  return [...new Set(brands)].filter((b) => {
    const lower = b.toLowerCase();
    return lower !== g && !lower.startsWith(`${g} `) && !/\b(tablets?|capsules?|usp|extended|hydrochloride|sodium|calcium)\b/i.test(b);
  });
}

const DRUG_INFO_HOME_CITATION = {
  source: 'MedlinePlus' as const,
  title: 'Drugs, Herbs and Supplements',
  url: 'https://medlineplus.gov/druginformation.html',
  publisher: 'MedlinePlus (National Library of Medicine)',
};

function dailyMedSearchCitation(drug: string) {
  return {
    source: 'NIH' as const,
    title: `${titleCase(drug)} — DailyMed label search`,
    url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${encodeURIComponent(drug)}`,
    publisher: 'DailyMed (National Library of Medicine)',
  };
}

function sectionText(lines: string[], intro?: string | null): string {
  const body = lines.map((line) => `- ${line.replace(/[;,]$/, '')}`).join('\n');
  return intro ? `${intro}\n${body}` : body;
}

/** Readable, length-limited DrugInfo sections from an FDA label. */
export function labelSections(label: DrugLabel, medlineSummary: string | null): DrugInfoSection[] {
  const s = label.sections;
  const sections: DrugInfoSection[] = [];
  const add = (title: string, text: string) => {
    const clean = text.trim();
    if (clean) sections.push({ title, text: clean });
  };

  const uses = summarizeSection(s.indications ?? s.purpose, 520, 6);
  const usesLines = dedupeItems(summaryToLines(uses));
  const lead = medlineSummary ? takeSentences(medlineSummary, 360, 3) : null;
  add('Uses', [lead, usesLines.length > 0 ? sectionText(usesLines, uses.intro ? plainLabel(uses.intro) : 'The FDA label lists:') : ''].filter(Boolean).join('\n\n'));

  const dosing = summarizeSection(s.dosage, 600, 6);
  const otcLabel = label.productType?.includes('OTC') ?? false;
  // OTC directions count pills, which only fits the strength the label was written for.
  const whose = otcLabel
    ? `These directions are from the Drug Facts label${label.strength ? ` for ${label.strength} products` : ''}. Pill counts depend on the strength — follow the label on your own package, or ask a pharmacist.`
    : 'Follow the directions on your own prescription label — your dose may differ.';
  add(
    'How to take',
    [sectionText(summaryToLines(dosing), dosing.intro), whose]
      .filter((t) => t.trim())
      .join('\n\n'),
  );

  const warnings: string[] = [];
  const boxed = summarizeBoxedWarning(s.boxedWarning);
  if (boxed) warnings.push(`Boxed warning${boxed.title ? ` (${boxed.title.toLowerCase()})` : ''}: ${plainLabel(boxed.text)}`);
  const otc = otcWarningHighlights(s.warnings, 4).map(plainLabel);
  if (otc.length > 0) warnings.push(...otc);
  else warnings.push(...summaryToLines(summarizeSection(s.warningsAndCautions ?? s.warnings, 520, 5)));
  const contraindications = summaryToLines(summarizeSection(s.contraindications ?? s.doNotUse, 240, 2));
  if (contraindications.length > 0) {
    warnings.push(`Do not use: ${contraindications.join('; ').replace(/^do not use:?\s*/i, '').replace(/^[;:\s]+/, '')}`);
  }
  add('Warnings', sectionText(warnings.slice(0, 6)));

  const table = interactionItems(s.interactions);
  const interactions = summarizeSection(s.interactions ?? s.askDoctorOrPharmacist, 520, 6);
  add(
    'Interactions',
    table.length > 0 ? sectionText(table) : sectionText(summaryToLines(interactions), interactions.intro ? plainLabel(interactions.intro) : null),
  );

  const common = commonSideEffects(s.adverseReactions);
  const side = summarizeSection(s.adverseReactions ?? s.stopUse, 480, 6);
  const sideIntro = side.intro && !isBoilerplateIntro(side.intro) ? plainLabel(side.intro) : null;
  add('Side effects', common ?? sectionText(summaryToLines(side), sideIntro));
  return sections;
}

/** Compact label digest for tool results (≈1.5k chars). */
export function labelDigest(label: DrugLabel): string {
  const s = label.sections;
  const parts: Array<[string, string | undefined, number]> = [
    ['Uses', s.indications ?? s.purpose, 350],
    ['Dosage (label)', s.dosage, 400],
    ['Boxed warning', s.boxedWarning, 300],
    ['Warnings', s.warningsAndCautions ?? s.warnings, 400],
    ['Contraindications', s.contraindications ?? s.doNotUse, 250],
    ['Interactions', s.interactions ?? s.askDoctorOrPharmacist, 400],
    ['Side effects', s.adverseReactions ?? s.stopUse, 300],
  ];
  return parts
    .filter(([, text]) => Boolean(text))
    .map(([title, text, max]) => {
      const summary = summarizeSection(text, max, 6);
      return `${title}: ${[summary.intro, ...summary.items].filter(Boolean).join(' • ')}`;
    })
    .join('\n');
}

function offlineDrugInfo(query: string, reason = 'Live FDA label lookups are turned off right now.'): DrugInfo {
  const local = lookupDrug(query);
  const name = local?.name ?? cleanDrugName(query);
  const cls = classDescription(name);
  const sections: DrugInfoSection[] = [];
  if (cls) sections.push({ title: 'Uses', text: `${titleCase(name)} is ${/^[aeiou]/i.test(cls) ? 'an' : 'a'} ${cls}. Ask your pharmacist or doctor what it is treating for you.` });
  sections.push({
    title: 'Warnings',
    text: `${reason} Read the full FDA label on DailyMed or the plain-language guide on MedlinePlus, and ask your pharmacist about warnings and interactions.`,
  });
  const sources = new SourceList();
  sources.add(dailyMedSearchCitation(name));
  sources.add(DRUG_INFO_HOME_CITATION);
  return {
    query,
    name: titleCase(name),
    genericName: local?.name ?? null,
    brandNames: local?.brands ?? [],
    rxcui: null,
    sections,
    citations: sources.all(),
    mocked: true,
  };
}

