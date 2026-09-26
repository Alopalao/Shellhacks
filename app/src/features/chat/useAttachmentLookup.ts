// Resolves message attachments (visit notes, prescriptions) to titles for the attachment cards.
// Fetches lazily — only when the thread contains attachments we can't name yet — and stays live
// through `note:new` / `prescription:upsert`.
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Prescription, Role, VisitNote } from '@/lib/contracts';
import { useSocket, useSocketEvent } from '@/lib/socket';
import type { LocalMessage } from './types';

export interface AttachmentLookup {
  note: (noteId: string) => VisitNote | undefined;
  prescription: (prescriptionId: string) => Prescription | undefined;
}

export function useAttachmentLookup(options: {
  viewerRole: Role;
  patientId: string;
  messages: readonly LocalMessage[];
}): AttachmentLookup {
  const { viewerRole, patientId, messages } = options;
  const { connectCount } = useSocket();
  const [notes, setNotes] = useState<Record<string, VisitNote>>({});
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription>>({});

  const missing: string[] = [];
  for (const m of messages) {
    const a = m.attachment;
    if (a?.type === 'visit-note' && !notes[a.noteId]) missing.push(`n:${a.noteId}`);
    if (a?.type === 'prescription' && !prescriptions[a.prescriptionId]) missing.push(`r:${a.prescriptionId}`);
  }
  const missingKey = [...new Set(missing)].sort().join('|');

  const attempted = useRef(new Set<string>());
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // After a reconnect, allow one more try for anything that failed while offline.
  useEffect(() => {
    attempted.current.clear();
  }, [connectCount]);

  useEffect(() => {
    if (!missingKey) return;
    const fresh = missingKey.split('|').filter((key) => !attempted.current.has(key));
    if (!fresh.length) return;
    fresh.forEach((key) => attempted.current.add(key));
    const scope = viewerRole === 'doctor' ? patientId : undefined;
    const wantNotes = fresh.some((key) => key.startsWith('n:'));
    const wantRx = fresh.some((key) => key.startsWith('r:'));
    void Promise.allSettled([
      wantNotes ? api.notes(scope) : Promise.resolve(null),
      wantRx ? api.prescriptions(scope) : Promise.resolve(null),
    ]).then(([noteResult, rxResult]) => {
      if (!alive.current) return;
      if (noteResult.status === 'fulfilled' && noteResult.value) {
        const list = noteResult.value;
        setNotes((prev) => ({ ...prev, ...Object.fromEntries(list.map((n) => [n.id, n])) }));
      } else if (noteResult.status === 'rejected') {
        fresh.filter((k) => k.startsWith('n:')).forEach((k) => attempted.current.delete(k));
      }
      if (rxResult.status === 'fulfilled' && rxResult.value) {
        const list = rxResult.value;
        setPrescriptions((prev) => ({ ...prev, ...Object.fromEntries(list.map((p) => [p.id, p])) }));
      } else if (rxResult.status === 'rejected') {
        fresh.filter((k) => k.startsWith('r:')).forEach((k) => attempted.current.delete(k));
      }
    });
  }, [missingKey, viewerRole, patientId, connectCount]);

  useSocketEvent('note:new', (note) => {
    if (note.patientId === patientId) setNotes((prev) => ({ ...prev, [note.id]: note }));
  });
  useSocketEvent('prescription:upsert', (rx) => {
    if (rx.patientId === patientId) setPrescriptions((prev) => ({ ...prev, [rx.id]: rx }));
  });

  return {
    note: (id) => notes[id],
    prescription: (id) => prescriptions[id],
  };
}
