// Optimistic "tap to log / tap again to undo" for dose checklists, kept in sync with the
// realtime `dose:logged` / `dose:removed` events (e.g. the same patient on another device).
import { useRef, useState } from 'react';
import { useToast } from '@/components/ui';
import { api, errorMessage, isApiRequestError } from '@/lib/api';
import type { DoseLog, Prescription } from '@/lib/contracts';
import { formatTime } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';
import { medLabel } from './format';
import { doseKey, doseKeyOf, upsertDose } from './schedule';

export type DoseListUpdater = (update: (prev: DoseLog[]) => DoseLog[]) => void;

export interface UseDoseToggleOptions {
  /** Current dose logs (any dates). Undefined while loading. */
  doses: readonly DoseLog[] | undefined;
  /** Apply an update to the list the doses came from (no-op while it hasn't loaded). */
  update: DoseListUpdater;
  /** The signed-in patient's id (used for optimistic entries and to filter live events). */
  patientId: string | undefined;
  /** Which live `dose:logged` events belong to this list (e.g. today only, or one prescription). */
  accept?: (dose: DoseLog) => boolean;
}

export interface DoseToggle {
  /** Log the dose if it isn't taken yet, otherwise undo it. */
  toggle: (rx: Pick<Prescription, 'id' | 'drugName' | 'strength'>, date: string, slot: string) => Promise<void>;
  /** True while a request for this slot is in flight. */
  isPending: (prescriptionId: string, date: string, slot: string) => boolean;
}

const LOCAL_PREFIX = 'local:';

/** Optimistic dose logging. Pair it with a list from `useApiQuery` via `update`. */
export function useDoseToggle({ doses, update, patientId, accept }: UseDoseToggleOptions): DoseToggle {
  const toast = useToast();
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  // Refs mirror state for synchronous checks inside async handlers.
  const pendingRef = useRef(new Set<string>());
  const removedIds = useRef(new Set<string>());

  const setKeyPending = (key: string, on: boolean) => {
    if (on) pendingRef.current.add(key);
    else pendingRef.current.delete(key);
    setPending(new Set(pendingRef.current));
  };

  useSocketEvent('dose:logged', (dose) => {
    if (patientId && dose.patientId !== patientId) return;
    if (accept && !accept(dose)) return;
    if (removedIds.current.has(dose.id) || pendingRef.current.has(doseKeyOf(dose))) return;
    update((prev) => upsertDose(prev, dose));
  });

  useSocketEvent('dose:removed', ({ id, patientId: owner }) => {
    if (patientId && owner !== patientId) return;
    update((prev) => (prev.some((d) => d.id === id) ? prev.filter((d) => d.id !== id) : prev));
  });

  const toggle: DoseToggle['toggle'] = async (rx, date, slot) => {
    const key = doseKey(rx.id, date, slot);
    if (pendingRef.current.has(key) || !patientId) return;
    const existing = doses?.find((d) => doseKeyOf(d) === key);
    const what = `${medLabel(rx)} (${formatTime(slot)})`;
    setKeyPending(key, true);
    try {
      if (existing && !existing.id.startsWith(LOCAL_PREFIX)) {
        removedIds.current.add(existing.id);
        update((prev) => prev.filter((d) => d.id !== existing.id));
        try {
          await api.removeDose(existing.id);
        } catch (e) {
          if (isApiRequestError(e) && e.status === 404) return; // already gone elsewhere
          removedIds.current.delete(existing.id);
          update((prev) => upsertDose(prev, existing));
          toast.error(`Couldn't undo ${what}`, errorMessage(e));
        }
        return;
      }
      const optimistic: DoseLog = {
        id: `${LOCAL_PREFIX}${key}`,
        prescriptionId: rx.id,
        patientId,
        date,
        slot,
        takenAt: new Date().toISOString(),
      };
      update((prev) => upsertDose(prev, optimistic));
      try {
        const saved = await api.logDose({ prescriptionId: rx.id, date, slot });
        update((prev) => upsertDose(prev, saved));
      } catch (e) {
        update((prev) => prev.filter((d) => d.id !== optimistic.id));
        toast.error(`Couldn't log ${what}`, errorMessage(e));
      }
    } finally {
      setKeyPending(key, false);
    }
  };

  const isPending: DoseToggle['isPending'] = (prescriptionId, date, slot) =>
    pending.has(doseKey(prescriptionId, date, slot));

  return { toggle, isPending };
}
