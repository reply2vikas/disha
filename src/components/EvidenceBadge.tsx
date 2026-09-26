import type { GroundingResult } from '../lib/evidenceMatcher';

const LABELS: Record<GroundingResult['status'], string> = {
  grounded: 'Verified in document',
  grounded_fuzzy: 'Verified (approximate)',
  ambiguous: 'Multiple matches',
  ungrounded: 'Unverified — not found',
  ungrounded_scanned: 'Unverified — scanned page',
};

/** Renders the COMPUTED grounding status. The model never sets this. */
export function EvidenceBadge({ grounding }: { grounding: GroundingResult }) {
  const grounded = grounding.status === 'grounded' || grounding.status === 'grounded_fuzzy';
  return (
    <span
      className={`badge ${grounded ? 'grounded' : 'ungrounded'}`}
      title={grounding.reason ?? LABELS[grounding.status]}
    >
      {grounded ? '✓' : '⚠'} {LABELS[grounding.status]}
    </span>
  );
}
