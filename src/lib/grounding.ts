/**
 * grounding.ts — merge Pipeline A (model analysis) with Pipeline B (deterministic
 * matcher) into a display model. Pure and fully unit-testable.
 */
import { matchEvidence, type DocumentIndex, type GroundingResult } from './evidenceMatcher';
import { scanStatutory, type StatutoryFlag } from './jurisdiction';
import type { JurisdictionId } from './domain';
import type { AnalysisResult, AttentionItem, KeyFact, Obligation } from './schema';

export interface Grounded<T> {
  item: T;
  grounding: GroundingResult;
}

export interface GroundedAnalysis {
  base: AnalysisResult;
  key_facts: Array<Grounded<KeyFact>>;
  obligations: Array<Grounded<Obligation>>;
  attention_items: Array<Grounded<AttentionItem>>;
  /** Deterministic statutory flags found in the document text (jurisdiction-aware). */
  statutoryFlags: StatutoryFlag[];
  /** Share of quoted items that are grounded or grounded_fuzzy (0..1). */
  groundedRatio: number;
}

const isGrounded = (g: GroundingResult): boolean =>
  g.status === 'grounded' || g.status === 'grounded_fuzzy';

export function groundAnalysis(
  base: AnalysisResult,
  index: DocumentIndex,
  jurisdiction: JurisdictionId = 'generic',
): GroundedAnalysis {
  const key_facts = base.key_facts.map((item) => ({
    item,
    grounding: item.exact_quote
      ? matchEvidence(item.exact_quote, item.page_hint, index)
      : ({ status: 'ungrounded', spans: [], reason: 'No quote provided' } as GroundingResult),
  }));
  const obligations = base.obligations.map((item) => ({
    item,
    grounding: matchEvidence(item.exact_quote, item.page_hint, index),
  }));
  const attention_items = base.attention_items.map((item) => ({
    item,
    grounding: matchEvidence(item.exact_quote, item.page_hint, index),
  }));

  const all = [...key_facts, ...obligations, ...attention_items].filter(
    (g) => 'exact_quote' in g.item && g.item.exact_quote,
  );
  const groundedCount = all.filter((g) => isGrounded(g.grounding)).length;
  const groundedRatio = all.length === 0 ? 1 : groundedCount / all.length;

  return { base, key_facts, obligations, attention_items, statutoryFlags: scanStatutory(index.matchText, jurisdiction), groundedRatio };
}
