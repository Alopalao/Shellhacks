import { describe, expect, it, vi } from 'vitest';
import {
  cleanLabelText,
  createEvidenceClient,
  labelCitation,
  keyFinding,
  otcWarningHighlights,
  parseConnectFeed,
  parseHealthTopicsXml,
  parsePubMedXml,
  pubmedCitation,
  repairConnectSummary,
  summarizeBoxedWarning,
  summarizeSection,
} from '../src/evidence';
import { EvidenceError, HttpClient, RateLimiter, TtlCache, type FetchLike } from '../src/evidence/http';
import { formatAuthors, htmlToBlocks, stripTracking, takeSentences } from '../src/evidence/text';

const PUBMED_XML = `<?xml version="1.0"?><PubmedArticleSet><PubmedArticle><MedlineCitation><PMID Version="1">36049498</PMID>
<Article><Journal><JournalIssue><PubDate><Year>2022</Year><Month>Oct</Month></PubDate></JournalIssue><Title>Lancet (London, England)</Title><ISOAbbreviation>Lancet</ISOAbbreviation></Journal>
<ArticleTitle>Effect of statin therapy on muscle symptoms: an <i>individual</i> participant data meta-analysis.</ArticleTitle>
<Abstract><AbstractText Label="BACKGROUND">Statins are widely used.</AbstractText><AbstractText Label="INTERPRETATION">Statin therapy caused a small excess of mostly mild muscle pain &amp; most reports were not due to the statin.</AbstractText></Abstract>
<AuthorList><Author><LastName>Smith</LastName><Initials>J</Initials></Author><Author><LastName>Doe</LastName><Initials>A</Initials></Author><Author><CollectiveName>CTT Collaboration</CollectiveName></Author></AuthorList>
<PublicationTypeList><PublicationType UI="D016428">Journal Article</PublicationType><PublicationType UI="D017418">Meta-Analysis</PublicationType></PublicationTypeList>
</Article></MedlineCitation></PubmedArticle></PubmedArticleSet>`;

const WSEARCH_XML = `<?xml version="1.0"?><nlmSearchResult><count>2</count><list>
<document rank="0" url="https://medlineplus.gov/stroke.html?utm_source=x">
<content name="title">&lt;span class="qt0"&gt;Stroke&lt;/span&gt;</content>
<content name="altTitle">Brain Attack</content>
<content name="snippet">A &lt;span class="qt0"&gt;stroke&lt;/span&gt; happens ...</content>
<content name="FullSummary">What is a &lt;span class="qt0"&gt;stroke&lt;/span&gt;?&lt;p&gt;A stroke happens when blood flow stops.&lt;/p&gt;What are the symptoms?&lt;ul&gt;&lt;li&gt;Face drooping&lt;/li&gt;&lt;li&gt;Arm weakness&lt;/li&gt;&lt;/ul&gt;</content>
</document></list></nlmSearchResult>`;

describe('PubMed parsing', () => {
  it('extracts title, journal, year, authors, types and conclusion', () => {
    const [article] = parsePubMedXml(PUBMED_XML);
    expect(article).toMatchObject({
      pmid: '36049498',
      title: 'Effect of statin therapy on muscle symptoms: an individual participant data meta-analysis.',
      journal: 'Lancet',
      year: '2022',
      authors: ['Smith J', 'Doe A', 'CTT Collaboration'],
      publicationTypes: ['Journal Article', 'Meta-Analysis'],
      url: 'https://pubmed.ncbi.nlm.nih.gov/36049498/',
    });
    expect(article!.conclusion).toBe('Statin therapy caused a small excess of mostly mild muscle pain & most reports were not due to the statin.');
    const citation = pubmedCitation(article!);
    expect(citation).toMatchObject({ source: 'PubMed', publisher: 'Lancet', year: '2022', authors: 'Smith J, et al.', pmid: '36049498' });
  });

  it('uses the closing sentences as the key finding for unstructured abstracts', () => {
    const [article] = parsePubMedXml(PUBMED_XML);
    const unstructured = { ...article!, conclusion: null, abstract: 'One. Two. Three. The final result was clear. Use it wisely.' };
    expect(keyFinding(unstructured)).toBe('The final result was clear. Use it wisely.');
  });

  it('never starts a key finding on a dangling connective or back-reference', () => {
    const [article] = parsePubMedXml(PUBMED_XML);
    const withConnective = { ...article!, conclusion: null, abstract: 'Heart failure is common. Outcomes vary. Care improved. As a consequence, AHF is still associated with high mortality. Early decongestion helps.' };
    expect(keyFinding(withConnective)).toBe('AHF is still associated with high mortality. Early decongestion helps.');
    const referential = { ...article!, conclusion: null, abstract: 'SGLT2 inhibitors reduce heart failure admissions. Trials enrolled many patients. Results were consistent. These findings support use. This extends prior work.' };
    expect(keyFinding(referential)).toBe('SGLT2 inhibitors reduce heart failure admissions.');
  });
});

describe('MedlinePlus parsing', () => {
  it('parses health topics with highlight markup and structured summaries', () => {
    const [topic] = parseHealthTopicsXml(WSEARCH_XML);
    expect(topic).toMatchObject({ title: 'Stroke', url: 'https://medlineplus.gov/stroke.html', altTitles: ['Brain Attack'] });
    expect(topic!.blocks).toEqual([
      { kind: 'heading', text: 'What is a stroke?' },
      { kind: 'paragraph', text: 'A stroke happens when blood flow stops.' },
      { kind: 'heading', text: 'What are the symptoms?' },
      { kind: 'item', text: 'Face drooping' },
      { kind: 'item', text: 'Arm weakness' },
    ]);
  });

  it('repairs flattened MedlinePlus Connect drug summaries', () => {
    expect(
      repairConnectSummary('Atorvastatin is used to    reduce the risk of stroke  decrease cholesterol (a fat) Atorvastatin is in a class called statins.', 'Atorvastatin'),
    ).toBe('Atorvastatin is used to: reduce the risk of stroke; decrease cholesterol (a fat). Atorvastatin is in a class called statins.');
  });

  it('picks the drug page matching the dosage form', () => {
    const feed = {
      feed: {
        entry: [
          { title: { _value: 'Fluticasone Nasal Spray' }, link: [{ href: 'https://medlineplus.gov/druginfo/meds/a695002.html?utm_source=x' }], summary: { _value: 'Nasal.' } },
          { title: { _value: 'Fluticasone Oral Inhalation' }, link: [{ href: 'https://medlineplus.gov/druginfo/meds/a601056.html' }], summary: { _value: 'Inhaled.' } },
        ],
      },
    };
    expect(parseConnectFeed(feed, 'inhaler')?.title).toBe('Fluticasone Oral Inhalation');
    expect(parseConnectFeed(feed, null)?.url).toBe('https://medlineplus.gov/druginfo/meds/a695002.html');
  });
});

describe('FDA label helpers', () => {
  it('strips headings and cross-references', () => {
    expect(cleanLabelText('7 DRUG INTERACTIONS • NSAIDS: Increased risk (7.3) [see Warnings (5.2)]', 'interactions')).toBe('• NSAIDS: Increased risk');
    expect(cleanLabelText('ADVERSE REACTIONS Headache. To report SUSPECTED ADVERSE REACTIONS, contact Acme, Inc. at 1-800-FDA-1088 or www.fda.gov/medwatch.')).toBe('Headache.');
  });

  it('summarizes highlight bullets with their intro', () => {
    const summary = summarizeSection(
      'Lisinopril is an ACE inhibitor indicated for: • Treatment of hypertension • Adjunct therapy for heart failure 1.1 Hypertension Lisinopril is indicated for…',
      500,
    );
    expect(summary).toEqual({ intro: 'Lisinopril is an ACE inhibitor indicated for:', items: ['Treatment of hypertension', 'Adjunct therapy for heart failure'] });
  });

  it('dedupes boxed warnings and extracts OTC warnings', () => {
    expect(
      summarizeBoxedWarning('WARNING: FETAL TOXICITY • When pregnancy is detected, discontinue lisinopril. WARNING: FETAL TOXICITY • When pregnancy is detected, discontinue lisinopril.'),
    ).toEqual({ title: 'Fetal toxicity', text: 'When pregnancy is detected, discontinue lisinopril.' });
    expect(otcWarningHighlights('Allergy alert: May cause a severe reaction. Symptoms include hives. Stomach bleeding warning: Contains an NSAID. More text.')).toEqual([
      'Allergy alert: May cause a severe reaction.',
      'Stomach bleeding warning: Contains an NSAID.',
    ]);
  });
});

describe('FDA label choice and text', () => {
  const labelResult = (setId: string, extra: Record<string, unknown>, openfda: Record<string, unknown> = {}) => ({
    set_id: setId,
    effective_time: '20250101',
    indications_and_usage: ['Indicated to improve glycemic control in adults with type 2 diabetes mellitus.'],
    dosage_and_administration: ['Take with meals.'],
    warnings_and_cautions: ['Lactic acidosis.'],
    adverse_reactions: ['Diarrhea.'],
    openfda: { generic_name: ['METFORMIN HYDROCHLORIDE'], brand_name: ['Metformin Hydrochloride'], substance_name: ['METFORMIN HYDROCHLORIDE'], product_type: ['HUMAN PRESCRIPTION DRUG'], ...openfda },
    ...extra,
  });

  function labelClient(results: unknown[]) {
    const fetchImpl: FetchLike = async (url) =>
      decodeURIComponent(url).includes('generic_name:"metformin"') ? new Response(JSON.stringify({ results })) : new Response('{}', { status: 404 });
    return createEvidenceClient({ offline: false }, { fetch: fetchImpl });
  }

  it('prefers the immediate-release label unless extended-release is asked for', async () => {
    const er = labelResult('er-set', { spl_product_data_elements: ['Metformin Hydrochloride Extended-Release Tablets'], information_for_patients: ['x'] });
    const ir = labelResult('ir-set', { spl_product_data_elements: ['Metformin Hydrochloride Tablets'] });
    expect((await labelClient([er, ir]).drugLabel('metformin', { form: 'tablet' }))?.setId).toBe('ir-set');
    expect((await labelClient([er, ir]).drugLabel('metformin', { form: 'tablet', extendedRelease: true }))?.setId).toBe('er-set');
  });

  it('names the strength OTC directions are written for', async () => {
    const otc = labelResult(
      'apap-set',
      { active_ingredient: ['Active ingredient (in each caplet) Acetaminophen 500 mg'], dosage_and_administration: ['do not take more than 6 caplets in 24 hours'] },
      { generic_name: ['ACETAMINOPHEN'], brand_name: ['Acetaminophen'], substance_name: ['ACETAMINOPHEN'], product_type: ['HUMAN OTC DRUG'] },
    );
    const fetchImpl: FetchLike = async () => new Response(JSON.stringify({ results: [otc] }));
    const label = await createEvidenceClient({ offline: false }, { fetch: fetchImpl }).drugLabel('acetaminophen', { preferOtc: true });
    expect(label?.strength).toBe('500 mg caplet');
    expect(labelCitation(label!).title).toBe('Acetaminophen, 500 mg caplet — Drug Facts label');
  });

  it('keeps multi-word PLR headings together', () => {
    const text =
      'Intracranial Hypertension (Pseudotumor Cerebri): Avoid concomitant use with tetracyclines Serious Skin Reactions: Monitor for serious skin reactions and discontinue treatment if they occur Acute Pancreatitis: If pancreatitis symptoms occur, discontinue treatment 5.1 Embryo-Fetal Toxicity …';
    expect(summarizeSection(text, 1000, 5).items).toEqual([
      'Intracranial Hypertension (Pseudotumor Cerebri): Avoid concomitant use with tetracyclines',
      'Serious Skin Reactions: Monitor for serious skin reactions and discontinue treatment if they occur',
      'Acute Pancreatitis: If pancreatitis symptoms occur, discontinue treatment',
    ]);
    expect(summarizeBoxedWarning('WARNING: EMBRYO-FETAL TOXICITY - CONTRAINDICATED IN PREGNANCY Isotretinoin can cause birth defects.')).toEqual({
      title: 'Embryo-fetal toxicity - contraindicated in pregnancy',
      text: 'Isotretinoin can cause birth defects.',
    });
  });
});

describe('RxNorm names', () => {
  it('ignores dose-form concepts such as "pills" or "injection"', async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes('/rxcui.json')) return new Response(JSON.stringify({ idGroup: { rxnormId: [url.includes('name=pills') ? '1151133' : '1364430'] } }));
      if (url.includes('/rxcui/1151133/properties')) return new Response(JSON.stringify({ properties: { name: 'Pill', tty: 'DFG' } }));
      if (url.includes('/rxcui/1364430/properties')) return new Response(JSON.stringify({ properties: { name: 'apixaban', tty: 'IN' } }));
      return new Response('{}', { status: 404 });
    };
    const client = createEvidenceClient({ offline: false }, { fetch: fetchImpl });
    expect(await client.rxcuiForName('pills')).toBeNull();
    expect(await client.rxcuiForName('capsule')).toBeNull(); // known dose-form word: not even looked up
    expect(await client.rxcuiForName('apixaban')).toBe('1364430');
  });
});

describe('text helpers', () => {
  it('formats authors, truncates by sentence and strips tracking params', () => {
    expect(formatAuthors(['Smith J'])).toBe('Smith J');
    expect(formatAuthors(['Smith J', 'Doe A', 'Roe B'])).toBe('Smith J, et al.');
    expect(takeSentences('One two. Three four. Five six.', 20)).toBe('One two. Three four.');
    expect(stripTracking('https://medlineplus.gov/a.html?utm_source=x&utm_medium=y')).toBe('https://medlineplus.gov/a.html');
    expect(htmlToBlocks('<p>Hi <b>there</b></p>')).toEqual([{ kind: 'paragraph', text: 'Hi there' }]);
  });
});

describe('HttpClient', () => {
  const ok = (body: string, status = 200) => new Response(body, { status });

  it('caches responses and de-duplicates in-flight requests', async () => {
    const fetchSpy = vi.fn<FetchLike>(async () => ok('{"a":1}'));
    const http = new HttpClient({ fetch: fetchSpy });
    const [a, b] = await Promise.all([http.get('https://x.test/a'), http.get('https://x.test/a')]);
    await http.get('https://x.test/a');
    expect(a.text).toBe('{"a":1}');
    expect(b.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0]![1]!;
    expect((init.headers as Record<string, string>)['User-Agent']).toBe('BRIAN-demo/1.0');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('treats 404 as an empty result and other errors as EvidenceError', async () => {
    const http = new HttpClient({ fetch: async (url) => (url.endsWith('missing') ? ok('{}', 404) : ok('oops', 500)) });
    await expect(http.get('https://x.test/missing')).resolves.toMatchObject({ status: 404 });
    await expect(http.get('https://x.test/broken')).rejects.toBeInstanceOf(EvidenceError);
  });

  it('times out slow requests', async () => {
    const http = new HttpClient({
      timeoutMs: 20,
      fetch: (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('timeout'), { name: 'TimeoutError' })));
        }),
    });
    await expect(http.get('https://x.test/slow')).rejects.toThrow(/timed out/);
  });

  it('spaces requests with the rate limiter', async () => {
    const limiter = new RateLimiter(40);
    const starts: number[] = [];
    await Promise.all([0, 1, 2].map(() => limiter.schedule(async () => starts.push(Date.now()))));
    expect(starts[2]! - starts[0]!).toBeGreaterThanOrEqual(70);
  });

  it('expires cache entries', () => {
    let now = 0;
    const cache = new TtlCache<string>(10, () => now);
    cache.set('k', 'v', 100);
    expect(cache.get('k')).toBe('v');
    now = 101;
    expect(cache.get('k')).toBeUndefined();
  });
});

describe('createEvidenceClient', () => {
  it('returns nothing and makes no calls when offline', async () => {
    const fetchSpy = vi.fn<FetchLike>();
    const client = createEvidenceClient({ offline: true }, { fetch: fetchSpy });
    expect(await client.searchPubMed('stroke')).toEqual([]);
    expect(await client.searchMedlinePlus('stroke')).toEqual([]);
    expect(await client.drugLabel('lisinopril')).toBeNull();
    expect(await client.normalizeDrug('lisinopril')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('prefers reviews, falls back to plain relevance, and identifies itself to NCBI', async () => {
    const urls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      urls.push(url);
      if (url.includes('esearch')) {
        const reviews = decodeURIComponent(url).includes('review[pt]');
        return new Response(JSON.stringify({ esearchresult: { idlist: reviews ? ['36049498'] : ['36049498', '111'] } }));
      }
      return new Response(PUBMED_XML);
    };
    const client = createEvidenceClient({ offline: false, ncbiEmail: 'dev@brian.test', ncbiApiKey: 'k' }, { fetch: fetchImpl });
    const articles = await client.searchPubMed('statin muscle', { max: 2 });
    expect(articles.map((a) => a.pmid)).toEqual(['36049498']);
    expect(urls).toHaveLength(3); // esearch (reviews) → esearch (relevance) → efetch
    // Animal-only research is filtered out of both searches.
    expect(urls.slice(0, 2).every((u) => decodeURIComponent(u.replace(/\+/g, ' ')).includes('NOT (animals[mh] NOT humans[mh])'))).toBe(true);
    expect(urls.every((u) => u.includes('tool=brian') && u.includes('email=dev%40brian.test') && u.includes('api_key=k'))).toBe(true);
    expect(urls[2]).toContain('id=36049498%2C111');
  });
});
