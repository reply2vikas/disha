import { describe, it, expect } from 'vitest';
import { validateAnalysis } from '../src/lib/schema';

const base = {
  document_type: 'Lease',
  jurisdiction_note: 'India.',
  contextual_summary: 'A sufficiently long summary of the document.',
  key_facts: [],
  obligations: [],
  attention_items: [
    { id: 'a1', title: 'X', clause_category: 'penalties', why_it_matters: 'y', severity: 'high', exact_quote: 'q', page_hint: 2 },
  ],
  questions_for_professional: [],
  uncertainty_notes: [],
  disclaimer: 'Not legal advice; consult a professional.',
};

describe('schema — extra validation', () => {
  it('accepts optional plain_explanation + suggested_questions', () => {
    const item = { ...base.attention_items[0], plain_explanation: 'simple', suggested_questions: ['ask this?'] };
    const r = validateAnalysis({ ...base, attention_items: [item] });
    expect(r.ok).toBe(true);
  });
  it('rejects a zero or negative page_hint', () => {
    const item = { ...base.attention_items[0], page_hint: 0 };
    expect(validateAnalysis({ ...base, attention_items: [item] }).ok).toBe(false);
  });
  it('rejects an empty required string', () => {
    const item = { ...base.attention_items[0], title: '' };
    expect(validateAnalysis({ ...base, attention_items: [item] }).ok).toBe(false);
  });
  it('rejects an unknown nested field (strict)', () => {
    const item = { ...base.attention_items[0], evidence_status: 'verified' };
    expect(validateAnalysis({ ...base, attention_items: [item] }).ok).toBe(false);
  });
  it('rejects a non-string suggested_question', () => {
    const item = { ...base.attention_items[0], suggested_questions: [42] };
    expect(validateAnalysis({ ...base, attention_items: [item] }).ok).toBe(false);
  });
  it('accepts a fully-populated valid payload', () => {
    expect(validateAnalysis(base).ok).toBe(true);
  });
});
