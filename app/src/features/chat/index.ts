// Real-time patient ↔ doctor messaging. Import from '@/features/chat'.
export { AttachmentCard, describeAttachment, type AttachmentCardProps, type AttachmentInfo } from './AttachmentCard';
export { ChatBadgeSync } from './ChatBadgeSync';
export { ChatHeader, type ChatHeaderProps } from './ChatHeader';
export { CHAT_EMERGENCY_NOTE, ChatThread, type ChatThreadProps } from './ChatThread';
export { Composer, MAX_MESSAGE_LENGTH, type ComposerProps } from './Composer';
export { DaySeparator } from './DaySeparator';
export { MessageBubble, type MessageBubbleProps } from './MessageBubble';
export {
  CHAT_PAGE_SIZE,
  applyRead,
  buildRows,
  dayLabel,
  formatLastSeen,
  mergeMessages,
  messagePreview,
  normalizeMessages,
  shortName,
  upsertMessage,
} from './messages';
export { PhysicianCard, type PhysicianCardProps } from './PhysicianCard';
export { PresenceStatus, presenceLabel, type PresenceStatusProps } from './PresenceStatus';
export { ThreadListItem, type ThreadListItemProps } from './ThreadListItem';
export { TypingDots } from './TypingDots';
export { TypingIndicator } from './TypingIndicator';
export type { ChatRow, DeliveryStatus, LocalMessage, Receipt } from './types';
export { UnreadCount, type UnreadCountProps } from './UnreadCount';
export { useAttachmentLookup, type AttachmentLookup } from './useAttachmentLookup';
export { useChatThread, type ChatThreadController, type ChatThreadState } from './useChatThread';
export { useAppActive, useRealtimeOffline } from './useConnectivity';
export { chatTabBadgeKey, sortThreads, useLiveThreads, type LiveThreads } from './useLiveThreads';
export { usePresenceDetails, type PresenceDetails } from './usePresenceDetails';
export { useTypingEmitter, useTypingThreads, type TypingEmitter } from './useTyping';
