// /api/notes — visit notes written by doctors, read by their patients.
import { Router } from 'express';
import { requireRole } from '../auth/middleware';
import { currentUser, type ServerContext } from '../context';
import { newId } from '../db/ids';
import { newestFirst } from '../db/queries';
import type { VisitNote } from '../shared/contracts';
import { assertPatientAccess, patientScope } from './access';
import { emitTo, hrefs, notify, shortName } from './events';
import { createNoteSchema, patientScopeQuerySchema } from './schemas';

export function createNotesRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const viewer = currentUser(res);
    const { patientId } = patientScopeQuerySchema.parse(req.query);
    const ids = new Set(patientScope(ctx.db.data, viewer, patientId));
    const notes = ctx.db.data.visitNotes.filter((n) => ids.has(n.patientId)).sort(newestFirst);
    res.json({ notes });
  });

  router.post('/', requireRole('doctor'), (req, res) => {
    const viewer = currentUser(res);
    const input = createNoteSchema.parse(req.body);
    const patient = assertPatientAccess(ctx.db.data, viewer, input.patientId);
    const note: VisitNote = {
      id: newId('note'),
      patientId: patient.id,
      doctorId: viewer.id,
      title: input.title,
      body: input.body,
      createdAt: new Date().toISOString(),
    };
    ctx.db.data.visitNotes.push(note);
    ctx.db.save();

    emitTo(ctx, [patient.id, viewer.id], 'note:new', note);
    notify(ctx, patient.id, {
      kind: 'note',
      title: 'New visit note',
      body: `${shortName(viewer)} shared “${note.title}”. Tap to read — BRIAN can explain it in plain language.`,
      href: hrefs.patient.note(note.id),
    });
    res.status(201).json({ note });
  });

  return router;
}
