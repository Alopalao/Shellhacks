// Anthropic Messages API (beta surface) with adaptive thinking, effort control, the
// server-side refusal fallback, and a manual evidence-tool loop (max 3 tool rounds).

import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaContentBlock,
  BetaMessage,
  BetaMessageParam,
  BetaTool,
  BetaToolResultBlockParam,
  BetaToolUseBlock,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type { Config } from '../config';

export const MAX_TOOL_ROUNDS = 3;
export const MAX_TOKENS = 16_000;
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
const REQUEST_TIMEOUT_MS = 120_000;
/**
 * Budget for one whole answer (evidence pre-retrieval + every model round), kept under the
 * app's 120 s request timeout so a reply never arrives after the app has given up.
 */
export const ANSWER_DEADLINE_MS = 100_000;
/** With less time than this left, stop offering tools so the model answers with what it has. */
const FINAL_ROUND_MS = 35_000;
/** With less time than this left, don't start another model call. */
const MIN_CALL_MS = 8_000;

/** The overall answer deadline passed before the model finished. */
export class ClaudeDeadlineError extends Error {
  constructor() {
    super('The AI answer took too long.');
    this.name = 'ClaudeDeadlineError';
  }
}

export interface ClaudeRequestOptions {
  timeout?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

/** The slice of the SDK client we use (lets tests inject a fake). */
export interface ClaudeClientLike {
  beta: {
    messages: {
      create(params: MessageCreateParamsNonStreaming, options?: ClaudeRequestOptions): PromiseLike<BetaMessage>;
    };
  };
}

export function createClaudeClient(config: Pick<Config, 'anthropicApiKey'>): ClaudeClientLike | null {
  if (!config.anthropicApiKey) return null;
  return new Anthropic({ apiKey: config.anthropicApiKey, maxRetries: 1 });
}

export const EVIDENCE_TOOLS: BetaTool[] = [
  {
    name: 'search_pubmed',
    description:
      'Search PubMed for peer-reviewed research. Reviews, guidelines and meta-analyses are preferred automatically. Use a short PubMed-style query (e.g. "statin muscle symptoms", "NSAID ACE inhibitor kidney"). Returns numbered sources (title, journal, year, key finding) that you may cite as [n].',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'PubMed search query, 2–12 words.' } },
      required: ['query'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'search_medlineplus',
    description:
      'Search MedlinePlus (U.S. National Library of Medicine) health topics for plain-language summaries of conditions, symptoms, tests and treatments. Use a short topic name (e.g. "high blood pressure", "migraine"). Returns numbered sources you may cite as [n].',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Health topic, 1–4 words.' } },
      required: ['query'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'lookup_drug_label',
    description:
      'Look up the official FDA drug label (via openFDA/DailyMed) for a medicine by generic or brand name. Returns uses, dosing, boxed warning, warnings, interactions and side effects as a numbered source you may cite as [n].',
    input_schema: {
      type: 'object',
      properties: { drug_name: { type: 'string', description: 'Generic or brand name, e.g. "lisinopril" or "Advil".' } },
      required: ['drug_name'],
      additionalProperties: false,
    },
    strict: true,
  },
];

export interface ToolRuntime {
  /** Runs a tool and returns the text for the tool_result. Throw to report an error. */
  execute(name: string, input: unknown): Promise<string>;
}

export type ClaudeRunResult =
  | { kind: 'text'; text: string; stopReason: string | null; truncated: boolean; toolRounds: number; model: string }
  | { kind: 'refusal'; category: string | null; explanation: string | null; model: string };

export interface ClaudeRunOptions {
  model: string;
  effort: Config['claudeEffort'];
  system: string;
  messages: BetaMessageParam[];
  tools: ToolRuntime | null;
  maxToolRounds?: number;
  /** Epoch ms by which the answer must be done (see ANSWER_DEADLINE_MS). */
  deadline?: number;
  /** Aborts in-flight calls (the app disconnected). */
  signal?: AbortSignal;
}

export function extractText(content: BetaContentBlock[]): string {
  return content
    .filter((block): block is Extract<BetaContentBlock, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

/**
 * A 400 that rejects the fallback beta itself ("unknown beta", "fallbacks: not supported"),
 * as opposed to any other bad request (prompt too long, invalid block…).
 */
export function rejectsFallbackBeta(error: unknown): boolean {
  if (!(error instanceof Anthropic.BadRequestError)) return false;
  const body = error.error as { error?: { message?: unknown } } | undefined;
  const detail = typeof body?.error?.message === 'string' ? body.error.message : error.message;
  return /fallback|anthropic-beta|\bbetas?\b/i.test(detail);
}

/**
 * One Claude "responder". Remembers whether the server-side fallback beta is accepted so a
 * 400 on the beta costs a single retry for the life of the process, not one per request.
 * Other 400s are rethrown and leave the fallback on.
 */
export class ClaudeResponder {
  private fallbackSupported = true;

  constructor(private readonly client: ClaudeClientLike) {}

  private async create(params: MessageCreateParamsNonStreaming, deadline: number, signal: AbortSignal | undefined): Promise<BetaMessage> {
    const callOptions = (): ClaudeRequestOptions => {
      const left = deadline - Date.now();
      if (left < MIN_CALL_MS) throw new ClaudeDeadlineError();
      // One SDK retry only when there's room for it inside the deadline.
      return { timeout: Math.min(REQUEST_TIMEOUT_MS, left), maxRetries: left > 2 * FINAL_ROUND_MS ? 1 : 0, ...(signal ? { signal } : {}) };
    };
    const withFallback: MessageCreateParamsNonStreaming = this.fallbackSupported
      ? { ...params, betas: [FALLBACK_BETA], fallbacks: 'default' }
      : params;
    try {
      return await this.client.beta.messages.create(withFallback, callOptions());
    } catch (error) {
      if (!this.fallbackSupported || !rejectsFallbackBeta(error)) throw error;
      // The beta isn't enabled for this key or model: retry without it, and stop sending it once that works.
      const response = await this.client.beta.messages.create(params, callOptions());
      this.fallbackSupported = false;
      return response;
    }
  }

  async run(options: ClaudeRunOptions): Promise<ClaudeRunResult> {
    const maxRounds = options.maxToolRounds ?? MAX_TOOL_ROUNDS;
    const deadline = options.deadline ?? Date.now() + ANSWER_DEADLINE_MS;
    const messages: BetaMessageParam[] = [...options.messages];
    let rounds = 0;

    for (;;) {
      // Near the deadline, stop tool rounds so the next call writes the answer.
      const allowTools = options.tools !== null && rounds < maxRounds && deadline - Date.now() > FINAL_ROUND_MS;
      const response = await this.create({
        model: options.model,
        max_tokens: MAX_TOKENS,
        thinking: { type: 'adaptive' },
        output_config: { effort: options.effort },
        system: options.system,
        messages,
        ...(options.tools ? { tools: EVIDENCE_TOOLS, tool_choice: allowTools ? { type: 'auto' as const } : { type: 'none' as const } } : {}),
      }, deadline, options.signal);

      if (response.stop_reason === 'refusal') {
        return {
          kind: 'refusal',
          category: response.stop_details?.category ?? null,
          explanation: response.stop_details?.explanation ?? null,
          model: response.model,
        };
      }

      const toolUses = response.content.filter((block): block is BetaToolUseBlock => block.type === 'tool_use');
      if (response.stop_reason === 'tool_use' && allowTools && toolUses.length > 0 && options.tools) {
        const runtime = options.tools;
        // Echo the assistant turn verbatim (thinking blocks included), then answer every tool call in ONE user turn.
        messages.push({ role: 'assistant', content: response.content });
        const results: BetaToolResultBlockParam[] = await Promise.all(
          toolUses.map(async (block): Promise<BetaToolResultBlockParam> => {
            try {
              const content = await runtime.execute(block.name, block.input);
              return { type: 'tool_result', tool_use_id: block.id, content };
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Tool failed.';
              return { type: 'tool_result', tool_use_id: block.id, content: `Error: ${message}`, is_error: true };
            }
          }),
        );
        messages.push({ role: 'user', content: results });
        rounds += 1;
        continue;
      }

      return {
        kind: 'text',
        text: extractText(response.content),
        stopReason: response.stop_reason,
        truncated: response.stop_reason === 'max_tokens',
        toolRounds: rounds,
        model: response.model,
      };
    }
  }
}

/** A short, user-safe explanation of why the AI model was unavailable. */
export function describeClaudeError(error: unknown): string {
  if (error instanceof ClaudeDeadlineError) return 'the AI service took too long';
  if (error instanceof Anthropic.AuthenticationError) return 'the AI service rejected the API key';
  if (error instanceof Anthropic.PermissionDeniedError) return "the API key doesn't have access to this model";
  if (error instanceof Anthropic.RateLimitError) return 'the AI service is busy (rate limited)';
  if (error instanceof Anthropic.APIConnectionTimeoutError) return 'the AI service timed out';
  if (error instanceof Anthropic.APIConnectionError) return "the AI service couldn't be reached";
  if (error instanceof Anthropic.BadRequestError) return 'the AI service rejected the request';
  if (error instanceof Anthropic.APIError) return `the AI service returned an error${error.status ? ` (${error.status})` : ''}`;
  return 'the AI service hit an unexpected error';
}
