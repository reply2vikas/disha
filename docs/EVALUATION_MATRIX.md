# Evaluation Evidence Matrix

Each scoring dimension maps to a concrete implementation, a test that proves it,
its failure behaviour, and a command to verify it. This repository is designed to
make quality **discoverable**, not merely claimed.

## Code Quality
| Requirement | Implementation | Test | Failure behaviour | Verify |
| --- | --- | --- | --- | --- |
| Deterministic evidence core | `src/lib/evidenceMatcher.ts` | `tests/evidenceMatcher.test.ts`, `tests/golden.test.ts` | conservative → `ungrounded` | `npm test` |
| Domain logic (statutory) | `src/lib/jurisdiction.ts` | `tests/jurisdiction.test.ts` | generic → no flags | `npm test` |
| Comparison engine | `src/lib/compare.ts` | `tests/compare.test.ts` | identical → `unchanged` | `npm test` |
| One shared lib for app + server | `server/index.ts` imports `src/lib` | typecheck | build fails on drift | `npm run typecheck` |
| Strict TS, no unused, no unchecked index | `tsconfig.app.json` | tsc | compile error | `npm run typecheck` |

## Security
| Requirement | Implementation | Test | Failure behaviour | Verify |
| --- | --- | --- | --- | --- |
| Model cannot self-certify | `src/lib/schema.ts` (no `evidence_status`) | `tests/schema.test.ts` | strict reject | `npm test` |
| Injection = data, not commands | `src/lib/providers/prompt.ts`, media-part isolation | `tests/promptInjection.test.ts` | quote → `ungrounded` | `npm test` |
| Strict output validation | Zod `.strict()` | `tests/schema.test.ts` | 500 on malformed | `npm test` |
| Key server-side only | `server/index.ts` | bundle scan | audit blocks | `npm run evaluate:repository` |

## Efficiency
| Requirement | Implementation | Verify |
| --- | --- | --- |
| Cheapest-tier model | `GeminiProvider` (`gemini-3.8-flash`) | code |
| Cascade stops at first decision | `evidenceMatcher.ts` | `tests/evidenceMatcher.test.ts` |
| Context cache (no re-call on lens switch) | `src/hooks/useAnalysis.ts` | `docs/PERFORMANCE.md` |
| Lazy PDF engine | dynamic `import('pdfjs-dist')` in `pdfText.ts` | build chunk split |

## Testing
| Layer | Files |
| --- | --- |
| Unit | normalize, matcher, schema, domain, grounding, compare, jurisdiction |
| Golden corpus | `tests/golden.test.ts` |
| Adversarial | `tests/promptInjection.test.ts`, schema fuzzing |
| Integrity | `tests/demoEvidenceIntegrity.test.ts` |
| Context differentiation | `tests/compare.test.ts` (`contextDifferentiation`) |
| Live | `npm run validate:live` |

## Accessibility
Semantic landmarks, skip link, labelled controls, `aria-live` status, `aria-pressed`
toggles, visible focus, dark mode, non-colour-only badges. See `docs/ACCESSIBILITY.md`.

## Problem Statement Alignment
Role + concern + jurisdiction drive the prompt and the statutory engine; findings
are evidence-grounded; a plain-language mode and a lawyer-prep pack serve the
non-lawyer. Context differentiation is measured, not assumed. See
`docs/PROBLEM_ALIGNMENT.md`.
