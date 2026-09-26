import { describe, it, expect } from 'vitest';
import {
  ROLE_OPTIONS, CONCERN_OPTIONS, JURISDICTION_OPTIONS, CLAUSE_CATEGORIES,
  roleLabel, concernLabel, jurisdictionLabel,
} from '../src/lib/domain';

describe('domain taxonomy', () => {
  it('has unique role ids', () => {
    const ids = ROLE_OPTIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('has unique concern and category ids', () => {
    expect(new Set(CONCERN_OPTIONS.map((c) => c.id)).size).toBe(CONCERN_OPTIONS.length);
    expect(new Set(CLAUSE_CATEGORIES.map((c) => c.id)).size).toBe(CLAUSE_CATEGORIES.length);
  });
  it('labels resolve and fall back', () => {
    expect(roleLabel('tenant')).toBe('Tenant');
    expect(concernLabel('financial-exposure')).toBe('Financial Exposure');
    expect(jurisdictionLabel('india')).toBe('India');
    expect(JURISDICTION_OPTIONS.length).toBeGreaterThanOrEqual(2);
  });
});
