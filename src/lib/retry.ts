/**
 * retry.ts — retry a promise-returning fn with exponential backoff, but only for
 * transient upstream conditions (503 overloaded, 429 rate limit, UNAVAILABLE).
 * Keeps a live demo resilient to Gemini "high demand" spikes.
 */
const TRANSIENT = /\b(503|429|unavailable|overloaded|high demand|rate limit|try again)\b/i;

export function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return TRANSIENT.test(msg);
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number; isRetryable?: (e: unknown) => boolean } = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseDelayMs ?? 800;
  const retryable = opts.isRetryable ?? isTransient;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt === retries || !retryable(e)) throw e;
      await sleep(base * 2 ** attempt);
    }
  }
  throw lastErr;
}
