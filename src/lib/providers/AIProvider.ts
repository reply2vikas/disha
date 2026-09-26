/**
 * AIProvider.ts — the analysis contract. Providers are interchangeable
 * (Gemini for live analysis, Demo for the no-key path). Both return a value
 * already validated against the analysis schema.
 */
import type { AnalysisResult } from '../schema';
import type { ConcernId, JurisdictionId, RoleId } from '../domain';

export interface AnalyzeContext {
  role: RoleId;
  concern: ConcernId;
  jurisdiction: JurisdictionId;
}

export interface AnalyzeRequest extends AnalyzeContext {
  /** Base64 PDF bytes (no data: prefix). Sent once to the server, never persisted. */
  pdfBase64: string;
}

export interface AIProvider {
  readonly id: 'gemini' | 'demo';
  analyze(req: AnalyzeRequest): Promise<AnalysisResult>;
}
