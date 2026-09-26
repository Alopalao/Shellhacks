// Inbox tab badge = refill requests waiting for this doctor's decision, kept live for the whole
// session. Tabs mount lazily, so the Inbox/Patients screens alone can't keep it current — this runs
// from the doctor tab layout (via `useActivityRecorder()`).
import { useEffect } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import { useSocketEvent } from '@/lib/socket';
import { setTabBadge } from '@/lib/tab-badges';
import { removeById, upsertById } from './format';

/** Load the doctor's pending refill requests, follow them live, and mirror the count onto the Inbox tab. */
export function useInboxBadgeSync(doctorId: string | null): void {
  const { data, setData, reload } = useApiQuery(() => api.refills('pending'), [doctorId], { enabled: !!doctorId });

  useSocketEvent('refill:upsert', (refill) => {
    if (!doctorId) return;
    if (!data) {
      // First load failed or is still running — fetch the list rather than guess.
      void reload();
      return;
    }
    // Same scope as GET /api/refills?status=pending: still pending *and* addressed to me. A patient
    // who switches doctors hands their pending requests to the new physician (doctorId changes).
    const mine = refill.status === 'pending' && refill.doctorId === doctorId;
    setData((prev) => (prev ? (mine ? upsertById(prev, refill) : removeById(prev, refill.id)) : prev));
  });

  useSocketEvent('user:updated', (patient) => {
    if (!doctorId || patient.role !== 'patient' || patient.doctorId === doctorId) return;
    // Switched to another physician: every request they had pending with me moved with them.
    setData((prev) => prev?.filter((r) => r.patientId !== patient.id));
  });

  const count = data?.length;
  useEffect(() => {
    if (count !== undefined) setTabBadge('doctor/inbox', count);
  }, [count]);
}
