// Resolves prescriber ids to display names ("Dr. Daniel Reyes") using GET /api/doctors,
// kept fresh by `user:updated` events. Falls back to the patient's assigned doctor.
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import type { Prescription, User } from '@/lib/contracts';
import { displayName } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';

export interface Prescribers {
  /** The doctor user for an id, when known. */
  doctor: (doctorId: string | null | undefined) => User | undefined;
  /** "Dr. Daniel Reyes", "Self-reported", or "Your doctor" while names are loading. */
  label: (rx: Pick<Prescription, 'doctorId' | 'selfReported'>) => string;
  /** Short form for live labels: "Dr. Reyes" (or "your doctor"). */
  shortLabel: (rx: Pick<Prescription, 'doctorId'>) => string;
}

/** Last name with the "Dr." title: "Dr. Reyes". */
export function shortDoctorName(doctor: Pick<User, 'name' | 'role'>): string {
  const full = displayName(doctor).replace(/^dr\.?\s+/i, '');
  const last = full.split(/\s+/).filter(Boolean).at(-1);
  return last ? `Dr. ${last}` : displayName(doctor);
}

export function usePrescribers(extra?: User | null): Prescribers {
  const { data, setData } = useApiQuery(() => api.doctors(), [], { refetchOnFocus: false, keepPreviousData: true });

  useSocketEvent('user:updated', (updated) => {
    if (updated.role !== 'doctor') return;
    setData((prev) => (prev ? prev.map((d) => (d.id === updated.id ? updated : d)) : prev));
  });

  const doctor = (doctorId: string | null | undefined): User | undefined => {
    if (!doctorId) return undefined;
    return data?.find((d) => d.id === doctorId) ?? (extra?.id === doctorId ? extra : undefined);
  };

  return {
    doctor,
    label: (rx) => {
      if (rx.selfReported || !rx.doctorId) return 'Self-reported';
      const d = doctor(rx.doctorId);
      return d ? displayName(d) : 'Your doctor';
    },
    shortLabel: (rx) => {
      const d = doctor(rx.doctorId);
      return d ? shortDoctorName(d) : 'your doctor';
    },
  };
}
