# ADR-0006: In-memory context cache

**Status:** Accepted

**Context.** Users re-read the same document under different lenses (role /
concern / jurisdiction). Re-calling the model on every switch is wasteful.

**Decision.** `useAnalysis` caches results per `role:concern:jurisdiction` for the
loaded document. Switching to a cached lens is instant and free; a new lens
triggers exactly one model call. The cache clears when the document changes.

**Consequences.** Lower latency and cost with no persistence footprint.
