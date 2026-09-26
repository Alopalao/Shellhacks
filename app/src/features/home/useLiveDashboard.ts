// The patient dashboard (GET /api/dashboard) kept live by socket events, plus optimistic dose logging.
import { useApiQuery, type UseApiQueryResult } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import type { PatientDashboard } from '@/lib/contracts';
import { useSocketEvent } from '@/lib/socket';
import { upsertPrescription, upsertRefill } from '@/features/meds/format';
import { useDoseToggle, type DoseToggle } from '@/features/meds/useDoseToggle';

export interface LiveDashboard extends UseApiQueryResult<PatientDashboard> {
  /** Tap-to-log / undo for today's checklist (optimistic). */
  doses: DoseToggle;
}

/**
 * Loads the dashboard for the patient's local `today` and applies live events:
 * prescription:upsert, refill:upsert, note:new, dose:logged / dose:removed, message:new / message:read,
 * user:updated (doctor profile).
 */
export function useLiveDashboard(today: string, patientId: string | undefined): LiveDashboard {
  const q = useApiQuery(() => api.dashboard(today), [today], { enabled: !!patientId, keepPreviousData: true });
  const { setData } = q;

  useSocketEvent('prescription:upsert', (rx) => {
    if (rx.patientId !== patientId) return;
    setData((prev) =>
      prev
        ? {
            ...prev,
            prescriptions:
              rx.status === 'discontinued'
                ? prev.prescriptions.filter((p) => p.id !== rx.id)
                : upsertPrescription(prev.prescriptions, rx),
          }
        : prev,
    );
  });

  useSocketEvent('refill:upsert', (refill) => {
    if (refill.patientId !== patientId) return;
    setData((prev) =>
      prev
        ? {
            ...prev,
            pendingRefills:
              refill.status === 'pending'
                ? upsertRefill(prev.pendingRefills, refill)
                : prev.pendingRefills.filter((r) => r.id !== refill.id),
          }
        : prev,
    );
  });

  useSocketEvent('note:new', (note) => {
    if (note.patientId !== patientId) return;
    setData((prev) =>
      prev && (!prev.latestNote || note.createdAt >= prev.latestNote.createdAt) ? { ...prev, latestNote: note } : prev,
    );
  });

  useSocketEvent('message:new', (message) => {
    if (message.patientId !== patientId || message.senderId === patientId) return;
    setData((prev) => (prev ? { ...prev, unreadMessages: prev.unreadMessages + 1 } : prev));
  });

  useSocketEvent('message:read', ({ readerId }) => {
    if (readerId !== patientId) return;
    setData((prev) => (prev && prev.unreadMessages ? { ...prev, unreadMessages: 0 } : prev));
  });

  useSocketEvent('user:updated', (user) => {
    setData((prev) => (prev?.doctor && prev.doctor.id === user.id ? { ...prev, doctor: user } : prev));
  });

  const doses = useDoseToggle({
    doses: q.data?.todayDoses,
    update: (fn) => setData((prev) => (prev ? { ...prev, todayDoses: fn(prev.todayDoses) } : prev)),
    patientId,
    accept: (dose) => dose.date === today,
  });

  return { ...q, doses };
}
