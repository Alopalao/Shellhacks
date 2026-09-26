// Routes into and out of visit notes.

/** Patient note screen. */
export function patientNoteHref(noteId: string): string {
  return `/patient/care/notes/${encodeURIComponent(noteId)}`;
}

/** "Explain this with BRIAN": opens the AI in explain-note mode and sends the prompt automatically. */
export function explainNoteHref(noteId: string): string {
  const prompt = encodeURIComponent("Explain my doctor's note in plain language");
  return `/patient/ai?mode=explain-note&noteId=${encodeURIComponent(noteId)}&autoSend=1&prompt=${prompt}`;
}
