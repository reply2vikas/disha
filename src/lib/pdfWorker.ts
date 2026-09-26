/**
 * pdfWorker.ts — wire the PDF.js worker.
 *
 * The worker file is resolved by Vite via the `?url` suffix, which returns a
 * correct URL in dev AND in the production build. The previous
 * `new URL('pdfjs-dist/...', import.meta.url)` form resolved to a wrong path in
 * the dev server (treated as relative to the module) and caused PDF loads to fail.
 */
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function configureWorker(pdfjs: any): void {
  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }
}
