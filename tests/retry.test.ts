import { describe, it, expect, vi } from 'vitest';
import { withRetry, isTransient } from '../src/lib/retry';

describe('retry', () => {
  it('classifies transient errors', () => {
    expect(isTransient(new Error('got status 503 Service Unavailable'))).toBe(true);
    expect(isTransient(new Error('UNAVAILABLE: high demand'))).toBe(true);
    expect(isTransient(new Error('API key not valid'))).toBe(false);
  });

  it('retries a transient failure then succeeds', async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      if (n < 3) throw new Error('503 overloaded');
      return 'ok';
    });
    const out = await withRetry(fn, { retries: 3, baseDelayMs: 1 });
    expect(out).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-transient error', async () => {
    const fn = vi.fn(async () => { throw new Error('API key not valid'); });
    await expect(withRetry(fn, { retries: 3, baseDelayMs: 1 })).rejects.toThrow(/not valid/);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
