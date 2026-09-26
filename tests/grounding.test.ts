import { describe, it, expect } from 'vitest';
import { groundAnalysis } from '../src/lib/grounding';
import { indexFromPlainText } from '../src/lib/pdfText';
import { DEMO_DOCUMENT_TEXT, findDemoAnalysis } from '../src/lib/providers/demoData';

describe('groundAnalysis', () => {
  const index = indexFromPlainText(DEMO_DOCUMENT_TEXT);

  it('grounds a prepared analysis at ratio 1', () => {
    const analysis = findDemoAnalysis('tenant', 'financial-exposure');
    expect(analysis).not.toBeNull();
    const g = groundAnalysis(analysis!, index);
    expect(g.groundedRatio).toBe(1);
    expect(g.attention_items.every((a) => a.grounding.status === 'grounded')).toBe(true);
  });

  it('flags an injected unverifiable quote as ungrounded', () => {
    const analysis = findDemoAnalysis('tenant', 'financial-exposure');
    const tampered = {
      ...analysis!,
      attention_items: [
        ...analysis!.attention_items,
        {
          id: 'evil',
          title: 'Fabricated clause',
          clause_category: 'other',
          why_it_matters: 'model hallucinated this',
          severity: 'high' as const,
          exact_quote: 'The tenant agrees to forfeit their firstborn child.',
          page_hint: 1,
        },
      ],
    };
    const g = groundAnalysis(tampered, index);
    const evil = g.attention_items.find((a) => a.item.id === 'evil');
    expect(evil?.grounding.status).toBe('ungrounded');
    expect(g.groundedRatio).toBeLessThan(1);
  });
});
