import { useState } from 'react';
import { CLAUSE_CATEGORIES } from '../lib/domain';
import type { Grounded } from '../lib/grounding';
import type { AttentionItem } from '../lib/schema';
import { EvidenceBadge } from './EvidenceBadge';

const categoryLabel = (id: string): string =>
  CLAUSE_CATEGORIES.find((c) => c.id === id)?.label ?? 'Other';

export type ReadingLevel = 'standard' | 'plain';

export function AttentionItemCard({
  entry,
  readingLevel,
  onLocate,
}: {
  entry: Grounded<AttentionItem>;
  readingLevel: ReadingLevel;
  onLocate?: (page: number, bboxes: [number, number, number, number][]) => void;
}) {
  const { item, grounding } = entry;
  const [open, setOpen] = useState(false);
  const sevClass = `sev-${item.severity}`;
  const explanation =
    readingLevel === 'plain' && item.plain_explanation ? item.plain_explanation : item.why_it_matters;
  const firstSpan = grounding.spans[0];

  return (
    <article className="card" aria-labelledby={`ai-${item.id}`}>
      <h3 id={`ai-${item.id}`} className={sevClass}>
        {item.title}
      </h3>
      <p>
        <span className={`badge ${sevClass}`}>{item.severity.toUpperCase()}</span>{' '}
        <span className="badge">{categoryLabel(item.clause_category)}</span>{' '}
        <EvidenceBadge grounding={grounding} />
      </p>
      <p>{explanation}</p>
      <button className="btn secondary" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide evidence & questions' : 'Explain / show evidence'}
      </button>
      {onLocate && firstSpan && (
        <>
          {' '}
          <button className="btn secondary" onClick={() => onLocate(firstSpan.page, firstSpan.bboxes)}>
            Show in document
          </button>
        </>
      )}
      {open && (
        <div>
          <p className="muted">Quoted from the document:</p>
          <blockquote>“{item.exact_quote}”</blockquote>
          <p className="muted">{grounding.reason ?? 'Located in the document text.'}</p>
          {item.suggested_questions && item.suggested_questions.length > 0 && (
            <>
              <p className="muted">Questions to raise with a professional:</p>
              <ul className="clean">
                {item.suggested_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </article>
  );
}
