# Performance & Efficiency

- **Cheapest-tier model** — `gemini-3.8-flash` for synthesis; no premium tier.
- **Cascade short-circuits** — the matcher stops at the first tier that decides,
  so exact matches never run the fuzzy scan.
- **Context cache** — `useAnalysis` caches results per `role:concern:jurisdiction`
  for a loaded document; switching lens to a cached context makes zero model
  calls. Cache clears when the document changes.
- **Lazy PDF engine** — `pdfjs-dist` is dynamically imported only when a real PDF
  is opened, so it is split into its own chunk and never blocks first paint (see
  the build output: the PDF chunk is separate from the app chunk).
- **Ephemeral** — no database; the document is processed in memory and discarded.

Measure locally with `npm run build` (chunk sizes) and the browser Performance panel.
