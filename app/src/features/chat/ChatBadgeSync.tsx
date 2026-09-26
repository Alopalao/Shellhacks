import { useLiveThreads } from './useLiveThreads';

/**
 * Invisible helper that keeps the unread-messages tab badge (patient "Care" / doctor "Messages")
 * live from app start. Chat screens already sync it; mounting this in a tab layout makes the badge
 * appear before the user ever opens those tabs. Must be rendered inside a navigator screen.
 */
export function ChatBadgeSync() {
  useLiveThreads({ syncTabBadge: true });
  return null;
}
