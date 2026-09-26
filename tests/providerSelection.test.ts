import { describe, it, expect } from 'vitest';
import { selectProvider } from '../src/lib/providers/index';

describe('selectProvider', () => {
  it('returns demo when no key', () => {
    expect(selectProvider({}).id).toBe('demo');
    expect(selectProvider({ GEMINI_API_KEY: '  ' }).id).toBe('demo');
  });
  it('returns gemini when a key is present', () => {
    expect(selectProvider({ GEMINI_API_KEY: 'test-key' }).id).toBe('gemini');
  });
});
