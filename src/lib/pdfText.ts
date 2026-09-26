/**
 * pdfText.ts — PDF.js text extraction + reverse character index (Pipeline B input).
 *
 * Runs entirely in the browser. Produces a DocumentIndex: the normalized
 * match text plus, for every character, the page and bounding box it came from,
 * so a grounded quote can be highlighted precisely on the page.
 *
 * `indexFromPlainText` builds the same structure from raw text and is used by
 * demo mode and by unit tests (no headless PDF engine required).
 */
import { normalizeForMatch } from './normalize';
import type { CharSource, DocumentIndex } from './evidenceMatcher';
export { indexFromPlainText } from './textIndex';

/** Below this many characters of extractable text, a page is treated as scanned. */
const SCANNED_PAGE_MIN_CHARS = 12;

export async function indexFromPdf(data: ArrayBuffer): Promise<DocumentIndex> {
  const pdfjs = await import('pdfjs-dist');
  // Worker is resolved by the bundler; see src/lib/pdfWorker.ts.
  const { configureWorker } = await import('./pdfWorker');
  configureWorker(pdfjs);

  const doc = await pdfjs.getDocument({ data }).promise;
  const pieces: string[] = [];
  const charSources: Array<CharSource | null> = [];
  const scannedPages = new Set<number>();

  for (let p = 0; p < doc.numPages; p++) {
    const page = await doc.getPage(p + 1);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    let pageChars = 0;

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const raw = item.str;
      const normalized = normalizeForMatch(raw + ' ');
      if (normalized.trim().length === 0) continue;
      const tx = item.transform;
      const x = tx[4] as number;
      const yTop = viewport.height - (tx[5] as number);
      const width = (item.width as number) || 0;
      const height = (item.height as number) || 10;
      const bbox: [number, number, number, number] = [x, yTop - height, width, height];
      for (let i = 0; i < normalized.length; i++) charSources.push({ page: p, bbox });
      pieces.push(normalized);
      pageChars += normalized.trim().length;
    }
    if (pageChars < SCANNED_PAGE_MIN_CHARS) scannedPages.add(p);
  }

  return {
    matchText: pieces.join(''),
    charSources,
    scannedPages,
    pageCount: doc.numPages,
  };
}
