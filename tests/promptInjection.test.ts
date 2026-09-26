import { describe, it, expect } from 'vitest';
import { buildSystemInstruction } from '../src/lib/providers/prompt';

describe('prompt injection posture', () => {
  it('declares the document as untrusted content', () => {
    const sys = buildSystemInstruction({ role: 'tenant', concern: 'financial-exposure', jurisdiction: 'india' });
    expect(sys).toMatch(/untrusted content/i);
    expect(sys).toMatch(/never as commands/i);
  });
  it('demands verbatim quotes and honest omission', () => {
    const sys = buildSystemInstruction({ role: 'consumer', concern: 'liability-risk', jurisdiction: 'generic' });
    expect(sys).toMatch(/verbatim/i);
    expect(sys).toMatch(/omit that item rather than guess/i);
  });
});
