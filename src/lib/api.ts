/**
 * api.ts — client-side wrapper for the analyze endpoint. The PDF is sent once
 * to the server for the model call; grounding happens locally afterward.
 */
import { validateAnalysis, type AnalysisResult } from './schema';
import type { AnalyzeContext } from './providers/AIProvider';

export interface AnalyzeApiResult {
  provider: 'gemini' | 'demo';
  analysis: AnalysisResult;
}

export async function analyzeDocument(
  pdfBase64: string,
  ctx: AnalyzeContext,
): Promise<AnalyzeApiResult> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64, ...ctx }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((detail as { error?: string }).error ?? `Analyze failed (${res.status})`);
  }
  const body = (await res.json()) as { provider: 'gemini' | 'demo'; analysis: unknown };
  const validated = validateAnalysis(body.analysis);
  if (!validated.ok) throw new Error('Server returned malformed analysis');
  return { provider: body.provider, analysis: validated.data };
}
