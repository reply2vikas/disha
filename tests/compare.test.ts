import { describe, it, expect } from 'vitest';
import { compareAnalyses, diffWeight, contextDifferentiation } from '../src/lib/compare';
import { findDemoAnalysis } from '../src/lib/providers/demoData';
import type { AnalysisResult } from '../src/lib/schema';

const base = findDemoAnalysis('tenant', 'financial-exposure')!;

function clone(a: AnalysisResult): AnalysisResult {
  return JSON.parse(JSON.stringify(a)) as AnalysisResult;
}

describe('compareAnalyses', () => {
  it('reports unchanged when identical', () => {
    const diffs = compareAnalyses(base, clone(base), 'tenant');
    expect(diffs.every((d) => d.status === 'unchanged')).toBe(true);
  });

  it('detects a weakened (worse) clause when a category severity rises', () => {
    const low = clone(base);
    low.attention_items.forEach((i) => { i.severity = 'info'; });
    const diffs = compareAnalyses(low, base, 'tenant');
    expect(diffs.some((d) => d.status === 'weakened')).toBe(true);
  });

  it('detects added and removed clauses', () => {
    const revised = clone(base);
    revised.attention_items = revised.attention_items.slice(0, 1); // remove some categories
    const diffs = compareAnalyses(base, revised, 'tenant');
    expect(diffs.some((d) => d.status === 'removed')).toBe(true);
    // reverse: base has fewer than revised -> added
    const diffs2 = compareAnalyses(revised, base, 'tenant');
    expect(diffs2.some((d) => d.status === 'added')).toBe(true);
  });

  it('weakened outranks strengthened in ordering weight', () => {
    expect(diffWeight('weakened')).toBeGreaterThan(diffWeight('strengthened'));
  });
});

describe('contextDifferentiation', () => {
  it('is > 0 for two genuinely different contexts', () => {
    const landlord = findDemoAnalysis('landlord', 'exit-termination')!;
    expect(contextDifferentiation(base, landlord)).toBeGreaterThan(0);
  });
  it('is 0 for identical analyses', () => {
    expect(contextDifferentiation(base, clone(base))).toBe(0);
  });
});
