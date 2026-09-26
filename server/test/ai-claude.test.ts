import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaContentBlock,
  BetaMessage,
  BetaMessageParam,
  BetaToolResultBlockParam,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { describe, expect, it } from 'vitest';
import { ClaudeDeadlineError, ClaudeResponder, FALLBACK_BETA, MAX_TOOL_ROUNDS, type ClaudeClientLike, type ToolRuntime } from '../src/ai/claude';
import { AiService } from '../src/ai/service';
import type { User } from '../src/shared/contracts';
import { makeDb, stubEvidence, testConfig } from './ai-fixtures';

type Step = BetaMessage | Error;

function message(content: unknown[], stopReason: BetaMessage['stop_reason'], extra: Record<string, unknown> = {}): BetaMessage {
  return {
    id: `msg_${Math.random().toString(36).slice(2)}`,
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5',
    content: content as BetaContentBlock[],
    stop_reason: stopReason,
    stop_sequence: null,
    stop_details: null,
    usage: { input_tokens: 10, output_tokens: 10 },
    ...extra,
  } as unknown as BetaMessage;
}

const text = (value: string) => ({ type: 'text', text: value, citations: null });
const thinking = { type: 'thinking', thinking: '', signature: 'sig-123' };
const toolUse = (id: string, name: string, input: Record<string, unknown>) => ({ type: 'tool_use', id, name, input });

/** Fake client that replays scripted responses and records every request (deep-copied). */
function fakeClient(steps: Step[] | ((request: MessageCreateParamsNonStreaming) => Step)) {
  const requests: MessageCreateParamsNonStreaming[] = [];
  const client: ClaudeClientLike = {
    beta: {
      messages: {
        async create(params) {
          requests.push(structuredClone(params));
          const step = typeof steps === 'function' ? steps(params) : steps.shift();
          if (!step) throw new Error('no scripted response left');
          if (step instanceof Error) throw step;
          return step;
        },
      },
    },
  };
  return { client, requests };
}

const runtime = (impl: (name: string, input: unknown) => Promise<string>): ToolRuntime & { calls: Array<[string, unknown]> } => {
  const calls: Array<[string, unknown]> = [];
  return {
    calls,
    async execute(name, input) {
      calls.push([name, input]);
      return impl(name, input);
    },
  };
};

const baseRun = {
  model: 'claude-opus-5',
  effort: 'medium' as const,
  system: 'system prompt',
  messages: [{ role: 'user', content: 'question' }] as BetaMessageParam[],
};

describe('ClaudeResponder', () => {
  it('sends the required request shape (adaptive thinking, effort, fallback beta)', async () => {
    const { client, requests } = fakeClient([message([text('Hello')], 'end_turn')]);
    const result = await new ClaudeResponder(client).run({ ...baseRun, tools: null });
    expect(result).toMatchObject({ kind: 'text', text: 'Hello', truncated: false, toolRounds: 0 });
    const request = requests[0]!;
    expect(request).toMatchObject({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      system: 'system prompt',
    });
    for (const forbidden of ['temperature', 'top_p', 'top_k']) expect(request).not.toHaveProperty(forbidden);
    expect(request.messages.at(-1)?.role).toBe('user'); // never prefill an assistant turn
  });

  it('runs the tool loop: verbatim assistant turn, all results in one user turn, errors flagged', async () => {
    const assistantContent = [thinking, text('Let me check.'), toolUse('t1', 'search_medlineplus', { query: 'stroke' }), toolUse('t2', 'lookup_drug_label', { drug_name: 'zzz' })];
    const { client, requests } = fakeClient([message(assistantContent, 'tool_use'), message([text('Final answer [1].')], 'end_turn')]);
    const tools = runtime(async (name) => {
      if (name === 'lookup_drug_label') throw new Error('No label found.');
      return '[1] Stroke — MedlinePlus';
    });
    const result = await new ClaudeResponder(client).run({ ...baseRun, tools });

    expect(result).toMatchObject({ kind: 'text', text: 'Final answer [1].', toolRounds: 1 });
    expect(tools.calls).toEqual([
      ['search_medlineplus', { query: 'stroke' }],
      ['lookup_drug_label', { drug_name: 'zzz' }],
    ]);
    const second = requests[1]!;
    expect(second.messages).toHaveLength(3);
    expect(second.messages[1]).toEqual({ role: 'assistant', content: assistantContent });
    const results = second.messages[2]!.content as BetaToolResultBlockParam[];
    expect(second.messages[2]!.role).toBe('user');
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ type: 'tool_result', tool_use_id: 't1', content: '[1] Stroke — MedlinePlus' });
    expect(results[1]).toMatchObject({ type: 'tool_result', tool_use_id: 't2', is_error: true });
    expect(requests[0]!.tools?.map((t) => ('name' in t ? t.name : ''))).toEqual(['search_pubmed', 'search_medlineplus', 'lookup_drug_label']);
    expect(requests[0]!.tools?.every((t) => 'strict' in t && t.strict === true)).toBe(true);
  });

  it(`stops offering tools after ${MAX_TOOL_ROUNDS} rounds`, async () => {
    let calls = 0;
    const { client, requests } = fakeClient((request) => {
      calls += 1;
      if (request.tool_choice?.type === 'none') return message([text('Done without more tools.')], 'end_turn');
      return message([toolUse(`t${calls}`, 'search_pubmed', { query: 'x' })], 'tool_use');
    });
    const result = await new ClaudeResponder(client).run({ ...baseRun, tools: runtime(async () => 'ok') });
    expect(result).toMatchObject({ kind: 'text', text: 'Done without more tools.', toolRounds: MAX_TOOL_ROUNDS });
    expect(requests).toHaveLength(MAX_TOOL_ROUNDS + 1);
    expect(requests.slice(0, MAX_TOOL_ROUNDS).every((r) => r.tool_choice?.type === 'auto')).toBe(true);
    expect(requests.at(-1)?.tool_choice).toEqual({ type: 'none' });
  });

  it('reports refusals and truncation', async () => {
    const refusal = fakeClient([message([], 'refusal', { stop_details: { type: 'refusal', category: 'bio', explanation: 'declined' } })]);
    expect(await new ClaudeResponder(refusal.client).run({ ...baseRun, tools: null })).toMatchObject({ kind: 'refusal', category: 'bio' });
    const long = fakeClient([message([text('Partial answer')], 'max_tokens')]);
    expect(await new ClaudeResponder(long.client).run({ ...baseRun, tools: null })).toMatchObject({ kind: 'text', text: 'Partial answer', truncated: true });
  });

  it('retries once without the fallback beta when it is rejected, and remembers', async () => {
    const bad = new Anthropic.BadRequestError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'unknown beta' } }, 'unknown beta', new Headers());
    const { client, requests } = fakeClient([bad, message([text('A')], 'end_turn'), message([text('B')], 'end_turn')]);
    const responder = new ClaudeResponder(client);
    expect(await responder.run({ ...baseRun, tools: null })).toMatchObject({ text: 'A' });
    expect(await responder.run({ ...baseRun, tools: null })).toMatchObject({ text: 'B' });
    expect(requests[0]).toHaveProperty('fallbacks', 'default');
    expect(requests[1]).not.toHaveProperty('fallbacks');
    expect(requests[1]).not.toHaveProperty('betas');
    expect(requests[2]).not.toHaveProperty('betas');
  });

  it('rethrows other 400s without turning the fallback off', async () => {
    const tooLong = new Anthropic.BadRequestError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'prompt is too long: 250000 tokens > 200000 maximum' } }, 'prompt is too long', new Headers());
    const { client, requests } = fakeClient([tooLong, message([text('Later')], 'end_turn')]);
    const responder = new ClaudeResponder(client);
    await expect(responder.run({ ...baseRun, tools: null })).rejects.toBe(tooLong);
    expect(requests).toHaveLength(1); // no pointless identical retry
    expect(await responder.run({ ...baseRun, tools: null })).toMatchObject({ text: 'Later' });
    expect(requests[1]).toMatchObject({ betas: [FALLBACK_BETA], fallbacks: 'default' });
  });

  it('respects the overall answer deadline', async () => {
    // Close to the deadline: no more tool rounds, and per-call timeouts shrink to what's left.
    const options: Array<{ timeout?: number; maxRetries?: number } | undefined> = [];
    const near = fakeClient([message([text('Quick answer')], 'end_turn')]);
    const create = near.client.beta.messages.create;
    near.client.beta.messages.create = (params, opts) => {
      options.push(opts);
      return create(params, opts);
    };
    const result = await new ClaudeResponder(near.client).run({ ...baseRun, tools: runtime(async () => 'ok'), deadline: Date.now() + 20_000 });
    expect(result).toMatchObject({ kind: 'text', text: 'Quick answer' });
    expect(near.requests[0]?.tool_choice).toEqual({ type: 'none' });
    expect(options[0]?.timeout).toBeLessThanOrEqual(20_000);
    expect(options[0]?.maxRetries).toBe(0);
    // Past the deadline: don't start another call.
    const late = fakeClient([message([text('never')], 'end_turn')]);
    await expect(new ClaudeResponder(late.client).run({ ...baseRun, tools: null, deadline: Date.now() + 1_000 })).rejects.toBeInstanceOf(ClaudeDeadlineError);
    expect(late.requests).toHaveLength(0);
  });
});

describe('AiService with Claude', () => {
  function setup(steps: Step[] | ((request: MessageCreateParamsNonStreaming) => Step)) {
    const db = makeDb();
    const fake = fakeClient(steps);
    const warnings: string[] = [];
    const service = new AiService({ config: testConfig, db, evidence: stubEvidence(), claude: fake.client, logger: { warn: (m: string) => warnings.push(m) } });
    const maya = db.data.users.find((u) => u.id === 'maya') as User;
    return { service, maya, requests: fake.requests, warnings };
  }

  it('reports anthropic status and returns validated, renumbered citations', async () => {
    const { service, maya, requests } = setup([message([text('Stroke info [2]. Made-up source [99]. Also [1].')], 'end_turn')]);
    expect(service.status()).toMatchObject({ provider: 'anthropic', model: 'claude-opus-5' });
    const { reply } = await service.chat(maya, { message: 'what are the signs of a stroke?' });
    expect(reply.mocked).toBe(false);
    expect(reply.content).toBe('Stroke info [1]. Made-up source. Also [2].');
    expect(reply.citations?.map((c) => c.id)).toEqual(['1', '2']);
    expect(reply.triage?.level).toBe('info');

    const userTurn = requests[0]!.messages.at(-1)!.content as string;
    expect(userTurn).toContain('<patient_context>');
    expect(userTurn).toContain('Allergies: Penicillin');
    expect(userTurn).toContain('<triage level="info">');
    expect(userTurn).toContain('Rule-based hint only'); // the model still judges the message itself
    expect(requests[0]!.system).toContain('Check every message yourself for a possible emergency');
    expect(userTurn).toMatch(/<sources>\n\[1\] Stroke/);
    expect(requests[0]!.system).toContain('BRIAN, "your AI health guide,"');
    expect(requests[0]!.system).not.toContain('Maya'); // volatile context stays out of the system prompt
  });

  it('adds tool results to the shared source list so the model can cite them', async () => {
    const { service, maya } = setup((request) => {
      const last = request.messages.at(-1)!;
      if (typeof last.content === 'string') return message([toolUse('t1', 'search_medlineplus', { query: 'high blood pressure' })], 'tool_use');
      const result = (last.content as BetaToolResultBlockParam[])[0]!;
      const id = String(result.content).match(/\[(\d+)\] High Blood Pressure/)?.[1];
      return message([text(`High blood pressure strains arteries [${id}].`)], 'end_turn');
    });
    const { reply } = await service.chat(maya, { message: 'Tell me about hypertension please' });
    expect(reply.citations?.[0]?.url).toBe('https://medlineplus.gov/highbloodpressure.html');
    expect(reply.content).toBe('High blood pressure strains arteries [1].');
  });

  it('falls back to the evidence-only responder on API errors, noting why', async () => {
    const limited = new Anthropic.RateLimitError(429, { type: 'error', error: { type: 'rate_limit_error', message: 'slow down' } }, 'slow down', new Headers());
    const { service, maya, warnings } = setup([limited]);
    const { reply } = await service.chat(maya, { message: 'Can I take ibuprofen with lisinopril?' });
    expect(reply.mocked).toBe(true);
    expect(reply.content).toContain('Answered in evidence-only mode because the AI service is busy (rate limited).');
    expect(reply.content).toContain('Check with your doctor or pharmacist');
    expect(warnings[0]).toMatch(/rate limited/);
  });

  it('does not save the turn when the app has already given up', async () => {
    const { service, maya } = setup([message([text('Too late.')], 'end_turn')]);
    const gone = new AbortController();
    gone.abort();
    await expect(service.chat(maya, { message: 'what are the signs of a stroke?' }, { signal: gone.signal })).rejects.toMatchObject({ status: 499 });
    expect(service.listConversations(maya)).toHaveLength(0);
  });

  it('uses the safe mock answer when the model declines', async () => {
    const { service, maya } = setup([message([], 'refusal', { stop_details: { type: 'refusal', category: null, explanation: null } })]);
    const { reply } = await service.chat(maya, { message: 'what are the signs of a stroke?' });
    expect(reply.mocked).toBe(true);
    expect(reply.content).toContain('think F.A.S.T.');
    expect(reply.content).toContain("BRIAN's AI model couldn't answer this one");
  });

  it('sends earlier turns without stale citation markers', async () => {
    const { service, maya, requests } = setup([message([text('First [1].')], 'end_turn'), message([text('Second.')], 'end_turn')]);
    const first = await service.chat(maya, { message: 'what are the signs of a stroke?' });
    await service.chat(maya, { message: 'and heart attacks?', conversationId: first.conversation.id });
    const history = requests[1]!.messages;
    expect(history[0]).toEqual({ role: 'user', content: 'what are the signs of a stroke?' });
    expect(history[1]).toEqual({ role: 'assistant', content: 'First.' });
    expect(history).toHaveLength(3);
  });
});
