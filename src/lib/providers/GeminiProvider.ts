/**
 * GeminiProvider.ts — live analysis via Google Gemini (native PDF understanding).
 * Runs SERVER-SIDE only. The API key is read from the environment and never
 * reaches the client bundle.
 */
import { GoogleGenAI } from '@google/genai';
import { GEMINI_RESPONSE_SCHEMA, validateAnalysis, type AnalysisResult } from '../schema';
import { buildSystemInstruction, USER_TURN } from './prompt';
import { withRetry } from '../retry';
import type { AIProvider, AnalyzeRequest } from './AIProvider';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini' as const;
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_GEMINI_MODEL) {
    if (!apiKey) throw new Error('GeminiProvider requires an API key');
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async analyze(req: AnalyzeRequest): Promise<AnalysisResult> {
    const response = await withRetry(() => this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'application/pdf', data: req.pdfBase64 } },
            { text: USER_TURN },
          ],
        },
      ],
      config: {
        systemInstruction: buildSystemInstruction(req),
        responseMimeType: 'application/json',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: GEMINI_RESPONSE_SCHEMA as any,
        temperature: 0.1,
      },
    }), { retries: 3, baseDelayMs: 800 });

    const text = response.text;
    if (!text) throw new Error('Empty response from model');
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error('Model did not return valid JSON');
    }
    const result = validateAnalysis(raw);
    if (!result.ok) {
      throw new Error(`Model output failed schema validation: ${result.errors.join('; ')}`);
    }
    return result.data;
  }
}
