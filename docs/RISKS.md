# Security & Risk Register

| Risk | Mitigation |
| --- | --- |
| **Prompt injection via document content** | The PDF is passed to Gemini as an isolated media part, never concatenated into the instruction. The system prompt explicitly designates document text as untrusted content to analyze, never commands. Verified by `tests/promptInjection.test.ts`. |
| **Model fabricates or misquotes evidence** | Pipeline B independently verifies every quote. Fabricated quotes resolve to `ungrounded` and are surfaced as such. The model cannot set evidence status (absent from schema). Verified by `tests/grounding.test.ts`. |
| **Malformed / adversarial model output** | Server-side Zod `.strict()` validation rejects unknown fields and wrong types before the response is trusted. Verified by `tests/schema.test.ts`. |
| **API key exposure** | Key is read only in `server/index.ts` from the environment; it never appears in the client bundle. The client talks to `/api/analyze`. |
| **Scanned/no-text PDFs give false confidence** | Pages with no reliable text layer are flagged; any match on them is downgraded to `ungrounded_scanned`. |
| **Over-reliance on AI for legal decisions** | A non-dismissible "informational only, not legal advice" disclaimer is present on every screen and in every result. |
| **Large upload abuse** | JSON body capped at 25 MB; documents processed ephemerally, never stored. |

## Explicitly out of scope
Authentication, multi-tenant storage, document retention, and jurisdiction-specific
legal conclusions are intentionally excluded — Disha is a reading aid, not a
system of record or a substitute for counsel.
