// /api/threads — patient ↔ doctor messaging. Thread id = `${patientId}__${doctorId}`.
import { Router } from 'express';
import { currentUser, type ServerContext } from '../context';
import { newId } from '../db/ids';
import { findUser, lastMessageOf, patientsOf, threadIdFor, unreadCountFor } from '../db/queries';
import type { ChatMessage, MessageAttachment, Thread, User } from '../shared/contracts';
import { assertThreadAccess } from './access';
import { emitTo, hrefs, notify, preview, displayName } from './events';
import { badRequest } from './http';
import { messagesQuerySchema, sendMessageSchema } from './schemas';

function buildThread(ctx: ServerContext, viewer: User, patient: User, doctor: User): Thread {
  const id = threadIdFor(patient.id, doctor.id);
  return {
    id,
    patientId: patient.id,
    doctorId: doctor.id,
    counterpart: viewer.id === patient.id ? doctor : patient,
    lastMessage: lastMessageOf(ctx.db.data, id),
    unreadCount: unreadCountFor(ctx.db.data, id, viewer.id),
  };
}

export function createThreadsRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const viewer = currentUser(res);
    const data = ctx.db.data;
    let threads: Thread[];
    if (viewer.role === 'patient') {
      const doctor = findUser(data, viewer.doctorId);
      threads = doctor ? [buildThread(ctx, viewer, viewer, doctor)] : [];
    } else {
      threads = patientsOf(data, viewer.id)
        .map((patient) => buildThread(ctx, viewer, patient, viewer))
        .sort((a, b) => {
          const aAt = a.lastMessage?.createdAt ?? '';
          const bAt = b.lastMessage?.createdAt ?? '';
          return bAt.localeCompare(aAt) || a.counterpart.name.localeCompare(b.counterpart.name);
        });
    }
    res.json({ threads });
  });

  router.get('/:threadId/messages', (req, res) => {
    const viewer = currentUser(res);
    const access = assertThreadAccess(ctx.db.data, viewer, req.params.threadId);
    const { limit, before } = messagesQuerySchema.parse(req.query);
    const beforeMs = before ? Date.parse(before) : Number.POSITIVE_INFINITY;
    const messages = ctx.db.data.messages
      .filter((m) => m.threadId === access.threadId && Date.parse(m.createdAt) < beforeMs)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-limit);
    res.json({ messages });
  });

  router.post('/:threadId/messages', (req, res) => {
    const viewer = currentUser(res);
    const data = ctx.db.data;
    const access = assertThreadAccess(data, viewer, req.params.threadId);
    const input = sendMessageSchema.parse(req.body);

    let attachment: MessageAttachment | null = null;
    if (input.attachment?.type === 'visit-note') {
      const noteId = input.attachment.noteId;
      if (!data.visitNotes.some((n) => n.id === noteId && n.patientId === access.patient.id)) {
        throw badRequest('That visit note does not belong to this conversation.');
      }
      attachment = { type: 'visit-note', noteId };
    } else if (input.attachment?.type === 'prescription') {
      const prescriptionId = input.attachment.prescriptionId;
      if (!data.prescriptions.some((p) => p.id === prescriptionId && p.patientId === access.patient.id)) {
        throw badRequest('That medication does not belong to this conversation.');
      }
      attachment = { type: 'prescription', prescriptionId };
    }

    const message: ChatMessage = {
      id: newId('msg'),
      threadId: access.threadId,
      patientId: access.patient.id,
      doctorId: access.doctor.id,
      senderId: viewer.id,
      body: input.body,
      createdAt: new Date().toISOString(),
      readAt: null,
      attachment,
    };
    data.messages.push(message);
    ctx.db.save();

    emitTo(ctx, [access.patient.id, access.doctor.id], 'message:new', message);
    const recipient = access.other;
    notify(ctx, recipient.id, {
      kind: 'message',
      title: displayName(viewer),
      body: preview(message.body),
      href: recipient.role === 'patient' ? hrefs.patient.chat : hrefs.doctor.thread(access.threadId),
    });
    res.status(201).json({ message });
  });

  router.post('/:threadId/read', (req, res) => {
    const viewer = currentUser(res);
    const access = assertThreadAccess(ctx.db.data, viewer, req.params.threadId);
    const readAt = new Date().toISOString();
    let changed = 0;
    for (const m of ctx.db.data.messages) {
      if (m.threadId === access.threadId && m.senderId !== viewer.id && m.readAt === null) {
        m.readAt = readAt;
        changed += 1;
      }
    }
    if (changed > 0) {
      ctx.db.save();
      emitTo(ctx, [access.patient.id, access.doctor.id], 'message:read', {
        threadId: access.threadId,
        readerId: viewer.id,
        readAt,
      });
    }
    res.json({ ok: true });
  });

  return router;
}
