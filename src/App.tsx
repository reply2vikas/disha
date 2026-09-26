import { useCallback, useMemo, useState } from 'react';
import { LegalDisclaimer } from './components/LegalDisclaimer';
import { ContextSelector } from './components/ContextSelector';
import { AttentionItemCard, type ReadingLevel } from './components/AttentionItemCard';
import { PdfHighlightView } from './components/PdfHighlightView';
import { EvidenceBadge } from './components/EvidenceBadge';
import { useAnalysis } from './hooks/useAnalysis';
import { arrayBufferToBase64 } from './lib/bytes';
import { indexFromPlainText, indexFromPdf } from './lib/pdfText';
import { DEMO_CONTEXTS, DEMO_DOCUMENT_TEXT, findDemoAnalysis } from './lib/providers/demoData';
import type { DocumentIndex } from './lib/evidenceMatcher';
import type { GroundedAnalysis } from './lib/grounding';
import type { ConcernId, JurisdictionId, RoleId } from './lib/domain';

interface Doc {
  name: string;
  index: DocumentIndex;
  base64: string;
  data?: ArrayBuffer;
}

export default function App() {
  const { state, run, runLocal, reset } = useAnalysis();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [role, setRole] = useState<RoleId>('tenant');
  const [concern, setConcern] = useState<ConcernId>('financial-exposure');
  const [jurisdiction, setJurisdiction] = useState<JurisdictionId>('india');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ctx = useMemo(() => ({ role, concern, jurisdiction }), [role, concern, jurisdiction]);

  const onUpload = useCallback(
    async (file: File) => {
      setLoadError(null);
      setBusy(true);
      try {
        const buf = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);
        const data = buf.slice(0);
        const index = await indexFromPdf(buf);
        reset();
        setDoc({ name: file.name, index, base64, data });
      } catch {
        setLoadError('Could not read that PDF. Please try another file.');
      } finally {
        setBusy(false);
      }
    },
    [reset],
  );

  const startDemo = useCallback(
    (r: RoleId, c: ConcernId) => {
      reset();
      const index = indexFromPlainText(DEMO_DOCUMENT_TEXT);
      setDoc({ name: 'Sample commercial lease (demo)', index, base64: '' });
      setRole(r);
      setConcern(c);
      setJurisdiction('india');
      runLocal(findDemoAnalysis(r, c), index, { role: r, concern: c, jurisdiction: 'india' });
    },
    [reset, runLocal],
  );

  const analyze = useCallback(() => {
    if (doc) void run(doc.index, ctx, doc.base64);
  }, [doc, ctx, run]);

  const onContextChange = useCallback(
    (next: { role: RoleId; concern: ConcernId; jurisdiction: JurisdictionId }) => {
      setRole(next.role);
      setConcern(next.concern);
      setJurisdiction(next.jurisdiction);
      if (!doc) return;
      if (doc.base64 === '') runLocal(findDemoAnalysis(next.role, next.concern), doc.index, next);
      else void run(doc.index, next, doc.base64);
    },
    [doc, run, runLocal],
  );

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="wrap">
        <header>
          <h1>Disha</h1>
          <p className="muted">
            A context-aware legal document navigator. Every finding is grounded in your document — or
            honestly marked unverified.
          </p>
          <LegalDisclaimer />
        </header>

        <main id="main">
          {!doc && (
            <section className="card" aria-labelledby="start">
              <h2 id="start">Start</h2>
              <label htmlFor="file">Upload a legal PDF (analyzed in your session, never stored)</label>
              <input
                id="file"
                type="file"
                accept="application/pdf"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                }}
              />
              {busy && <p aria-live="polite">Reading document…</p>}
              {loadError && <p className="sev-high" role="alert">{loadError}</p>}
              <p className="muted">
                No PDF handy? <a href="/sample-lease.pdf" download>Download a sample Indian lease</a>, then upload it above.
              </p>
              <p className="muted">— or explore without a key —</p>
              <div className="grid">
                {DEMO_CONTEXTS.map((d) => (
                  <button key={`${d.role}:${d.concern}`} className="btn secondary" onClick={() => startDemo(d.role, d.concern)}>
                    Demo: {d.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {doc && (
            <section aria-labelledby="doc">
              <div className="card">
                <h2 id="doc">Document: {doc.name}</h2>
                <button className="btn secondary" onClick={() => { setDoc(null); reset(); }}>
                  Choose a different document
                </button>
              </div>

              <ContextSelector
                role={role}
                concern={concern}
                jurisdiction={jurisdiction}
                disabled={state.status === 'loading'}
                onChange={onContextChange}
              />

              {doc.base64 !== '' && state.status === 'idle' && (
                <button className="btn" onClick={analyze}>Analyze document</button>
              )}

              {state.status === 'loading' && <p aria-live="polite">Analyzing in your context…</p>}
              {state.status === 'error' && <p className="sev-high" role="alert">{state.error}</p>}

              {state.status === 'done' && <Results result={state.result} provider={state.provider} data={doc.data} />}
            </section>
          )}
        </main>

        <footer className="muted">
          <p>Disha · informational analysis only · built for PromptWars Virtual.</p>
        </footer>
      </div>
    </>
  );
}

function Results({
  result,
  provider,
  data,
}: {
  result: GroundedAnalysis;
  provider: 'gemini' | 'demo';
  data?: ArrayBuffer;
}) {
  const pct = Math.round(result.groundedRatio * 100);
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('standard');
  const [viewer, setViewer] = useState<{ page: number; bboxes: [number, number, number, number][] } | null>(null);
  const onLocate = data
    ? (page: number, bboxes: [number, number, number, number][]) => setViewer({ page, bboxes })
    : undefined;
  const lawyerQuestions = [
    ...result.base.questions_for_professional,
    ...result.attention_items.flatMap((e) => e.item.suggested_questions ?? []),
  ];
  return (
    <div aria-live="polite">
      <div className="card">
        <h2>{result.base.document_type}</h2>
        <p><span className="badge">{provider === 'demo' ? 'Demo analysis' : 'Live analysis'}</span>{' '}
          <span className="badge grounded">{pct}% of quotes verified in-document</span></p>
        <p>{result.base.contextual_summary}</p>
        <p className="muted">{result.base.jurisdiction_note}</p>
        <div role="group" aria-label="Reading level">
          <button
            className={`btn ${readingLevel === 'standard' ? '' : 'secondary'}`}
            aria-pressed={readingLevel === 'standard'}
            onClick={() => setReadingLevel('standard')}
          >
            Standard
          </button>{' '}
          <button
            className={`btn ${readingLevel === 'plain' ? '' : 'secondary'}`}
            aria-pressed={readingLevel === 'plain'}
            onClick={() => setReadingLevel('plain')}
          >
            Plain language
          </button>
        </div>
      </div>

      {viewer && data && (
        <PdfHighlightView data={data} page={viewer.page} bboxes={viewer.bboxes} onClose={() => setViewer(null)} />
      )}

      <h2>Needs your attention</h2>
      {result.attention_items.map((entry) => (
        <AttentionItemCard key={entry.item.id} entry={entry} readingLevel={readingLevel} onLocate={onLocate} />
      ))}

      {result.statutoryFlags.length > 0 && (
        <div className="card">
          <h2>Statutory notes ({result.base.jurisdiction_note ? 'jurisdiction-aware' : 'general'})</h2>
          <p className="muted">
            Computed from the document text — informational, not a legal opinion.
          </p>
          <ul className="clean">
            {result.statutoryFlags.map((f) => (
              <li key={f.id}>
                <strong>{f.statuteRef}:</strong> {f.note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Key facts</h2>
        <ul className="clean">
          {result.key_facts.map((f) => (
            <li key={f.item.id}>
              <strong>{f.item.label}:</strong> {f.item.value} <EvidenceBadge grounding={f.grounding} />
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Obligations</h2>
        <ul className="clean">
          {result.obligations.map((o) => (
            <li key={o.item.id}>
              <strong>{o.item.who}:</strong> {o.item.what} <EvidenceBadge grounding={o.grounding} />
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Prepare for your lawyer</h2>
        <ul className="clean">
          {[...new Set(lawyerQuestions)].map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>

      {result.base.uncertainty_notes.length > 0 && (
        <div className="card">
          <h2>What the document doesn’t say</h2>
          <ul className="clean">
            {result.base.uncertainty_notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <LegalDisclaimer text={result.base.disclaimer} />
    </div>
  );
}
