# Google Cloud & GenAI stack

Disha is built end-to-end on Google's platform.

| Layer | Google service | Where it is used |
| --- | --- | --- |
| **Generative AI** | **Google Gemini** (Generative Language API) | `src/lib/providers/GeminiProvider.ts` — reads the PDF natively and produces role/concern-aware findings with verbatim evidence quotes and uncertainty notes. Model configurable via `GEMINI_MODEL` (default a current flash-tier model). |
| **AI key & models** | **Google AI Studio** | Issues the API key; model catalogue used to select the flash tier. |
| **Structured output** | **Gemini `responseSchema`** | Enforces the analysis JSON contract at generation time (`src/lib/schema.ts`). |
| **Hosting** | **Google Cloud Run** | Serverless container serving the SPA + API on one origin (`Dockerfile`, `server/index.ts`). |
| **Build** | **Google Cloud Build** | Builds the container from source on `gcloud run deploy --source .`. |
| **Registry** | **Google Artifact Registry** | Stores the built image for Cloud Run. |

**Design note.** GenAI is used *only* where genuine reasoning is required (contextual
reading of the document). All verification, statutory checks, grounding and comparison
are deterministic code — so the model cannot certify its own evidence. This is a
deliberate, cost-aware split (cheapest capable Gemini tier), not a limitation.

**Intentionally NOT used:** no database or cloud storage. Documents are processed
ephemerally in memory and never persisted — a privacy and security choice, not an
omission.
