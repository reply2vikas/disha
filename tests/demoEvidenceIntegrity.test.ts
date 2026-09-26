import { describe, it, expect } from 'vitest';
import { DEMO_CONTEXTS, DEMO_DOCUMENT_TEXT } from '../src/lib/providers/demoData';
import { indexFromPlainText } from '../src/lib/pdfText';
import { matchEvidence } from '../src/lib/evidenceMatcher';

/**
 * Guardrail: every quote shipped in demo data MUST ground against the demo
 * document. If someone edits demo copy and breaks a quote, this fails loudly.
 */
describe('demo evidence integrity', () => {
  const index = indexFromPlainText(DEMO_DOCUMENT_TEXT);

  for (const ctx of DEMO_CONTEXTS) {
    const quotes = [
      ...ctx.analysis.obligations.map((o) => o.exact_quote),
      ...ctx.analysis.attention_items.map((a) => a.exact_quote),
      ...ctx.analysis.key_facts.map((k) => k.exact_quote).filter((q): q is string => Boolean(q)),
    ];
    for (const q of quotes) {
      it(`[${ctx.label}] grounds: ${q.slice(0, 42)}…`, () => {
        const r = matchEvidence(q, 1, index);
        expect(['grounded', 'grounded_fuzzy']).toContain(r.status);
      });
    }
  }
});
