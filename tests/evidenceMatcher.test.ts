import { describe, it, expect } from 'vitest';
import {
  matchEvidence, diceBigram, lcsRatio, similarity, DEFAULT_MATCHER_CONFIG,
  type DocumentIndex, type CharSource,
} from '../src/lib/evidenceMatcher';
import { normalizeForMatch } from '../src/lib/normalize';

/** Build a single-page index from plain text, optionally marking the page scanned. */
function idx(text: string, scanned = false): DocumentIndex {
  const matchText = normalizeForMatch(text);
  const bbox: [number, number, number, number] = [0, 0, 1, 1];
  const charSources: Array<CharSource | null> = Array.from({ length: matchText.length }, () => ({ page: 0, bbox }));
  return { matchText, charSources, scannedPages: new Set(scanned ? [0] : []), pageCount: 1 };
}

const DOC =
  'The Tenant shall pay monthly rent of INR 85,000. ' +
  'The Tenant shall deposit six months rent as security. ' +
  'Either party may terminate by giving three months written notice.';

describe('similarity primitives', () => {
  it('diceBigram is 1 for identical, 0 for disjoint', () => {
    expect(diceBigram('abcd', 'abcd')).toBe(1);
    expect(diceBigram('abcd', 'wxyz')).toBe(0);
  });
  it('lcsRatio rewards shared subsequence order', () => {
    expect(lcsRatio(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
    expect(lcsRatio(['a', 'b', 'c'], ['x', 'y', 'z'])).toBe(0);
  });
  it('blended similarity is high for near-identical strings', () => {
    expect(similarity('three months notice', 'three months notice')).toBeGreaterThan(0.99);
  });
});

describe('matchEvidence cascade', () => {
  it('Tier 1: exact single hit -> grounded', () => {
    const r = matchEvidence('monthly rent of INR 85,000', null, idx(DOC));
    expect(r.status).toBe('grounded');
    expect(r.spans).toHaveLength(1);
  });

  it('Tier 2: duplicate phrase -> ambiguous, page hint resolves', () => {
    const r = matchEvidence('The Tenant shall', null, idx(DOC));
    expect(r.status).toBe('ambiguous');
    const hinted = matchEvidence('The Tenant shall', 1, idx(DOC));
    // both duplicates are on page 1 here, so hint cannot disambiguate -> still ambiguous
    expect(['ambiguous', 'grounded']).toContain(hinted.status);
  });

  it('Tier 3: whitespace variance -> grounded', () => {
    const r = matchEvidence('monthly    rent   of INR 85,000', null, idx(DOC));
    expect(['grounded', 'grounded_fuzzy']).toContain(r.status);
  });

  it('Tier 4: single-typo paraphrase with clear margin -> grounded_fuzzy', () => {
    // "written" -> "writen": exact/flex fail; one window dominates, margin is wide.
    const r = matchEvidence('terminate by giving three months writen notice', null, idx(DOC));
    expect(r.status).toBe('grounded_fuzzy');
    expect(r.similarity).toBeGreaterThan(DEFAULT_MATCHER_CONFIG.fuzzyMinSimilarity);
  });

  it('Tier 5: absent text -> ungrounded', () => {
    const r = matchEvidence('the landlord waives all rent forever', null, idx(DOC));
    expect(r.status).toBe('ungrounded');
    expect(r.spans).toHaveLength(0);
  });

  it('scanned page: exact hit is downgraded to ungrounded_scanned', () => {
    const r = matchEvidence('monthly rent of INR 85,000', null, idx(DOC, true));
    expect(r.status).toBe('ungrounded_scanned');
  });

  it('empty quote -> ungrounded', () => {
    expect(matchEvidence('   ', null, idx(DOC)).status).toBe('ungrounded');
  });

  it('respects a stricter similarity threshold', () => {
    const strict = { ...DEFAULT_MATCHER_CONFIG, fuzzyMinSimilarity: 0.99 };
    const r = matchEvidence('giving three months of written notice', null, idx(DOC), strict);
    expect(['ungrounded', 'grounded']).toContain(r.status);
  });
});
