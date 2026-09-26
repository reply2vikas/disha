/**
 * textIndex.ts — build a DocumentIndex from plain text (no PDF engine).
 *
 * Kept separate from pdfText.ts so Node/CLI code (the live-validation script and
 * tests) can use it without dragging in the browser-only PDF.js worker.
 */
import { normalizeForMatch } from './normalize';
import type { CharSource, DocumentIndex } from './evidenceMatcher';

/** Build a DocumentIndex from a single block of plain text (one logical page). */
export function indexFromPlainText(text: string, page = 0): DocumentIndex {
  const matchText = normalizeForMatch(text);
  const bbox: [number, number, number, number] = [0, 0, 1, 1];
  const charSources: Array<CharSource | null> = Array.from({ length: matchText.length }, () => ({
    page,
    bbox,
  }));
  return { matchText, charSources, scannedPages: new Set<number>(), pageCount: 1 };
}
