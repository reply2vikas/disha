/**
 * schema.ts — Single source of truth for the model's analysis output.
 *
 * Two consumers:
 *   1. GEMINI_RESPONSE_SCHEMA — passed as responseSchema to the Gemini API
 *      (structural enforcement at generation time).
 *   2. analysisSchema (Zod) — validates and strips the response on the server
 *      before it is ever trusted (defence in depth).
 *
 * INVARIANT: `grounding` / evidence status is ABSENT here. The model returns a
 * verbatim `exact_quote`; Pipeline B computes whether it is grounded. The model
 * is structurally unable to certify its own evidence.
 */
import { z } from 'zod';

export const SEVERITY = ['info', 'caution', 'high'] as const;
export type Severity = (typeof SEVERITY)[number];

const keyFact = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  exact_quote: z.string().nullable(),
  page_hint: z.number().int().positive().nullable(),
}).strict();

const obligation = z.object({
  id: z.string().min(1),
  who: z.string().min(1),
  what: z.string().min(1),
  exact_quote: z.string().min(1),
  page_hint: z.number().int().positive().nullable(),
}).strict();

const attentionItem = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  clause_category: z.string().min(1),
  why_it_matters: z.string().min(1),
  plain_explanation: z.string().min(1).nullable().optional(),
  severity: z.enum(SEVERITY),
  exact_quote: z.string().min(1),
  page_hint: z.number().int().positive().nullable(),
  suggested_questions: z.array(z.string().min(1)).optional(),
}).strict();

export const analysisSchema = z
  .object({
    document_type: z.string().min(1),
    jurisdiction_note: z.string().min(1),
    contextual_summary: z.string().min(10),
    key_facts: z.array(keyFact),
    obligations: z.array(obligation),
    attention_items: z.array(attentionItem),
    questions_for_professional: z.array(z.string().min(1)),
    uncertainty_notes: z.array(z.string().min(1)),
    disclaimer: z.string().min(10),
  })
  .strict();

export type KeyFact = z.infer<typeof keyFact>;
export type Obligation = z.infer<typeof obligation>;
export type AttentionItem = z.infer<typeof attentionItem>;
export type AnalysisResult = z.infer<typeof analysisSchema>;

/** Validate + strip unknown fields. Returns a discriminated result. */
export function validateAnalysis(
  raw: unknown,
): { ok: true; data: AnalysisResult } | { ok: false; errors: string[] } {
  const parsed = analysisSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => `${i.path.join('.') || '/'}: ${i.message}`),
  };
}

/**
 * Gemini responseSchema (Google Schema dialect). Kept in lockstep with the Zod
 * schema above. evidence status is intentionally not representable here.
 */
export const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    document_type: { type: 'string' },
    jurisdiction_note: { type: 'string' },
    contextual_summary: { type: 'string' },
    key_facts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          value: { type: 'string' },
          exact_quote: { type: 'string', nullable: true },
          page_hint: { type: 'integer', nullable: true },
        },
        required: ['id', 'label', 'value'],
      },
    },
    obligations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          who: { type: 'string' },
          what: { type: 'string' },
          exact_quote: { type: 'string' },
          page_hint: { type: 'integer', nullable: true },
        },
        required: ['id', 'who', 'what', 'exact_quote'],
      },
    },
    attention_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          clause_category: { type: 'string' },
          why_it_matters: { type: 'string' },
          plain_explanation: { type: 'string', nullable: true },
          severity: { type: 'string', enum: ['info', 'caution', 'high'] },
          exact_quote: { type: 'string' },
          page_hint: { type: 'integer', nullable: true },
          suggested_questions: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'title', 'clause_category', 'why_it_matters', 'severity', 'exact_quote'],
      },
    },
    questions_for_professional: { type: 'array', items: { type: 'string' } },
    uncertainty_notes: { type: 'array', items: { type: 'string' } },
    disclaimer: { type: 'string' },
  },
  required: [
    'document_type',
    'jurisdiction_note',
    'contextual_summary',
    'key_facts',
    'obligations',
    'attention_items',
    'questions_for_professional',
    'uncertainty_notes',
    'disclaimer',
  ],
} as const;
