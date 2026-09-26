// Live smoke test against the real public APIs. Skipped unless LIVE=1:
//   LIVE=1 npx vitest run test/evidence-live.test.ts
import { describe, expect, it } from 'vitest';
import { createEvidenceClient } from '../src/evidence';

const live = process.env.LIVE === '1';

describe.skipIf(!live)('evidence sources (live network)', () => {
  const client = createEvidenceClient({ offline: false, ncbiEmail: process.env.NCBI_EMAIL, ncbiApiKey: process.env.NCBI_API_KEY });

  it('searches PubMed', async () => {
    const articles = await client.searchPubMed('statin*[ti] AND muscle[ti]', { max: 3 });
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0]!.url).toMatch(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/);
  }, 20_000);

  it('searches MedlinePlus health topics', async () => {
    const topics = await client.searchMedlinePlus('stroke', { max: 2 });
    expect(topics.map((t) => t.url)).toContain('https://medlineplus.gov/stroke.html');
  }, 20_000);

  it('finds FDA labels, MedlinePlus drug pages and RxNorm concepts', async () => {
    const [label, page, normalized] = await Promise.all([
      client.drugLabel('lisinopril'),
      client.medlinePlusDrug({ name: 'lisinopril', rxcui: '29046' }),
      client.normalizeDrug('Lipitor'),
    ]);
    expect(label?.sections.interactions).toMatch(/NSAID/i);
    expect(label?.dailyMedUrl).toMatch(/^https:\/\/dailymed\.nlm\.nih\.gov\/dailymed\/lookup\.cfm\?setid=/);
    expect(page?.url).toBe('https://medlineplus.gov/druginfo/meds/a692051.html');
    expect(normalized).toMatchObject({ name: 'atorvastatin', rxcui: '83367' });
  }, 30_000);
});
