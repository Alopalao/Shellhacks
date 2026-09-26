import { describe, expect, it } from 'vitest';
import { DEMO_FOOTER } from '../src/ai/mock';
import { AiHttpError, AiService, conversationTitle, inferMode } from '../src/ai/service';
import type { AiChatRequest, User } from '../src/shared/contracts';
import { citationMarkers, makeDb, stubEvidence, testConfig } from './ai-fixtures';

function setup(evidenceOptions: Parameters<typeof stubEvidence>[0] = {}) {
  const db = makeDb();
  const evidence = stubEvidence(evidenceOptions);
  const service = new AiService({ config: testConfig, db, evidence, claude: null, logger: { warn: () => undefined } });
  const user = (id: string) => db.data.users.find((u) => u.id === id) as User;
  return { db, evidence, service, maya: user('maya'), doc: user('doc'), otherDoc: user('otherdoc') };
}

function expectConsistentCitations(content: string, citations: Array<{ id: string }>) {
  const markers = new Set(citationMarkers(content));
  for (const id of markers) expect(citations.map((c) => c.id)).toContain(id);
  citations.forEach((c, i) => expect(c.id).toBe(String(i + 1)));
}

describe('AiService (demo mode, stubbed evidence)', () => {
  it('reports mock status without an API key', () => {
    const { service } = setup();
    expect(service.status()).toEqual({ provider: 'mock', model: null, evidence: { pubmed: true, medlineplus: true, openfda: true, rxnorm: true } });
  });

  it('explains a visit note line by line with cited drug pages', async () => {
    const { service, maya } = setup();
    const { reply, conversation } = await service.chat(maya, { message: "Explain my doctor's note", mode: 'explain-note', context: { noteId: 'note_maya' } });
    expect(reply.mocked).toBe(true);
    expect(reply.mode).toBe('explain-note');
    expect(reply.content).toContain('What your doctor wrote → what it means');
    expect(reply.content).toContain('Continue metformin 500 mg by mouth twice a day with meals.');
    expect(reply.content).toMatch(/\*\*New:\*\* Atorvastatin 20 mg by mouth at bedtime/);
    expect(reply.content).toContain('Questions to ask your doctor');
    expect(reply.content.endsWith(DEMO_FOOTER)).toBe(true);
    expect(reply.citations?.some((c) => c.url === 'https://medlineplus.gov/druginfo/meds/a600045.html')).toBe(true);
    expectConsistentCitations(reply.content, reply.citations ?? []);
    expect(conversation.messages).toHaveLength(2);
  });

  it('flags a label interaction with the patient’s medicine', async () => {
    const { service, maya, evidence } = setup();
    const { reply } = await service.chat(maya, { message: 'Can I take ibuprofen with lisinopril?', mode: 'medication' });
    expect(evidence.calls.labels).toEqual(expect.arrayContaining(['ibuprofen', 'lisinopril']));
    expect(reply.content).toContain('Check with your doctor or pharmacist before taking ibuprofen with lisinopril');
    expect(reply.content).toMatch(/NSAIDs, the group of medicines ibuprofen belongs to: increased risk of kidney problems/);
    expect(reply.content).toMatch(/ask a doctor first if you have \*\*high blood pressure\*\*/);
    const lisinoprilLabel = reply.citations?.find((c) => c.url.includes('lis-set'));
    expect(lisinoprilLabel?.source).toBe('openFDA');
    expectConsistentCitations(reply.content, reply.citations ?? []);
  });

  it('leads with emergency guidance and skips research for a live emergency', async () => {
    const { service, maya, evidence } = setup();
    const { reply } = await service.chat(maya, { message: "my dad's face is drooping and he can't lift his arm" });
    expect(reply.triage?.level).toBe('emergency');
    expect(reply.content.startsWith('### These can be signs of a stroke — call 911 now')).toBe(true);
    expect(reply.content).toContain('BE FAST');
    expect(reply.citations?.[0]?.url).toBe('https://medlineplus.gov/stroke.html');
    expect(evidence.calls.pubmed).toHaveLength(0);
  });

  it('teaches the warning signs for educational questions', async () => {
    const { service, maya, evidence } = setup();
    const { reply } = await service.chat(maya, { message: 'what are the signs of a stroke?' });
    expect(reply.triage?.level).toBe('info');
    expect(reply.content).toContain('Stroke warning signs: BE FAST');
    expect(reply.content).toContain('What the research says');
    expect(evidence.calls.pubmed.length).toBeGreaterThan(0);
    expectConsistentCitations(reply.content, reply.citations ?? []);
  });

  it('personalizes glossary answers', async () => {
    const { service, maya } = setup();
    const { reply } = await service.chat(maya, { message: 'What does BID mean?' });
    expect(reply.content).toContain('**BID** — Two times a day');
    expect(reply.content).toContain('**Metformin 500 mg** is taken twice a day');
  });

  it('warns about allergy conflicts', async () => {
    const { service, maya } = setup();
    const { reply } = await service.chat(maya, { message: 'My dentist wants me to take amoxicillin, is that ok?' });
    expect(reply.content).toContain('You have a listed allergy to Penicillin, and amoxicillin is a penicillin-type antibiotic');
  });

  it('still helps when evidence is offline', async () => {
    const { service, maya } = setup({ offline: true });
    const note = await service.chat(maya, { message: 'Explain this', context: { noteId: 'note_maya' } });
    expect(note.reply.content).toContain('Return to the clinic in 3 months, sooner as needed.');
    expect(note.reply.content).toContain('Live evidence lookups are turned off');
    const med = await service.chat(maya, { message: 'Can I take ibuprofen with lisinopril?' });
    expect(med.reply.content).toContain("BRIAN's built-in check");
    expect(med.reply.citations?.some((c) => c.url.startsWith('https://dailymed.nlm.nih.gov/dailymed/search.cfm'))).toBe(true);
    const stroke = await service.chat(maya, { message: 'I think I am having a stroke' });
    expect(stroke.reply.triage?.level).toBe('emergency');
    expect(stroke.reply.citations?.[0]?.url).toBe('https://medlineplus.gov/stroke.html');
  });

  it('degrades gracefully when every evidence service fails', async () => {
    const { service, maya } = setup({ failAll: true });
    const { reply } = await service.chat(maya, { message: 'Tell me about high blood pressure' });
    expect(reply.content).toMatch(/couldn't reach the medical reference services/);
    expect(reply.content).toContain('BRIAN is an AI health guide');
  });

  it('continues conversations and keeps titles short', async () => {
    const { service, maya, db } = setup();
    const long = 'I have a question about my blood pressure readings at home and whether they are normal for someone like me';
    const first = await service.chat(maya, { message: long });
    expect(first.conversation.title.length).toBeLessThanOrEqual(60);
    expect(first.conversation.title.endsWith('…')).toBe(true);
    const second = await service.chat(maya, { message: 'And what about exercise?', conversationId: first.conversation.id });
    expect(second.conversation.id).toBe(first.conversation.id);
    expect(second.conversation.messages).toHaveLength(4);
    expect(db.data.aiConversations).toHaveLength(1);
    expect(db.saves).toBe(2);
    expect(service.listConversations(maya)).toHaveLength(1);
  });

  it('enforces ownership of notes, prescriptions and conversations', async () => {
    const { service, maya, doc, otherDoc } = setup();
    const req = (context: AiChatRequest['context']): AiChatRequest & { message: string } => ({ message: 'Explain', context });
    await expect(service.chat(maya, req({ noteId: 'note_jordan' }))).rejects.toMatchObject({ status: 403 });
    await expect(service.chat(maya, req({ noteId: 'nope' }))).rejects.toMatchObject({ status: 404 });
    await expect(service.chat(maya, req({ prescriptionId: 'rx_flu' }))).rejects.toMatchObject({ status: 403 });
    await expect(service.chat(otherDoc, req({ noteId: 'note_jordan' }))).rejects.toBeInstanceOf(AiHttpError);
    const ok = await service.chat(doc, req({ noteId: 'note_jordan' }));
    expect(ok.reply.content).toContain('Plain-language version');
    const { conversation } = await service.chat(maya, { message: 'hello' });
    expect(() => service.getConversation(doc, conversation.id)).toThrow(AiHttpError);
    expect(() => service.deleteConversation(doc, conversation.id)).toThrow(/access/);
    service.deleteConversation(maya, conversation.id);
    expect(() => service.getConversation(maya, conversation.id)).toThrow(/not found/);
  });

  it('builds DrugInfo from the label and MedlinePlus', async () => {
    const { service } = setup();
    const info = await service.drugInfo('lisinopril');
    expect(info).toMatchObject({ name: 'Lisinopril', genericName: 'lisinopril', rxcui: 'rx-lisinopril', mocked: false });
    expect(info.sections.map((s) => s.title)).toEqual(['Uses', 'How to take', 'Warnings', 'Interactions']);
    expect(info.sections.find((s) => s.title === 'Warnings')?.text).toMatch(/Boxed warning \(fetal toxicity\)/);
    expect(info.citations.map((c) => c.source)).toEqual(['openFDA', 'MedlinePlus']);
    const offline = await setup({ offline: true }).service.drugInfo('ibuprofen');
    expect(offline.mocked).toBe(true);
    expect(offline.sections[0]?.text).toMatch(/NSAID/);
  });

  it('searches evidence', async () => {
    const { service } = setup();
    const result = await service.evidenceSearch('stroke');
    expect(result.citations.map((c) => c.source)).toEqual(['MedlinePlus', 'PubMed']);
    expect(result.citations.map((c) => c.id)).toEqual(['1', '2']);
  });
});

describe('helpers', () => {
  it('infers the mode from context', () => {
    expect(inferMode(undefined, { noteId: 'n' }, undefined)).toBe('explain-note');
    expect(inferMode(undefined, { drugName: 'x' }, undefined)).toBe('medication');
    expect(inferMode(undefined, { lessonTitle: 'x' }, undefined)).toBe('lesson');
    expect(inferMode(undefined, undefined, 'symptoms')).toBe('symptoms');
    expect(inferMode('general', { noteId: 'n' }, undefined)).toBe('general');
  });

  it('titles conversations from the first message', () => {
    expect(conversationTitle('  Short   question ')).toBe('Short question');
    expect(conversationTitle('x'.repeat(100)).length).toBeLessThanOrEqual(60);
  });
});
