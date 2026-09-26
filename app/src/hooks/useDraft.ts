import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Editable local copy ("draft") of server-backed values, for forms.
 *
 * When `saved` changes underneath the form — a demo reset, a save, the same account editing on
 * another device — the draft follows it, unless the user has unsaved edits (those are kept).
 * `same(a, b)` decides whether two values are equivalent (e.g. ignoring surrounding whitespace);
 * `!same(draft, saved)` is the form's "dirty" flag.
 *
 *   const [draft, setDraft] = useDraft(toDraft(user), sameDraft);
 */
export function useDraft<T>(saved: T, same: (a: T, b: T) => boolean): [T, Dispatch<SetStateAction<T>>] {
  const [draft, setDraft] = useState<T>(saved);
  // The saved value the draft was last based on (adjusting state during render, per the React docs'
  // "storing information from previous renders" pattern — no effect, no stale frame).
  const [base, setBase] = useState<T>(saved);
  if (!same(base, saved)) {
    setBase(saved);
    if (same(draft, base)) setDraft(saved);
  }
  return [draft, setDraft];
}
