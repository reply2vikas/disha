# Security

See `docs/RISKS.md` for the full risk register. Summary of controls:

- **No self-certification** — `evidence_status` is absent from both the Gemini
  response schema and the Zod schema; the model returns only a verbatim quote and
  status is computed deterministically.
- **Injection as data** — the PDF is passed to the model as an isolated media part,
  never concatenated into the instruction; the system prompt marks it untrusted.
- **Strict validation** — Zod `.strict()` rejects unknown fields and bad types
  before any response is trusted.
- **Key isolation** — `GEMINI_API_KEY` is read only in `server/index.ts`; it never
  enters the client bundle (verified by `npm run evaluate:repository`).
- **Ephemeral** — no database, no document persistence, 25 MB request cap.

## Dependency audit scope
`npm run security:audit` audits the **production runtime** tree
(`--omit=dev --audit-level=high`) — the code that actually ships on Cloud Run —
which is clean. The dev/test toolchain (vitest, vite, esbuild) carries moderate
advisories whose only fix is a major-version bump; these tools never ship and the
bump is deliberately deferred to avoid destabilising the test suite before
submission. Re-check with `npm audit` (full tree) at any time.
