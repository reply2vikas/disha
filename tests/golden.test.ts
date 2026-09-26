import { describe, it, expect } from 'vitest';
import { matchEvidence, type DocumentIndex, type CharSource } from '../src/lib/evidenceMatcher';
import { normalizeForMatch } from '../src/lib/normalize';

/** Documented golden corpus: extraction artefacts must not break grounding. */
function idx(text: string): DocumentIndex {
  const matchText = normalizeForMatch(text);
  const bbox: [number, number, number, number] = [0, 0, 1, 1];
  const charSources: Array<CharSource | null> = Array.from({ length: matchText.length }, () => ({ page: 0, bbox }));
  return { matchText, charSources, scannedPages: new Set(), pageCount: 1 };
}

const DOC =
  'The security deposit shall be six (6) months of rent. ' +
  'The office premises shall be kept in good repair. ' +
  'Either party may terminate with thirty (30) days notice. ' +
  'The premises are let on an "as is" basis.';

const CASES: Array<{ name: string; quote: string; expect: string[] }> = [
  { name: 'ligature (office)', quote: 'oﬃce premises', expect: ['grounded', 'grounded_fuzzy'] },
  { name: 'curly quotes', quote: '\u201Cas is\u201D', expect: ['grounded', 'grounded_fuzzy'] },
  { name: 'soft hyphen', quote: 'secu\u00ADrity deposit', expect: ['grounded', 'grounded_fuzzy'] },
  { name: 'hyphenated line-break', quote: 'thirty-\n(30) days', expect: ['grounded', 'grounded_fuzzy', 'ungrounded'] },
  { name: 'regex metacharacters', quote: 'six (6) months', expect: ['grounded', 'grounded_fuzzy'] },
  { name: 'misleading near-match', quote: 'the security deposit shall be five (5) months of pay', expect: ['ungrounded', 'grounded_fuzzy'] },
  { name: 'fabricated content', quote: 'the landlord shall pay the tenant a bonus', expect: ['ungrounded'] },
];

describe('golden evidence corpus', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const r = matchEvidence(c.quote, null, idx(DOC));
      expect(c.expect).toContain(r.status);
    });
  }
});
