# Testing Strategy

Four layers, prioritising the critical evidence path over a coverage number.

1. **Unit** — pure logic: normalization symmetry, the five matcher tiers and its
   similarity primitives, Zod schema accept/reject, the domain taxonomy, the
   statutory engine, and the comparison engine.
2. **Golden corpus** (`tests/golden.test.ts`) — extraction artefacts (ligatures,
   curly quotes, soft hyphens, hyphenated line-breaks, regex metacharacters,
   misleading near-matches, fabricated content) each with an expected tier.
3. **Adversarial** — prompt-injection posture and schema fuzzing (unknown fields,
   bad enums, smuggled `evidence_status`).
4. **Integrity & differentiation** — every demo quote must ground; two contexts
   must differ (`contextDifferentiation`).

Run: `npm test` (64 tests). Live end-to-end: `npm run validate:live`.
