/**
 * evidenceMatcher.ts — Pipeline B core (deterministic grounding).
 *
 * Given a `quote` emitted by the model and a DocumentIndex built from the real
 * PDF text, this decides — WITHOUT the model's involvement — whether the quote
 * actually appears in the document, and where. The model can never set this
 * status; that separation is the entire trust guarantee.
 *
 * Design bias (see ADR-0004): a false "grounded" is catastrophic; a false
 * "ungrounded" is merely unfortunate. Every threshold leans toward the honest
 * fallback.
 *
 * Cascade (cheapest first, stop at first decision):
 *   1. exact single hit                            -> grounded
 *   2. exact multiple hits (+page disambiguation)  -> grounded | ambiguous
 *   3. whitespace-flexible token regex             -> grounded | ambiguous
 *   4. sliding-window fuzzy (Dice bigram + LCS)     -> grounded_fuzzy
 *   5. no acceptable match                          -> ungrounded
 *   (any hit on a scanned/low-text page            -> ungrounded_scanned)
 *
 * All operations are in-memory. Nothing is sent to any server.
 */
import { normalizeForMatch } from './normalize';

export type GroundingStatus =
  | 'grounded'
  | 'grounded_fuzzy'
  | 'ambiguous'
  | 'ungrounded'
  | 'ungrounded_scanned';

export interface CharSource {
  /** 0-indexed page this character came from. */
  page: number;
  /** Bounding box in PDF user space: [x, y, width, height]. */
  bbox: [number, number, number, number];
}

export interface DocumentIndex {
  /** Full match-normalized (lower-cased) document text. */
  matchText: string;
  /** For each char position in matchText, the page/bbox it originated from. */
  charSources: Array<CharSource | null>;
  /** Pages classified as scanned / no reliable text layer. */
  scannedPages: ReadonlySet<number>;
  pageCount: number;
}

export interface GroundedSpan {
  start: number;
  end: number;
  page: number;
  bboxes: Array<[number, number, number, number]>;
}

export interface GroundingResult {
  status: GroundingStatus;
  spans: GroundedSpan[];
  similarity?: number;
  reason?: string;
}

export interface MatcherConfig {
  /** Minimum fuzzy similarity (0..1) to accept a Tier-4 match. Tune on a real corpus. */
  fuzzyMinSimilarity: number;
  /** Best must beat second-best by at least this margin (guards near-duplicate clauses). */
  fuzzyMinMargin: number;
  /** Fuzzy window = quote length scaled by 1 +/- this fraction. */
  fuzzyWindowPadding: number;
}

/** Conservative defaults — DERIVE final values from your own PDF corpus (ADR-0004). */
export const DEFAULT_MATCHER_CONFIG: MatcherConfig = {
  fuzzyMinSimilarity: 0.82,
  fuzzyMinMargin: 0.08,
  fuzzyWindowPadding: 0.25,
};

/** Dice coefficient over character bigrams — cheap, robust to small edits. */
export function diceBigram(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const ma = bigrams(a);
  const mb = bigrams(b);
  let overlap = 0;
  let totalA = 0;
  for (const c of ma.values()) totalA += c;
  let totalB = 0;
  for (const [g, cb] of mb) {
    totalB += cb;
    const ca = ma.get(g);
    if (ca !== undefined) overlap += Math.min(ca, cb);
  }
  return (2 * overlap) / (totalA + totalB);
}

/** Longest-common-subsequence ratio over token arrays (reordering tolerance). */
export function lcsRatio(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return 0;
  const w = n + 1;
  const dp = new Uint16Array((m + 1) * w);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i * w + j] =
        a[i - 1] === b[j - 1]
          ? dp[(i - 1) * w + (j - 1)]! + 1
          : Math.max(dp[(i - 1) * w + j]!, dp[i * w + (j - 1)]!);
    }
  }
  return (2 * dp[m * w + n]!) / (m + n);
}

/** Blended similarity: character-level (Dice) and token-order (LCS). */
export function similarity(quote: string, window: string): number {
  const nq = normalizeForMatch(quote);
  const nw = normalizeForMatch(window);
  const dice = diceBigram(nq, nw);
  const lcs = lcsRatio(nq.split(' ').filter(Boolean), nw.split(' ').filter(Boolean));
  return 0.55 * dice + 0.45 * lcs;
}

/** Merge per-char sources into page-grouped bounding boxes for a [start,end) span. */
function buildSpan(start: number, end: number, index: DocumentIndex): GroundedSpan {
  const boxesByKey = new Map<string, [number, number, number, number]>();
  let page = 0;
  for (let i = start; i < end && i < index.charSources.length; i++) {
    const src = index.charSources[i];
    if (!src) continue;
    page = src.page;
    const key = `${src.page}:${src.bbox.join(',')}`;
    if (!boxesByKey.has(key)) boxesByKey.set(key, src.bbox);
  }
  return { start, end, page, bboxes: [...boxesByKey.values()] };
}

function onScannedPage(span: GroundedSpan, index: DocumentIndex): boolean {
  return index.scannedPages.has(span.page);
}

function allIndexes(hay: string, needle: string): number[] {
  const out: number[] = [];
  if (needle.length === 0) return out;
  let from = 0;
  for (;;) {
    const pos = hay.indexOf(needle, from);
    if (pos === -1) break;
    out.push(pos);
    from = pos + 1;
  }
  return out;
}

export function matchEvidence(
  quote: string,
  pageHint: number | null | undefined,
  index: DocumentIndex,
  config: MatcherConfig = DEFAULT_MATCHER_CONFIG,
): GroundingResult {
  if (!quote || !quote.trim()) {
    return { status: 'ungrounded', spans: [], reason: 'Empty quote' };
  }
  const nq = normalizeForMatch(quote);

  // Tier 1 & 2 — exact normalized substring.
  const hits = allIndexes(index.matchText, nq).map((p) => buildSpan(p, p + nq.length, index));
  if (hits.length === 1) {
    const span = hits[0]!;
    if (onScannedPage(span, index)) {
      return { status: 'ungrounded_scanned', spans: [], reason: `Page ${span.page + 1} is scanned` };
    }
    return { status: 'grounded', spans: [span] };
  }
  if (hits.length > 1) {
    if (pageHint != null) {
      const hinted = hits.filter((s) => s.page === pageHint - 1);
      if (hinted.length === 1) return { status: 'grounded', spans: [hinted[0]!] };
    }
    return { status: 'ambiguous', spans: hits, reason: `Quote appears ${hits.length} times` };
  }

  // Tier 3 — whitespace-flexible token regex (handles line-wrap artifacts).
  const qTokens = nq.split(' ').filter(Boolean);
  if (qTokens.length > 0) {
    const escaped = qTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const flex = new RegExp(escaped.join('[\\s\\S]{0,4}'), 'g');
    const flexHits: GroundedSpan[] = [];
    let m: RegExpExecArray | null;
    while ((m = flex.exec(index.matchText)) !== null) {
      flexHits.push(buildSpan(m.index, m.index + m[0].length, index));
      if (m.index === flex.lastIndex) flex.lastIndex++;
    }
    if (flexHits.length === 1) {
      const span = flexHits[0]!;
      if (onScannedPage(span, index)) {
        return { status: 'ungrounded_scanned', spans: [], reason: `Page ${span.page + 1} is scanned` };
      }
      return { status: 'grounded', spans: [span] };
    }
    if (flexHits.length > 1) {
      if (pageHint != null) {
        const hinted = flexHits.filter((s) => s.page === pageHint - 1);
        if (hinted.length === 1) return { status: 'grounded', spans: [hinted[0]!] };
      }
      return { status: 'ambiguous', spans: flexHits, reason: `Flexible match: ${flexHits.length} candidates` };
    }
  }

  // Tier 4 — sliding-window fuzzy.
  const docTokens = index.matchText.split(' ').filter(Boolean);
  const qlen = qTokens.length;
  if (qlen > 0 && docTokens.length >= 1) {
    const maxW = Math.max(1, Math.round(qlen * (1 + config.fuzzyWindowPadding)));
    const minW = Math.max(1, Math.round(qlen * (1 - config.fuzzyWindowPadding)));
    // Pass 1 — best window.
    let best = 0;
    let bestStartTok = -1;
    let bestEndTok = -1;
    for (let s = 0; s + minW <= docTokens.length; s++) {
      for (let ww = minW; ww <= maxW && s + ww <= docTokens.length; ww++) {
        const sim = similarity(nq, docTokens.slice(s, s + ww).join(' '));
        if (sim > best) {
          best = sim;
          bestStartTok = s;
          bestEndTok = s + ww;
        }
      }
    }
    // Pass 2 — best NON-OVERLAPPING alternative (guards against a genuine
    // duplicate clause elsewhere, without penalising shifted windows over the
    // same location as the best match).
    let second = 0;
    for (let s = 0; s + minW <= docTokens.length; s++) {
      for (let ww = minW; ww <= maxW && s + ww <= docTokens.length; ww++) {
        if (s < bestEndTok && s + ww > bestStartTok) continue; // overlaps best
        const sim = similarity(nq, docTokens.slice(s, s + ww).join(' '));
        if (sim > second) second = sim;
      }
    }
    if (best >= config.fuzzyMinSimilarity && best - second >= config.fuzzyMinMargin && bestStartTok >= 0) {
      const pre = docTokens.slice(0, bestStartTok).join(' ');
      const matchStr = docTokens.slice(bestStartTok, bestEndTok).join(' ');
      const charStart = index.matchText.indexOf(matchStr, pre.length > 0 ? pre.length : 0);
      if (charStart >= 0) {
        const span = buildSpan(charStart, charStart + matchStr.length, index);
        if (onScannedPage(span, index)) {
          return { status: 'ungrounded_scanned', spans: [], reason: `Page ${span.page + 1} is scanned` };
        }
        return { status: 'grounded_fuzzy', spans: [span], similarity: best, reason: `Fuzzy ${(best * 100).toFixed(1)}%` };
      }
    }
  }

  // Tier 5 — honest fallback.
  return {
    status: 'ungrounded',
    spans: [],
    reason: 'Quote could not be located in the document — it may be a paraphrase, or the text layer is incomplete.',
  };
}
