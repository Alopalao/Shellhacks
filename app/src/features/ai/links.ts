// Deep links into the AI chat. Other screens can use `aiChatHref()` (or build the same query by hand):
//   router.push(aiChatHref('patient', { mode: 'explain-note', noteId, prompt: 'Explain this note', autoSend: true }))
import type { Href } from 'expo-router';
import type { AiChatContext, AiMode, Role } from '@/lib/contracts';
import { isAiMode } from './config';

/** Route params understood by /patient/ai and /doctor/ai. */
export interface AiDeepLink {
  /** Question to prefill (or send, with `autoSend`). */
  prompt?: string;
  mode?: AiMode;
  noteId?: string;
  prescriptionId?: string;
  drugName?: string;
  lessonId?: string;
  lessonTitle?: string;
  /** Send `prompt` immediately. */
  autoSend?: boolean;
  /** Open an existing conversation instead. */
  conversationId?: string;
}

/** Names of every route param the chat screen reads (and clears after use). */
export const AI_ROUTE_PARAM_NAMES = [
  'prompt',
  'mode',
  'noteId',
  'prescriptionId',
  'drugName',
  'lessonId',
  'lessonTitle',
  'autoSend',
  'conversationId',
] as const;

export type AiRouteParamName = (typeof AI_ROUTE_PARAM_NAMES)[number];
export type AiRouteParams = Partial<Record<AiRouteParamName, string | string[]>>;

/** Build an href to the AI chat for `role` with optional deep-link params. */
export function aiChatHref(role: Role, link: AiDeepLink = {}): Href {
  const base = role === 'doctor' ? '/doctor/ai' : '/patient/ai';
  const entries: [string, string][] = [];
  const add = (key: AiRouteParamName, value: string | undefined) => {
    if (value) entries.push([key, value]);
  };
  add('mode', link.mode);
  add('noteId', link.noteId);
  add('prescriptionId', link.prescriptionId);
  add('drugName', link.drugName);
  add('lessonId', link.lessonId);
  add('lessonTitle', link.lessonTitle);
  add('conversationId', link.conversationId);
  add('prompt', link.prompt?.trim());
  if (link.autoSend && link.prompt?.trim()) entries.push(['autoSend', '1']);
  const query = entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return (query ? `${base}?${query}` : base) as Href;
}

function single(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = typeof v === 'string' ? v.trim() : '';
  return trimmed ? trimmed : undefined;
}

export interface ParsedAiDeepLink {
  /** Stable identity of this set of params (used to consume it exactly once). */
  key: string;
  prompt?: string;
  mode?: AiMode;
  context: AiChatContext;
  autoSend: boolean;
  conversationId?: string;
  /** True when the link starts a new topic (a prompt or attached context). */
  startsNewTopic: boolean;
}

/** Normalize raw route params. Returns null when none of the AI params are present. */
export function parseAiDeepLink(params: AiRouteParams): ParsedAiDeepLink | null {
  const values: Partial<Record<AiRouteParamName, string>> = {};
  for (const name of AI_ROUTE_PARAM_NAMES) {
    const v = single(params[name]);
    if (v) values[name] = v;
  }
  if (!Object.keys(values).length) return null;

  const context: AiChatContext = {};
  if (values.noteId) context.noteId = values.noteId;
  if (values.prescriptionId) context.prescriptionId = values.prescriptionId;
  if (values.drugName) context.drugName = values.drugName;
  if (values.lessonId) context.lessonId = values.lessonId;
  if (values.lessonTitle) context.lessonTitle = values.lessonTitle;

  let mode: AiMode | undefined = isAiMode(values.mode) ? values.mode : undefined;
  if (!mode) {
    if (context.noteId) mode = 'explain-note';
    else if (context.prescriptionId || context.drugName) mode = 'medication';
    else if (context.lessonId || context.lessonTitle) mode = 'lesson';
  }
  const autoSend = values.autoSend === '1' || values.autoSend === 'true';
  const hasContext = Object.keys(context).length > 0;

  return {
    key: AI_ROUTE_PARAM_NAMES.map((n) => `${n}=${values[n] ?? ''}`).join('&'),
    prompt: values.prompt,
    mode,
    context,
    autoSend: autoSend && !!values.prompt,
    conversationId: values.conversationId,
    startsNewTopic: !!values.prompt || hasContext,
  };
}

/** Params object that clears every AI deep-link param (for router.setParams). */
export function clearedAiParams(): Record<AiRouteParamName, undefined> {
  return Object.fromEntries(AI_ROUTE_PARAM_NAMES.map((n) => [n, undefined])) as Record<AiRouteParamName, undefined>;
}
