# Architecture

## Two-pipeline design

```
                 ┌─────────────────────────────────────────────┐
   PDF ─────────▶│ Pipeline A — Analysis (Gemini, server-side)  │
   role/concern  │  reads the PDF as an isolated media part     │
                 │  emits findings + claimed exact_quote        │
                 └───────────────────────┬─────────────────────┘
                                         │ AnalysisResult (Zod-validated)
                 ┌───────────────────────▼─────────────────────┐
   PDF text  ───▶│ Pipeline B — Grounding (deterministic, local)│
   (PDF.js)      │  matchEvidence(quote, pageHint, index)       │
                 │  → grounded | grounded_fuzzy | ambiguous |   │
                 │    ungrounded | ungrounded_scanned           │
                 └───────────────────────┬─────────────────────┘
                                         │ GroundedAnalysis
                                         ▼
                                    React UI (badges, highlights)
```

The model owns *interpretation*; deterministic code owns *verification*. The two
never mix: evidence status is not representable in the model's response schema.

## Key modules

- **`normalize.ts`** — one transform applied to both sides of every comparison
  (normalization symmetry). Everything downstream depends on this.
- **`evidenceMatcher.ts`** — the five-tier cascade and its similarity primitives
  (`diceBigram`, `lcsRatio`, blended `similarity`). Pure, no I/O.
- **`schema.ts`** — Zod schema (`.strict()`) + the Gemini `responseSchema`, kept
  in lockstep. Single source of truth for the model contract.
- **`domain.ts`** — typed roles/concerns/jurisdictions + clause taxonomy.
- **`grounding.ts`** — merges Pipeline A output with Pipeline B results.
- **`pdfText.ts`** — PDF.js extraction with a reverse character→page/bbox index,
  plus `indexFromPlainText` for demo/tests.
- **`providers/`** — `AIProvider` contract with `GeminiProvider` (live) and
  `DemoProvider` (no-key). `selectProvider` chooses by key presence.
- **`server/index.ts`** — Express host for Cloud Run, importing the same library.

## Data flow & privacy

The PDF is sent once to the server for the model call and processed in memory;
nothing is persisted. Grounding runs in the browser on locally-extracted text.
