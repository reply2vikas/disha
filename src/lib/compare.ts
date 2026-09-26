/**
 * compare.ts — role-aware comparison of two analyses of the same document type.
 *
 * Compares findings by clause category and severity to detect what changed
 * between a base document and a revised one, from the reader's perspective.
 * Pure and fully unit-testable. "Weakened" means worse for the declared reader
 * (higher severity); "strengthened" means better (lower severity).
 */
import type { AnalysisResult, AttentionItem, Severity } from './schema';
import type { ClauseCategory, RoleId } from './domain';

const SEVERITY_RANK: Record<Severity, number> = { info: 1, caution: 2, high: 3 };

export type DiffStatus = 'added' | 'removed' | 'weakened' | 'strengthened' | 'unchanged';

export interface ClauseDiff {
  category: ClauseCategory;
  status: DiffStatus;
  description: string;
  baseQuote?: string;
  revisedQuote?: string;
}

function worst(items: AttentionItem[]): AttentionItem | undefined {
  return items.reduce<AttentionItem | undefined>((acc, it) => {
    if (!acc) return it;
    return SEVERITY_RANK[it.severity] > SEVERITY_RANK[acc.severity] ? it : acc;
  }, undefined);
}

function groupByCategory(items: AttentionItem[]): Map<ClauseCategory, AttentionItem[]> {
  const map = new Map<ClauseCategory, AttentionItem[]>();
  for (const it of items) {
    const cat = it.clause_category as ClauseCategory;
    const arr = map.get(cat) ?? [];
    arr.push(it);
    map.set(cat, arr);
  }
  return map;
}

export function compareAnalyses(
  base: AnalysisResult,
  revised: AnalysisResult,
  role: RoleId,
): ClauseDiff[] {
  const baseMap = groupByCategory(base.attention_items);
  const revisedMap = groupByCategory(revised.attention_items);
  const categories = new Set<ClauseCategory>([...baseMap.keys(), ...revisedMap.keys()]);
  const diffs: ClauseDiff[] = [];

  for (const cat of categories) {
    const b = worst(baseMap.get(cat) ?? []);
    const r = worst(revisedMap.get(cat) ?? []);

    if (!b && r) {
      diffs.push({ category: cat, status: 'added', description: `New clause affecting ${role}: ${r.title}`, revisedQuote: r.exact_quote });
    } else if (b && !r) {
      diffs.push({ category: cat, status: 'removed', description: `Clause no longer present: ${b.title}`, baseQuote: b.exact_quote });
    } else if (b && r) {
      const db = SEVERITY_RANK[r.severity] - SEVERITY_RANK[b.severity];
      if (db > 0) {
        diffs.push({ category: cat, status: 'weakened', description: `Worse for ${role}: severity rose from ${b.severity} to ${r.severity}.`, baseQuote: b.exact_quote, revisedQuote: r.exact_quote });
      } else if (db < 0) {
        diffs.push({ category: cat, status: 'strengthened', description: `Better for ${role}: severity fell from ${b.severity} to ${r.severity}.`, baseQuote: b.exact_quote, revisedQuote: r.exact_quote });
      } else {
        diffs.push({ category: cat, status: 'unchanged', description: `No material change in ${cat}.`, baseQuote: b.exact_quote, revisedQuote: r.exact_quote });
      }
    }
  }
  return diffs;
}

/** Ordering weight so the UI can surface the most consequential changes first. */
export function diffWeight(status: DiffStatus): number {
  switch (status) {
    case 'weakened': return 4;
    case 'added': return 3;
    case 'removed': return 2;
    case 'strengthened': return 1;
    case 'unchanged': return 0;
  }
}

/**
 * contextDifferentiation — how differently the model reasoned across two
 * contexts (0 = identical prioritisation, 1 = fully disjoint). Signature of a
 * finding = category + severity. Used to prove the analysis is context-aware
 * rather than a generic summary (Problem-Alignment evidence).
 */
export function contextDifferentiation(a: AnalysisResult, b: AnalysisResult): number {
  const sig = (r: AnalysisResult): Set<string> =>
    new Set(r.attention_items.map((i) => `${i.clause_category}:${i.severity}`));
  const sa = sig(a);
  const sb = sig(b);
  if (sa.size === 0 && sb.size === 0) return 0;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : 1 - inter / union;
}
