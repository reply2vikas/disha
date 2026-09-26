import { describe, it, expect } from 'vitest';
import { scanStatutoryRaw, scanStatutory } from '../src/lib/jurisdiction';
import { normalizeForMatch } from '../src/lib/normalize';

describe('statutory-flag engine (India-first)', () => {
  it('flags a non-compete clause under Section 27', () => {
    const flags = scanStatutoryRaw('The Employee shall not compete for two years post termination.', 'india');
    expect(flags.some((f) => f.statuteRef.includes('Section 27'))).toBe(true);
  });

  it('flags forfeiture/penalty under Section 74', () => {
    const flags = scanStatutoryRaw('the entire security deposit shall stand forfeited', 'india');
    expect(flags.some((f) => f.statuteRef.includes('Section 74'))).toBe(true);
    expect(flags.every((f) => !/advice/i.test(f.note))).toBe(true); // informational, not advice
  });

  it('flags arbitration and data clauses', () => {
    const arb = scanStatutoryRaw('Disputes shall be referred to a sole arbitrator.', 'india');
    expect(arb.some((f) => f.statuteRef.includes('Arbitration'))).toBe(true);
    const data = scanStatutoryRaw('We will process your personal data per our privacy policy.', 'india');
    expect(data.some((f) => f.statuteRef.includes('DPDP') || f.statuteRef.includes('Digital Personal Data'))).toBe(true);
  });

  it('generic jurisdiction carries no statutory flags', () => {
    expect(scanStatutory(normalizeForMatch('non-compete and forfeiture'), 'generic')).toHaveLength(0);
  });
});
