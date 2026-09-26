# Disha — Context-Aware Legal Document Navigator

***Disha*** (दिशा) means *direction* — a guide through legal documents you didn't write.

> Upload a legal PDF, declare **who you are** and **what you care about**, and get
> findings that matter *to you* — each one **grounded in the document text**, or
> honestly marked **unverified**. Informational only. Not legal advice.

**Google stack:** Gemini (Generative Language API) · Google AI Studio · Cloud Run · Cloud Build · Artifact Registry. See [`docs/GOOGLE_STACK.md`](docs/GOOGLE_STACK.md).

Disha is built for the **AI for Legal Assistance & Access** challenge. Its
thesis: the danger in AI legal tools is not weak prose — it is **confident,
unverifiable claims**. Disha's core is therefore a *deterministic evidence
engine* that checks every quote the model produces against the real document, so
the model can never certify its own evidence.

---

## Why this is different

Most document Q&A tools ask the model *"is this quote in the document?"* and trust
the answer. Disha never does. It splits the work into two pipelines:

| Pipeline | Owner | Job |
| --- | --- | --- |
| **A — Analysis** | Gemini | Read the PDF for a role/concern and produce findings, each with a claimed verbatim `exact_quote`. |
| **B — Grounding** | Deterministic code | Independently locate every quote in the extracted text and assign a status. The model has no input here. |

The evidence status (`grounded`, `grounded_fuzzy`, `ambiguous`, `ungrounded`,
`ungrounded_scanned`) is **computed**, never generated. It is structurally absent
from the model's response schema (`src/lib/schema.ts`). This is the whole trust
model, and it is enforced by tests.

## The grounding engine (`src/lib/evidenceMatcher.ts`)

A five-tier cascade, cheapest first, biased toward the honest fallback:

1. **Exact single hit** → `grounded`
2. **Exact multiple hits** (+ `page_hint` disambiguation) → `grounded` / `ambiguous`
3. **Whitespace-flexible token regex** (heals PDF line-wrap) → `grounded` / `ambiguous`
4. **Sliding-window fuzzy** — blended `0.55·Dice(bigram) + 0.45·LCS`, with a
   *non-overlapping* second-best margin guard → `grounded_fuzzy`
5. **No acceptable match** → `ungrounded`

The linchpin is **normalization symmetry** (`src/lib/normalize.ts`): the *same*
transform (ligatures, NFKC, quote/dash folding, soft-hyphen repair, whitespace
collapse) is applied to both the document text and every quote before comparison.

## Domain depth

`src/lib/domain.ts` encodes an India-first lens: six roles, five concerns, and a
nine-category **clause taxonomy** consumed in three places — the model prompt,
attention-item grouping, and severity presentation. Branching is always on typed
IDs, never display strings.

---

## Quickstart

```bash
npm install
npm run dev          # http://localhost:5173  (demo mode, no key needed)
```

Demo mode ships two fully-grounded prepared contexts (tenant / landlord) so the
app is explorable with zero configuration.

### Live analysis

```bash
cp .env.example .env         # add your Gemini key
npm run build
npm start                    # http://localhost:8080
```

Get a key at <https://aistudio.google.com/apikey>. The key is read **server-side
only** and never enters the client bundle.

### Pre-flight health gate

```bash
curl localhost:8080/api/health
# { "status":"ok", "genai_configured":true, "provider":"gemini", "model":"gemini-3.8-flash" }
```

If `genai_configured` is `false`, the deployment has no key and is in demo mode.

---

## How each judging axis is addressed

- **Code Quality** — strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`-aware),
  one library shared by app + server (no duplicated logic), pure & unit-tested core,
  ADRs in `docs/adr/`.
- **Problem Statement Alignment** — role/concern-driven reading for non-lawyers, a
  "prepare for your lawyer" question pack, and an evidence model designed for the
  specific failure mode of legal AI (unverifiable claims).
- **Security** — the document is delivered to the model as an isolated media part,
  never concatenated into instructions; the system prompt declares it untrusted
  content; server-side Zod validation with `.strict()` rejects/strips unknown
  fields; key never client-side. See `docs/RISKS.md`.
- **Efficiency** — cheapest-tier model, five-tier cascade that stops at the first
  decision, and an in-memory context cache (`src/hooks/useAnalysis.ts`) that avoids
  re-calling the model when only the lens changes.
- **Testing** — 47 tests incl. all five matcher tiers, schema rejection, demo
  evidence integrity, and injection posture; plus a live-API validation harness
  (`npm run validate:live`).
- **Accessibility** — semantic landmarks, skip link, labelled controls, `aria-live`
  status regions, visible focus, dark-mode and reduced-reliance-on-colour badges.

## Project structure

```
src/lib/           normalize · evidenceMatcher · schema · domain · grounding · pdfText
src/lib/providers/ AIProvider · GeminiProvider · DemoProvider · prompt · demoData
src/components/     ContextSelector · AttentionItemCard · EvidenceBadge · LegalDisclaimer
server/            Express server (Cloud Run) — reuses the lib, holds the key
tests/             47 tests across 11 files
docs/              ARCHITECTURE · RISKS · LIVE_VALIDATION · adr/*
```

## Deploy (Cloud Run)

```bash
gcloud run deploy disha --source . \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY --allow-unauthenticated
```

A `Dockerfile` is included; Cloud Run builds it automatically.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (demo mode) |
| `npm run build` | Typecheck + production bundle |
| `npm start` | Serve built SPA + API (Cloud Run entry) |
| `npm test` | Full vitest suite |
| `npm run lint` | oxlint (react + jsx-a11y + typescript) |
| `npm run typecheck` | tsc for app + server projects |
| `npm run generate:fixtures` | Write a small PDF fixture |
| `npm run validate:live` | Real Gemini call → schema + grounding check (needs key) |

## Disclaimer

Disha provides **informational analysis only** and is **not legal advice**.
Documents are processed ephemerally and never stored. Always consult a qualified
legal professional before acting on any document.
