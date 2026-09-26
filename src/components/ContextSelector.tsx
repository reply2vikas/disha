import { ROLE_OPTIONS, CONCERN_OPTIONS, JURISDICTION_OPTIONS } from '../lib/domain';
import type { ConcernId, JurisdictionId, RoleId } from '../lib/domain';

interface Props {
  role: RoleId;
  concern: ConcernId;
  jurisdiction: JurisdictionId;
  disabled?: boolean;
  onChange: (next: { role: RoleId; concern: ConcernId; jurisdiction: JurisdictionId }) => void;
}

/** Declares the reading context. Typed IDs only — never raw strings. */
export function ContextSelector({ role, concern, jurisdiction, disabled, onChange }: Props) {
  return (
    <fieldset className="card grid" disabled={disabled}>
      <legend><h2>Your reading context</h2></legend>
      <div>
        <label htmlFor="role">I am the…</label>
        <select id="role" value={role} onChange={(e) => onChange({ role: e.target.value as RoleId, concern, jurisdiction })}>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <p className="muted">{ROLE_OPTIONS.find((r) => r.id === role)?.description}</p>
      </div>
      <div>
        <label htmlFor="concern">My main concern is…</label>
        <select id="concern" value={concern} onChange={(e) => onChange({ role, concern: e.target.value as ConcernId, jurisdiction })}>
          {CONCERN_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="jurisdiction">Jurisdiction lens</label>
        <select id="jurisdiction" value={jurisdiction} onChange={(e) => onChange({ role, concern, jurisdiction: e.target.value as JurisdictionId })}>
          {JURISDICTION_OPTIONS.map((j) => (
            <option key={j.id} value={j.id}>{j.label}</option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
