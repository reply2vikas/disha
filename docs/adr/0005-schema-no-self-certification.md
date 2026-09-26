# ADR-0005: The model cannot certify its own evidence

**Status:** Accepted

**Context.** If the model can output an "evidence_status" field, it will
sometimes assert "verified" for a quote that is not in the document.

**Decision.** Evidence status is absent from both the Gemini `responseSchema` and
the Zod schema. The model returns only a verbatim `exact_quote` and optional
`page_hint`. Status is computed downstream. Zod `.strict()` rejects any smuggled
status field.

**Consequences.** Self-certification is structurally impossible, not merely
discouraged. Verified by `tests/schema.test.ts`.
