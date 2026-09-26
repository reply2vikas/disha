import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { AttentionItemCard } from '../src/components/AttentionItemCard';
import type { Grounded } from '../src/lib/grounding';
import type { AttentionItem } from '../src/lib/schema';

describe('UI', () => {
  it('landing shows disclaimer and demo entry points', () => {
    render(<App />);
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Demo:/i }).length).toBeGreaterThan(0);
  });

  it('attention card renders a verified evidence badge', () => {
    const entry: Grounded<AttentionItem> = {
      item: {
        id: 'a1', title: 'Deposit forfeiture', clause_category: 'penalties',
        why_it_matters: 'You could lose the deposit.', severity: 'high',
        exact_quote: 'the entire security deposit shall stand forfeited', page_hint: 1,
      },
      grounding: { status: 'grounded', spans: [{ start: 0, end: 5, page: 0, bboxes: [] }] },
    };
    render(<AttentionItemCard entry={entry} readingLevel="standard" />);
    expect(screen.getByText(/Deposit forfeiture/)).toBeInTheDocument();
    expect(screen.getByText(/Verified in document/i)).toBeInTheDocument();
  });
});
