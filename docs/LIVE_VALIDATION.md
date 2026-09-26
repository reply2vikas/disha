# Live Validation

Unit tests assert logic against fixtures. The **live-validation harness** proves
the real path works end to end against the actual Gemini API.

```bash
cp .env.example .env      # add GEMINI_API_KEY
npm run generate:fixtures # writes tests/fixtures/sample-lease.pdf
npm run validate:live
```

`validate:live`:
1. loads (or generates) a small real PDF,
2. calls the live `GeminiProvider`,
3. validates the response against the Zod schema, and
4. runs the deterministic matcher over every returned quote, asserting a high
   grounded ratio.

If `GEMINI_API_KEY` is absent, the harness prints a clear skip notice and exits 0,
so it is safe to run in any environment.
