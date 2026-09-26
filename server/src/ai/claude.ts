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

/** The slice of the SDK client we use (lets tests inject a fake). */
export interface ClaudeClientLike {
  beta: {
    messages: {
      create(params: MessageCreateParamsNonStreaming, options?: { timeout?: number; maxRetries?: number }): PromiseLike<BetaMessage>;
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
}

export function extractText(content: BetaContentBlock[]): string {
  return content
    .filter((block): block is Extract<BetaContentBlock, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

/**
 * One Claude "responder". Remembers whether the server-side fallback beta is accepted so a
 * 400 on the beta costs a single retry for the life of the process, not one per request.
 */
export class ClaudeResponder {
  private fallbackSupported = true;

  constructor(private readonly client: ClaudeClientLike) {}

  private async create(params: MessageCreateParamsNonStreaming): Promise<BetaMessage> {
    const withFallback: MessageCreateParamsNonStreaming = this.fallbackSupported
      ? { ...params, betas: [FALLBACK_BETA], fallbacks: 'default' }
      : params;
    try {
      return await this.client.beta.messages.create(withFallback, { timeout: REQUEST_TIMEOUT_MS });
    } catch (error) {
      if (this.fallbackSupported && error instanceof Anthropic.BadRequestError) {
        // The beta / fallbacks field may not be enabled for this key or model: retry once without it.
        this.fallbackSupported = false;
        return await this.client.beta.messages.create(params, { timeout: REQUEST_TIMEOUT_MS });
      }
      throw error;
    }
  }

  async run(options: ClaudeRunOptions): Promise<ClaudeRunResult> {
    const maxRounds = options.maxToolRounds ?? MAX_TOOL_ROUNDS;
    const messages: BetaMessageParam[] = [...options.messages];
    let rounds = 0;

    for (;;) {
      const allowTools = options.tools !== null && rounds < maxRounds;
      const response = await this.create({
        model: options.model,
        max_tokens: MAX_TOKENS,
        thinking: { type: 'adaptive' },
        output_config: { effort: options.effort },
        system: options.system,
        messages,
        ...(options.tools ? { tools: EVIDENCE_TOOLS, tool_choice: allowTools ? { type: 'auto' as const } : { type: 'none' as const } } : {}),
      });

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
  if (error instanceof Anthropic.AuthenticationError) return 'the AI service rejected the API key';
  if (error instanceof Anthropic.PermissionDeniedError) return "the API key doesn't have access to this model";
  if (error instanceof Anthropic.RateLimitError) return 'the AI service is busy (rate limited)';
  if (error instanceof Anthropic.APIConnectionTimeoutError) return 'the AI service timed out';
  if (error instanceof Anthropic.APIConnectionError) return "the AI service couldn't be reached";
  if (error instanceof Anthropic.BadRequestError) return 'the AI service rejected the request';
  if (error instanceof Anthropic.APIError) return `the AI service returned an error${error.status ? ` (${error.status})` : ''}`;
  return 'the AI service hit an unexpected error';
}
