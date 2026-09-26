/**
 * DemoProvider.ts — no-key path. Returns one of the prepared analyses and
 * REFUSES any context that was not explicitly prepared (guarded by tests).
 */
import type { AnalysisResult } from '../schema';
import type { AIProvider, AnalyzeRequest } from './AIProvider';
import { findDemoAnalysis } from './demoData';

export class DemoProvider implements AIProvider {
  readonly id = 'demo' as const;

  analyze(req: AnalyzeRequest): Promise<AnalysisResult> {
    const analysis = findDemoAnalysis(req.role, req.concern);
    if (!analysis) {
      return Promise.reject(
        new Error('Demo mode supports only the prepared contexts. Add an API key for live analysis.'),
      );
    }
    return Promise.resolve(analysis);
  }
}
