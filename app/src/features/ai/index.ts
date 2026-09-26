// BRIAN AI / Evidence AI feature. Route files import the screens; other features can deep-link with
// `aiChatHref(role, { prompt, mode, noteId, prescriptionId, drugName, lessonId, lessonTitle, autoSend })`.
export { AiChatScreen, type AiChatScreenProps } from './AiChatScreen';
export { AiHistoryScreen, type AiHistoryScreenProps } from './AiHistoryScreen';
export { PERSONAS, type AiModeOption, type AiPersona } from './config';
export {
  getCurrentConversationId,
  loadCurrentConversationId,
  setCurrentConversationId,
  useCurrentConversationId,
} from './conversationStore';
export { aiChatHref, parseAiDeepLink, type AiDeepLink, type AiRouteParams } from './links';
export { useAiChat, type SendOutcome, type UseAiChatResult } from './useAiChat';
export { useAiStatus } from './useAiStatus';
