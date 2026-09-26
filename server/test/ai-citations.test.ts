import { describe, expect, it } from 'vitest';
import { SourceList, finalizeCitations, stripCitationMarkers } from '../src/ai/citations';

function sources(count: number) {
  const list = new SourceList();
  for (let i = 1; i <= count; i++) list.add({ source: 'MedlinePlus', title: `Source ${i}`, url: `https://medlineplus.gov/s${i}.html` });
  return list;
}

describe('SourceList', () => {
  it('numbers sources and de-duplicates by URL', () => {
    const list = new SourceList();
    expect(list.add({ source: 'PubMed', title: 'A', url: 'https://pubmed.ncbi.nlm.nih.gov/1/' })).toBe('1');
    expect(list.add({ source: 'PubMed', title: 'B', url: 'https://pubmed.ncbi.nlm.nih.gov/2/' })).toBe('2');
    expect(list.add({ source: 'PubMed', title: 'A again', url: 'https://pubmed.ncbi.nlm.nih.gov/1' })).toBe('1');
    expect(list.size).toBe(2);
    expect(list.describe()).toContain('[2] B');
  });
});

describe('finalizeCitations', () => {
  it('drops markers without a matching source and renumbers by first use', () => {
    const { content, citations } = finalizeCitations('Alpha [3]. Beta [1] and [7]. Gamma [3].', sources(3).all());
    expect(content).toBe('Alpha [1]. Beta [2] and. Gamma [1].');
    expect(citations.map((c) => [c.id, c.title])).toEqual([
      ['1', 'Source 3'],
      ['2', 'Source 1'],
    ]);
  });

  it('expands grouped and ranged markers', () => {
    const { content, citations } = finalizeCitations('See [1, 3] and [2-3].', sources(3).all());
    expect(content).toBe('See [1][2] and [3][2].');
    expect(citations.map((c) => c.title)).toEqual(['Source 1', 'Source 3', 'Source 2']);
  });

  it('collapses repeated adjacent markers', () => {
    expect(finalizeCitations('Fact [2][2].', sources(2).all()).content).toBe('Fact [1].');
  });

  it('returns the top 3 retrieved sources when nothing is cited', () => {
    const { content, citations } = finalizeCitations('No citations here [9].', sources(5).all());
    expect(content).toBe('No citations here.');
    expect(citations.map((c) => c.id)).toEqual(['1', '2', '3']);
    expect(citations.map((c) => c.title)).toEqual(['Source 1', 'Source 2', 'Source 3']);
  });

  it('keeps ids consistent between text and citations', () => {
    const { content, citations } = finalizeCitations('One [4]. Two [2]. Three [4][5].', sources(5).all());
    const ids = new Set([...content.matchAll(/\[(\d+)\]/g)].map((m) => m[1]));
    expect([...ids].sort()).toEqual(citations.map((c) => c.id).sort());
    citations.forEach((c, i) => expect(c.id).toBe(String(i + 1)));
  });

  it('strips markers from prior assistant turns', () => {
    expect(stripCitationMarkers('Take it with food [1][2]. Ask [3, 4].')).toBe('Take it with food. Ask.');
  });
});
