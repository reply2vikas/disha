/**
 * jurisdiction.ts — deterministic statutory-flag engine (Pipeline B side).
 *
 * Independently of the model, this scans the *actual document text* for terms
 * whose treatment under the declared jurisdiction is well established, and
 * surfaces an informational statutory note. This is genuine domain logic — it
 * runs on the extracted text, not on the model's opinion — and it is India-first.
 *
 * It never gives legal advice: each note states the general statutory position
 * and defers to a professional. Flags are computed, never model-generated.
 */
import { normalizeForMatch } from './normalize';
import type { JurisdictionId, ClauseCategory } from './domain';

export interface StatutoryRule {
  id: string;
  /** Match against match-normalized document text. */
  pattern: RegExp;
  statuteRef: string;
  category: ClauseCategory;
  /** Informational, non-advice framing. */
  note: string;
}

export interface StatutoryFlag {
  id: string;
  statuteRef: string;
  category: ClauseCategory;
  note: string;
  /** The verbatim (normalized) excerpt that triggered the flag. */
  matchedText: string;
}

/** India-first rules. Extend per jurisdiction; `generic` intentionally carries none. */
const RULES: Record<JurisdictionId, StatutoryRule[]> = {
  india: [
    {
      id: 'in-noncompete-s27',
      pattern: /non[-\s]?compete|restraint of trade|shall not (?:engage|compete|work)/i,
      statuteRef: 'Section 27, Indian Contract Act 1872',
      category: 'ip-confidentiality',
      note: 'Under Indian law, agreements restraining a person from a lawful profession or trade are generally void, and post-employment non-compete covenants are routinely unenforceable. Discuss enforceability with a professional.',
    },
    {
      id: 'in-penalty-s74',
      pattern: /penalt|liquidated damages|forfeit(?:ure|ed)?|stand forfeited/i,
      statuteRef: 'Section 74, Indian Contract Act 1872',
      category: 'penalties',
      note: 'Under Indian law, a party can generally recover only reasonable compensation for a breach, regardless of a named penalty or forfeiture amount; purely penal sums are often not enforceable in full. Confirm with a professional.',
    },
    {
      id: 'in-consumer-forum',
      pattern: /waiv\w*\s+(?:all\s+)?(?:rights?|claims?)|consumer (?:forum|court)|not approach (?:any )?(?:court|forum)/i,
      statuteRef: 'Consumer Protection Act 2019',
      category: 'dispute-jurisdiction',
      note: 'Statutory consumer remedies (e.g., approaching the Consumer Disputes Redressal Commission) generally cannot be waived by contract in India. A waiver clause may not be enforceable against a consumer.',
    },
    {
      id: 'in-arbitration-seat',
      pattern: /arbitrat|seat of arbitration|sole arbitrator/i,
      statuteRef: 'Arbitration and Conciliation Act 1996',
      category: 'dispute-jurisdiction',
      note: 'Arbitration clauses are enforceable in India but fix where and how disputes are resolved, and may limit access to courts. Check the seat, venue and appointment mechanism with a professional.',
    },
    {
      id: 'in-data-dpdp',
      pattern: /personal data|process\w*\s+(?:your|the)\s+data|data protection|privacy policy/i,
      statuteRef: 'Digital Personal Data Protection Act 2023',
      category: 'data-privacy',
      note: 'Processing of personal data in India is governed by the DPDP Act 2023, which grants rights over your data and imposes duties on those who process it. Review what data is collected and why.',
    },
  ],
  generic: [],
};

/** Scan already-normalized document text for statutory flags. */
export function scanStatutory(matchText: string, jurisdiction: JurisdictionId): StatutoryFlag[] {
  const rules = RULES[jurisdiction] ?? [];
  const flags: StatutoryFlag[] = [];
  for (const rule of rules) {
    const m = rule.pattern.exec(matchText);
    if (m) {
      const start = Math.max(0, m.index - 24);
      const end = Math.min(matchText.length, m.index + m[0].length + 24);
      flags.push({
        id: rule.id,
        statuteRef: rule.statuteRef,
        category: rule.category,
        note: rule.note,
        matchedText: matchText.slice(start, end).trim(),
      });
    }
  }
  return flags;
}

/** Convenience: normalize raw text then scan. */
export function scanStatutoryRaw(rawText: string, jurisdiction: JurisdictionId): StatutoryFlag[] {
  return scanStatutory(normalizeForMatch(rawText), jurisdiction);
}
