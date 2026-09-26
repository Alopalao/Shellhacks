import { router } from 'expo-router';
import { EmptyState } from '@/components/ui';
import { isApiRequestError } from '@/lib/api';
import { doctorHrefs } from '../navigation';

/**
 * True when a patient's chart can't be opened because the patient doesn't exist (404) or isn't
 * assigned to this doctor (403) — retrying won't help, unlike a network error.
 */
export function isPatientUnavailable(error: unknown): boolean {
  return isApiRequestError(error) && (error.status === 404 || error.status === 403);
}

/** "Patient not found" / "not your patient" state with a single way back to the patient list. */
export function PatientUnavailable({ error }: { error: unknown }) {
  const reassigned = isApiRequestError(error) && error.status === 403;
  return (
    <EmptyState
      icon="person-remove-outline"
      title={reassigned ? 'Chart not available' : 'Patient not found'}
      message={
        reassigned
          ? "This patient isn't assigned to you — they may have switched to another physician."
          : 'This link may be out of date, or the patient is no longer on your list.'
      }
      actionLabel="Back to patients"
      onAction={() => router.replace(doctorHrefs.patients)}
    />
  );
}
