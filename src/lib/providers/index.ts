/**
 * index.ts — provider selection. Live Gemini when a key is present; Demo otherwise.
 * Called only on the server (where the key lives).
 */
import { GeminiProvider, DEFAULT_GEMINI_MODEL } from './GeminiProvider';
import { DemoProvider } from './DemoProvider';
import type { AIProvider } from './AIProvider';

export function selectProvider(env: {
  GEMINI_API_KEY?: string | undefined;
  GEMINI_MODEL?: string | undefined;
}): AIProvider {
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
    return new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);
  }
  return new DemoProvider();
}

export type { AIProvider } from './AIProvider';
export { GeminiProvider } from './GeminiProvider';
export { DemoProvider } from './DemoProvider';
