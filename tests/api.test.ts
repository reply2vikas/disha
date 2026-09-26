import { describe, it, expect, vi, afterEach } from 'vitest';
import { analyzeDocument } from '../src/lib/api';
import { findDemoAnalysis } from '../src/lib/providers/demoData';

const ctx = { role: 'tenant', concern: 'financial-exposure', jurisdiction: 'india' } as const;

afterEach(() => vi.restoreAllMocks());

describe('analyzeDocument', () => {
  it('returns validated analysis on success', async () => {
    const analysis = findDemoAnalysis('tenant', 'financial-exposure');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ provider: 'demo', analysis }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )));
    const r = await analyzeDocument('', ctx);
    expect(r.provider).toBe('demo');
    expect(r.analysis.document_type).toMatch(/lease/i);
  });

  it('throws with server error message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ error: 'Demo mode supports only the prepared contexts.' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    )));
    await expect(analyzeDocument('', ctx)).rejects.toThrow(/prepared contexts/i);
  });
});
