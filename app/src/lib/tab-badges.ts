// Tiny store so feature screens can put a count on a tab without editing the tab layouts.
//   setTabBadge('patient/care', unreadCount)   // 0 / null clears it
// Keys: 'patient/<tab>' or 'doctor/<tab>' using the tab route names from SPEC §5.
import { useSyncExternalStore } from 'react';

export type TabBadgeKey =
  | 'patient/index'
  | 'patient/meds'
  | 'patient/ai'
  | 'patient/care'
  | 'patient/lessons'
  | 'doctor/index'
  | 'doctor/inbox'
  | 'doctor/messages'
  | 'doctor/ai'
  | 'doctor/profile';

let badges: Partial<Record<TabBadgeKey, number>> = {};
const listeners = new Set<() => void>();

/** Set (or clear with 0/null) the badge count shown on a tab. */
export function setTabBadge(key: TabBadgeKey, count: number | null | undefined): void {
  const next = count && count > 0 ? Math.floor(count) : undefined;
  if (badges[key] === next) return;
  badges = { ...badges, [key]: next };
  listeners.forEach((l) => l());
}

/** Clear every badge (used on logout). */
export function clearTabBadges(): void {
  badges = {};
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => badges;

/** All badge counts (used by the tab layouts). */
export function useTabBadges(): Partial<Record<TabBadgeKey, number>> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
