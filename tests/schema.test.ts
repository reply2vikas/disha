import { describe, it, expect } from 'vitest';
import { validateAnalysis, GEMINI_RESPONSE_SCHEMA } from '../src/lib/schema';

const valid = {
  document_type: 'Lease',
  jurisdiction_note: 'India norms.',
  contextual_summary: 'A short but sufficient summary of the document.',
  key_facts: [],
  obligations: [],
  attention_items: [
    { id: 'a1', title: 'X', clause_category: 'penalties', why_it_matters: 'because', severity: 'high', exact_quote: 'q', page_hint: 1 },
  ],
  questions_for_professional: ['ask this'],
  uncertainty_notes: ['unclear thing'],
  disclaimer: 'Not legal advice, consult a professional.',
};

describe('analysis schema', () => {
  it('accepts a valid payload', () => {
    const r = validateAnalysis(valid);
    expect(r.ok).toBe(true);
  });
  it('rejects a missing required field', () => {
    const bad = { ...valid } as Record<string, unknown>;
    delete bad.disclaimer;
    const r = validateAnalysis(bad);
    expect(r.ok).toBe(false);
  });
  it('rejects an invalid severity enum', () => {
    const bad = { ...valid, attention_items: [{ ...valid.attention_items[0], severity: 'extreme' }] };
    expect(validateAnalysis(bad).ok).toBe(false);
  });
  it('rejects unknown top-level fields (strict)', () => {
    const bad = { ...valid, evidence_status: 'verified' };
    expect(validateAnalysis(bad).ok).toBe(false);
  });
  it('never declares evidence_status in the model schema', () => {
    const json = JSON.stringify(GEMINI_RESPONSE_SCHEMA);
    expect(json).not.toContain('evidence_status');
    expect(json).not.toContain('grounding');
  });
});
