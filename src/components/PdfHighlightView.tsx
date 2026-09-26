import { useEffect, useRef, useState } from 'react';

type Bbox = [number, number, number, number];

interface Props {
  /** PDF bytes (a copy of the uploaded document). */
  data: ArrayBuffer;
  /** 0-indexed page to show. */
  page: number;
  /** Highlight boxes in scale-1, top-left PDF coordinates (from the matcher). */
  bboxes: Bbox[];
  onClose: () => void;
}

const RENDER_WIDTH = 760;

/**
 * Renders one PDF page to a canvas and overlays highlight rectangles computed by
 * the deterministic matcher (reverse index -> bboxes). Coordinates map from the
 * scale-1 top-left boxes produced in pdfText.ts to the rendered scale.
 *
 * NOTE: overlay alignment depends on the source PDF's text layer; verify visually
 * in the browser and tune the scale mapping if a document renders slightly off.
 */
export function PdfHighlightView({ data, page, bboxes, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(RENDER_WIDTH);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const { configureWorker } = await import('../lib/pdfWorker');
        configureWorker(pdfjs);
        const doc = await pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise;
        const pg = await doc.getPage(page + 1);
        const base = pg.getViewport({ scale: 1 });
        const s = RENDER_WIDTH / base.width;
        const viewport = pg.getViewport({ scale: s });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setScale(s);
        setWidth(viewport.width);
        await pg.render({ canvasContext: ctx, viewport }).promise;
      } catch {
        if (!cancelled) setError('Could not render this page for highlighting.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, page]);

  return (
    <div className="card" role="dialog" aria-label={`Source on page ${page + 1}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Source — page {page + 1}</h3>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      {error && <p className="sev-high" role="alert">{error}</p>}
      <div className="pdf-stage" style={{ position: 'relative', width }}>
        <canvas ref={canvasRef} className="pdf-canvas" />
        <div className="pdf-overlay" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
          {bboxes.map((b, i) => (
            <span
              key={i}
              className="pdf-hl"
              style={{ position: 'absolute', left: b[0] * scale, top: b[1] * scale, width: b[2] * scale, height: b[3] * scale }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
