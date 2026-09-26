/**
 * domain.ts — Typed identifiers for the Context Lens (India-first).
 *
 * RoleId / ConcernId are canonical identifiers used in all branching logic.
 * NEVER branch on display strings. Labels are a separate presentation concern.
 * Jurisdiction is a declared input; India is the default lens but not hardcoded
 * into logic — attention rules read `JurisdictionId`.
 */

export type JurisdictionId = 'india' | 'generic';

export interface JurisdictionOption {
  id: JurisdictionId;
  label: string;
  note: string;
}

export const JURISDICTION_OPTIONS: JurisdictionOption[] = [
  { id: 'india', label: 'India', note: 'Interprets clauses against common Indian contract norms.' },
  { id: 'generic', label: 'General / Unspecified', note: 'No jurisdiction-specific interpretation applied.' },
];

export type RoleId =
  | 'tenant'
  | 'landlord'
  | 'employee'
  | 'employer'
  | 'consumer'
  | 'freelancer';

export interface RoleOption {
  id: RoleId;
  label: string;
  description: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { id: 'tenant', label: 'Tenant', description: 'Rent, deposit, lock-in, maintenance and exit terms that bind you.' },
  { id: 'landlord', label: 'Landlord', description: 'Tenant obligations, notice periods and your enforcement rights.' },
  { id: 'employee', label: 'Employee', description: 'Notice, bond, non-compete, IP assignment and termination clauses.' },
  { id: 'employer', label: 'Employer', description: 'Employer obligations, liability exposure and compliance duties.' },
  { id: 'consumer', label: 'Consumer', description: 'Fees, auto-renewals, liability caps and dispute/refund terms.' },
  { id: 'freelancer', label: 'Freelancer / Contractor', description: 'Payment terms, IP ownership, indemnity and scope limits.' },
];

export type ConcernId =
  | 'financial-exposure'
  | 'exit-termination'
  | 'liability-risk'
  | 'rights-protections'
  | 'data-privacy';

export interface ConcernOption {
  id: ConcernId;
  label: string;
}

export const CONCERN_OPTIONS: ConcernOption[] = [
  { id: 'financial-exposure', label: 'Financial Exposure' },
  { id: 'exit-termination', label: 'Exit / Termination' },
  { id: 'liability-risk', label: 'Liability & Risk' },
  { id: 'rights-protections', label: 'Rights & Protections' },
  { id: 'data-privacy', label: 'Data & Privacy' },
];

/**
 * Clause taxonomy — the single source of truth consumed by (a) the model prompt,
 * (b) attention-item grouping in the UI, and (c) severity weighting. Used in
 * multiple places on purpose: this is domain depth, not decoration.
 */
export type ClauseCategory =
  | 'payment-fees'
  | 'term-renewal'
  | 'termination-exit'
  | 'liability-indemnity'
  | 'penalties'
  | 'dispute-jurisdiction'
  | 'data-privacy'
  | 'ip-confidentiality'
  | 'other';

export const CLAUSE_CATEGORIES: ReadonlyArray<{ id: ClauseCategory; label: string }> = [
  { id: 'payment-fees', label: 'Payment & Fees' },
  { id: 'term-renewal', label: 'Term & Renewal' },
  { id: 'termination-exit', label: 'Termination & Exit' },
  { id: 'liability-indemnity', label: 'Liability & Indemnity' },
  { id: 'penalties', label: 'Penalties' },
  { id: 'dispute-jurisdiction', label: 'Dispute & Jurisdiction' },
  { id: 'data-privacy', label: 'Data & Privacy' },
  { id: 'ip-confidentiality', label: 'IP & Confidentiality' },
  { id: 'other', label: 'Other' },
];

export function roleLabel(id: RoleId): string {
  return ROLE_OPTIONS.find((r) => r.id === id)?.label ?? id;
}
export function concernLabel(id: ConcernId): string {
  return CONCERN_OPTIONS.find((c) => c.id === id)?.label ?? id;
}
export function jurisdictionLabel(id: JurisdictionId): string {
  return JURISDICTION_OPTIONS.find((j) => j.id === id)?.label ?? id;
}
