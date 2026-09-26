/**
 * demoData.ts — Fixed analyses for the no-API-key demo path.
 *
 * Demo mode intentionally exposes ONLY the two prepared contexts below. Every
 * exact_quote here is a verbatim substring of DEMO_DOCUMENT_TEXT, so the real
 * (deterministic) grounding pipeline runs unchanged in demo mode and every item
 * resolves to `grounded`. This is asserted by tests/demoEvidenceIntegrity.test.ts.
 */
import type { AnalysisResult } from '../schema';
import type { AnalyzeContext } from './AIProvider';

export const DEMO_DOCUMENT_TEXT = [
  'COMMERCIAL LEASE AGREEMENT',
  '1. RENT. The Tenant shall pay monthly rent of INR 85,000, payable in advance on or before the 5th day of each calendar month.',
  "2. SECURITY DEPOSIT. The Tenant shall deposit a sum equal to six (6) months' rent as an interest-free security deposit.",
  '3. LOCK-IN PERIOD. This lease has a lock-in period of eleven (11) months during which the Tenant may not terminate the lease.',
  '4. ESCALATION. The rent shall escalate by ten percent (10%) at the end of every twelve (12) month period.',
  '5. MAINTENANCE. The Tenant shall bear all charges for routine maintenance, minor repairs and utilities.',
  "6. TERMINATION. After the lock-in period, either party may terminate this lease by giving three (3) months' written notice.",
  '7. FORFEITURE. If the Tenant vacates during the lock-in period, the entire security deposit shall stand forfeited.',
  '8. JURISDICTION. This agreement shall be governed by the laws of India and subject to the jurisdiction of the courts at Bengaluru.',
].join('\n');

const DISCLAIMER =
  'This is informational analysis only and not legal advice. Consult a qualified legal professional before acting on this document.';

const tenantFinancial: AnalysisResult = {
  document_type: 'Commercial Lease Agreement',
  jurisdiction_note: 'Interpreted against common Indian rental-contract norms.',
  contextual_summary:
    'As a tenant focused on financial exposure, your largest risks are a six-month interest-free deposit, a 10% annual escalation, and full deposit forfeiture if you exit during the lock-in.',
  key_facts: [
    {
      id: 'kf1',
      label: 'Monthly rent',
      value: 'INR 85,000, due by the 5th',
      exact_quote: 'The Tenant shall pay monthly rent of INR 85,000, payable in advance on or before the 5th day of each calendar month.',
      page_hint: 1,
    },
  ],
  obligations: [
    {
      id: 'ob1',
      who: 'Tenant',
      what: 'Pay monthly rent in advance by the 5th of each month',
      exact_quote: 'The Tenant shall pay monthly rent of INR 85,000, payable in advance on or before the 5th day of each calendar month.',
      page_hint: 1,
    },
  ],
  attention_items: [
    {
      id: 'ai1',
      title: 'Six months of rent locked as an interest-free deposit',
      clause_category: 'payment-fees',
      why_it_matters: 'A large sum is tied up with no interest — a significant working-capital cost for you.',
      plain_explanation: 'Six months of rent is held as a deposit and you earn no interest on it. That money is locked away for the whole lease.',
      suggested_questions: ['Can the deposit be reduced to two or three months?', 'Can we add interest on the deposit?'],
      severity: 'high',
      exact_quote: "The Tenant shall deposit a sum equal to six (6) months' rent as an interest-free security deposit.",
      page_hint: 1,
    },
    {
      id: 'ai2',
      title: '10% annual rent escalation',
      clause_category: 'payment-fees',
      why_it_matters: 'Your rent compounds upward every year; budget for the increase.',
      plain_explanation: 'Your rent goes up 10% each year, so it grows faster the longer you stay.',
      suggested_questions: ['Can the yearly increase be capped lower than 10%?'],
      severity: 'caution',
      exact_quote: 'The rent shall escalate by ten percent (10%) at the end of every twelve (12) month period.',
      page_hint: 1,
    },
    {
      id: 'ai3',
      title: 'Full deposit forfeited on early exit',
      clause_category: 'penalties',
      why_it_matters: 'Leaving during the lock-in costs you the entire deposit — a heavy financial penalty.',
      plain_explanation: 'If you move out before the lock-in ends, you lose the whole deposit.',
      suggested_questions: ['Can early exit trigger a smaller, pro-rated deduction instead of full forfeiture?', 'Is full forfeiture even enforceable here?'],
      severity: 'high',
      exact_quote: 'If the Tenant vacates during the lock-in period, the entire security deposit shall stand forfeited.',
      page_hint: 1,
    },
  ],
  questions_for_professional: [
    'Is a six-month interest-free deposit standard and can it be negotiated down?',
    'Can the forfeiture clause be softened to a pro-rated deduction?',
  ],
  uncertainty_notes: [
    'The document does not state the timeline or conditions for return of the deposit at the end of the lease.',
  ],
  disclaimer: DISCLAIMER,
};

const landlordExit: AnalysisResult = {
  document_type: 'Commercial Lease Agreement',
  jurisdiction_note: 'Interpreted against common Indian rental-contract norms.',
  contextual_summary:
    'As a landlord focused on exit and termination, the lease gives you an eleven-month lock-in, a three-month notice requirement after it, and deposit forfeiture as a deterrent to early exit.',
  key_facts: [
    {
      id: 'kf1',
      label: 'Lock-in period',
      value: 'Eleven (11) months',
      exact_quote: 'This lease has a lock-in period of eleven (11) months during which the Tenant may not terminate the lease.',
      page_hint: 1,
    },
  ],
  obligations: [
    {
      id: 'ob1',
      who: 'Either party',
      what: 'Give three months written notice to terminate after lock-in',
      exact_quote: "After the lock-in period, either party may terminate this lease by giving three (3) months' written notice.",
      page_hint: 1,
    },
  ],
  attention_items: [
    {
      id: 'ai1',
      title: 'Eleven-month lock-in protects your occupancy',
      clause_category: 'term-renewal',
      why_it_matters: 'The tenant cannot walk away in the first eleven months, giving you revenue certainty.',
      plain_explanation: 'The tenant is committed for eleven months and cannot leave early, so your income is steady.',
      suggested_questions: ['Is the lock-in clearly enforceable as drafted?'],
      severity: 'info',
      exact_quote: 'This lease has a lock-in period of eleven (11) months during which the Tenant may not terminate the lease.',
      page_hint: 1,
    },
    {
      id: 'ai2',
      title: 'Three-month notice after lock-in',
      clause_category: 'termination-exit',
      why_it_matters: 'You are entitled to a full quarter of notice before the tenant can exit.',
      plain_explanation: 'After the lock-in, the tenant must tell you three months ahead before leaving.',
      suggested_questions: ['Should notice be in writing and to a specific address?'],
      severity: 'caution',
      exact_quote: "After the lock-in period, either party may terminate this lease by giving three (3) months' written notice.",
      page_hint: 1,
    },
    {
      id: 'ai3',
      title: 'Forfeiture deters early exit',
      clause_category: 'penalties',
      why_it_matters: 'The forfeiture clause discourages the tenant from breaking the lock-in.',
      plain_explanation: 'Losing the deposit makes the tenant less likely to break the lock-in early.',
      suggested_questions: ['Could the forfeiture clause be challenged as a penalty?'],
      severity: 'info',
      exact_quote: 'If the Tenant vacates during the lock-in period, the entire security deposit shall stand forfeited.',
      page_hint: 1,
    },
  ],
  questions_for_professional: [
    'Is the eleven-month lock-in enforceable and is forfeiture a valid remedy in this jurisdiction?',
  ],
  uncertainty_notes: [
    'The document does not specify remedies if the tenant defaults on rent but does not vacate.',
  ],
  disclaimer: DISCLAIMER,
};

export interface DemoContextEntry {
  role: AnalyzeContext['role'];
  concern: AnalyzeContext['concern'];
  label: string;
  analysis: AnalysisResult;
}

export const DEMO_CONTEXTS: DemoContextEntry[] = [
  { role: 'tenant', concern: 'financial-exposure', label: 'Tenant — Financial Exposure', analysis: tenantFinancial },
  { role: 'landlord', concern: 'exit-termination', label: 'Landlord — Exit / Termination', analysis: landlordExit },
];

export function demoKey(role: string, concern: string): string {
  return `${role}:${concern}`;
}

export function findDemoAnalysis(role: string, concern: string): AnalysisResult | null {
  const entry = DEMO_CONTEXTS.find((c) => c.role === role && c.concern === concern);
  return entry ? entry.analysis : null;
}
