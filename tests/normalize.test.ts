import { describe, it, expect } from 'vitest';
import { normalizeText, normalizeForMatch, tokenize } from '../src/lib/normalize';

describe('normalize', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeText('  a\n\t b   c ')).toBe('a b c');
  });
  it('expands ligatures', () => {
    expect(normalizeForMatch('of\uFB01ce')).toBe('office');
  });
  it('straightens curly quotes and dashes', () => {
    expect(normalizeText('\u201Chi\u201D \u2014 there')).toBe('"hi" - there');
  });
  it('removes soft-hyphen line-wrap artifacts', () => {
    expect(normalizeForMatch('some\u00AD thing')).toBe('something');
  });
  it('is symmetric: same transform for doc and quote', () => {
    const doc = normalizeForMatch('The  Tenant\u2019s Deposit');
    const quote = normalizeForMatch("the tenant's deposit");
    expect(doc).toContain(quote);
  });
  it('tokenizes to lowercase words', () => {
    expect(tokenize('Hello   World')).toEqual(['hello', 'world']);
  });
});
