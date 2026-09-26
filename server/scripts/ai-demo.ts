// Live quality check for the AI doctor in demo (mock) mode with real evidence lookups.
//   npx tsx scripts/ai-demo.ts                 → the four standard demo questions
//   npx tsx scripts/ai-demo.ts "your question" → a single custom question (as the demo patient)
//   BRIAN_EVIDENCE_OFFLINE=1 npx tsx scripts/ai-demo.ts   → offline behaviour
// Uses an in-memory copy of the seed data; nothing is written to disk.

import { config } from '../src/config';
import type { Db, DbData } from '../src/context';
import { AiService } from '../src/ai/service';
import { createSeedData } from '../src/db/seed';
import type { AiChatRequest, User } from '../src/shared/contracts';

async function main(): Promise<void> {
  const data: DbData = createSeedData(new Date());
  const db: Db = { data, save: () => undefined, reset: () => undefined };
  const service = new AiService({ config: { ...config, anthropicApiKey: '' }, db, claude: null });

  const patient = data.users.find((u) => u.email === 'patient@brian.demo') as User;
  const doctor = data.users.find((u) => u.email === 'doctor@brian.demo') as User;
  const note = data.visitNotes
    .filter((n) => n.patientId === patient.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const custom = process.argv.slice(2).join(' ').trim();
  const cases: Array<{ label: string; user: User; request: AiChatRequest }> = custom
    ? [{ label: 'custom', user: patient, request: { message: custom } }]
    : [
        { label: '(a) explain the visit note', user: patient, request: { message: "Can you explain my doctor's note?", mode: 'explain-note', context: { noteId: note?.id } } },
        { label: '(b) ibuprofen + lisinopril', user: patient, request: { message: 'Can I take ibuprofen with lisinopril?', mode: 'medication' } },
        { label: '(c) possible stroke', user: patient, request: { message: "my dad's face is drooping and he can't lift his arm" } },
        { label: '(d) stroke signs (educational)', user: patient, request: { message: 'what are the signs of a stroke?' } },
        { label: '(e) clinician evidence', user: doctor, request: { message: 'Evidence for statin-associated muscle symptoms management' } },
      ];

  for (const c of cases) {
    const started = Date.now();
    const { reply } = await service.chat(c.user, c.request);
    console.log(`\n${'═'.repeat(90)}\n${c.label}  —  ${Date.now() - started} ms  —  mocked=${reply.mocked}`);
    if (reply.triage) console.log(`TRIAGE [${reply.triage.level}] ${reply.triage.title}\n  ${reply.triage.message}\n  actions: ${reply.triage.actions.map((a) => `${a.label}${a.phone ? ` (${a.phone})` : ''}`).join(' | ')}`);
    console.log(`${'─'.repeat(90)}\n${reply.content}\n${'─'.repeat(90)}`);
    for (const citation of reply.citations ?? []) {
      console.log(`[${citation.id}] ${citation.source} · ${citation.title}${citation.year ? ` (${citation.year})` : ''}\n     ${citation.url}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
