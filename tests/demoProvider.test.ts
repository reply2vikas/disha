import { describe, it, expect } from 'vitest';
import { DemoProvider } from '../src/lib/providers/DemoProvider';

describe('DemoProvider', () => {
  const p = new DemoProvider();
  it('returns a prepared context', async () => {
    const a = await p.analyze({ pdfBase64: '', role: 'tenant', concern: 'financial-exposure', jurisdiction: 'india' });
    expect(a.document_type).toMatch(/lease/i);
  });
  it('rejects an unprepared context', async () => {
    await expect(
      p.analyze({ pdfBase64: '', role: 'employer', concern: 'data-privacy', jurisdiction: 'india' }),
    ).rejects.toThrow(/prepared contexts/i);
  });
});
