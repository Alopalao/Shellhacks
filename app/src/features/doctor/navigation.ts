// Route builders for the doctor screens (SPEC §5) and a safe "go back" for nested stacks.
import { router, type Href } from 'expo-router';
import { threadIdFor } from './format';

export const doctorHrefs = {
  patients: '/doctor' as Href,
  inbox: '/doctor/inbox' as Href,
  patient: (patientId: string): Href => ({ pathname: '/doctor/patients/[id]', params: { id: patientId } }),
  prescribe: (patientId: string, rxId?: string): Href => ({
    pathname: '/doctor/patients/prescribe',
    params: rxId ? { patientId, rxId } : { patientId },
  }),
  note: (patientId: string): Href => ({ pathname: '/doctor/patients/note', params: { patientId } }),
  thread: (patientId: string, doctorId: string): Href => `/doctor/messages/${threadIdFor(patientId, doctorId)}` as Href,
};

/** Pop this nested stack if possible; otherwise (deep link / web refresh) replace with `fallback`. */
export function goBackOr(fallback: Href): void {
  if (router.canDismiss()) router.back();
  else router.replace(fallback);
}

/** First value of a route param (expo-router params may be arrays). */
export function paramValue(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v : undefined;
}
