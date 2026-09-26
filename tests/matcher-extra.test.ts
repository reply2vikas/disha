import { describe, it, expect } from 'vitest';
import { matchEvidence, type DocumentIndex, type CharSource } from '../src/lib/evidenceMatcher';
import { normalizeForMatch } from '../src/lib/normalize';

/** Build a genuine TWO-page index to exercise Tier-2 page_hint disambiguation. */
function twoPageIndex(): DocumentIndex {
  const p0 = normalizeForMatch('the notice period is thirty days');
  const p1 = normalizeForMatch('the notice period is sixty days');
  const matchText = `${p0} ${p1}`;
  const sources: Array<CharSource | null> = [];
  const bbox: [number, number, number, number] = [0, 0, 1, 1];
  for (let i = 0; i < p0.length; i++) sources.push({ page: 0, bbox });
  sources.push({ page: 0, bbox }); // the joining space
  for (let i = 0; i < p1.length; i++) sources.push({ page: 1, bbox });
  return { matchText, charSources: sources, scannedPages: new Set(), pageCount: 2 };
}

describe('matcher — page disambiguation & edges', () => {
  const idx = twoPageIndex();

  it('same phrase on two pages is ambiguous without a hint', () => {
    expect(matchEvidence('the notice period is', null, idx).status).toBe('ambiguous');
  });
  it('page_hint 1 resolves to page 0', () => {
    const r = matchEvidence('the notice period is', 1, idx);
    expect(r.status).toBe('grounded');
    expect(r.spans[0]?.page).toBe(0);
  });
  it('page_hint 2 resolves to page 1', () => {
    const r = matchEvidence('the notice period is', 2, idx);
    expect(r.status).toBe('grounded');
    expect(r.spans[0]?.page).toBe(1);
  });
  it('a page-unique phrase grounds without a hint', () => {
    expect(matchEvidence('thirty days', null, idx).status).toBe('grounded');
    expect(matchEvidence('sixty days', null, idx).status).toBe('grounded');
  });
  it('a wrong page_hint on a duplicate stays ambiguous', () => {
    expect(matchEvidence('the notice period is', 9, idx).status).toBe('ambiguous');
  });
  it('casing differences on a page-unique phrase still ground', () => {
    expect(matchEvidence('THIRTY DAYS', null, idx).status).toBe('grounded');
  });
});
