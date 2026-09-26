/**
 * useAnalysis — runs analyze + local grounding, with an in-memory context cache
 * so switching role/concern/jurisdiction on the SAME document does not re-call
 * the model when a result is already cached.
 */
import { useCallback, useRef, useState } from 'react';
import { analyzeDocument } from '../lib/api';
import { groundAnalysis, type GroundedAnalysis } from '../lib/grounding';
import type { DocumentIndex } from '../lib/evidenceMatcher';
import type { AnalyzeContext } from '../lib/providers/AIProvider';
import type { AnalysisResult } from '../lib/schema';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: GroundedAnalysis; provider: 'gemini' | 'demo' }
  | { status: 'error'; error: string };

const key = (c: AnalyzeContext): string => `${c.role}:${c.concern}:${c.jurisdiction}`;

export function useAnalysis() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const cache = useRef<Map<string, { result: GroundedAnalysis; provider: 'gemini' | 'demo' }>>(new Map());

  const reset = useCallback(() => {
    cache.current.clear();
    setState({ status: 'idle' });
  }, []);

  const run = useCallback(
    async (index: DocumentIndex, ctx: AnalyzeContext, pdfBase64: string) => {
      const cached = cache.current.get(key(ctx));
      if (cached) {
        setState({ status: 'done', ...cached });
        return;
      }
      setState({ status: 'loading' });
      try {
        const { analysis, provider } = await analyzeDocument(pdfBase64, ctx);
        const result = groundAnalysis(analysis, index, ctx.jurisdiction);
        cache.current.set(key(ctx), { result, provider });
        setState({ status: 'done', result, provider });
      } catch (err) {
        setState({ status: 'error', error: err instanceof Error ? err.message : 'Analysis failed' });
      }
    },
    [],
  );

  /**
   * runLocal — ground a prepared analysis entirely on the client (demo mode).
   * No network call, so it works with or without a configured API key.
   */
  const runLocal = useCallback(
    (analysis: AnalysisResult | null, index: DocumentIndex, ctx: AnalyzeContext) => {
      if (!analysis) {
        setState({
          status: 'error',
          error: "This role/concern isn't in the demo. Upload a PDF for live analysis of any context.",
        });
        return;
      }
      const result = groundAnalysis(analysis, index, ctx.jurisdiction);
      cache.current.set(key(ctx), { result, provider: 'demo' });
      setState({ status: 'done', result, provider: 'demo' });
    },
    [],
  );

  return { state, run, runLocal, reset };
}
