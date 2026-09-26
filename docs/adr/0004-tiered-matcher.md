# ADR-0004: Five-tier evidence matcher with conservative thresholds

**Status:** Accepted

**Context.** PDF text extraction is noisy (ligatures, line wraps, spacing). A
naive `includes()` misses valid quotes; a loose fuzzy match invents them.

**Decision.** A cascade — exact → exact-multi → whitespace-flex → sliding-window
fuzzy — over symmetrically-normalized text. Fuzzy uses `0.55·Dice + 0.45·LCS`
with a **non-overlapping** second-best margin guard, so shifted windows over the
same location don't suppress a valid match while genuine duplicate clauses still
force `ambiguous`.

**Bias.** A false `grounded` is catastrophic; a false `ungrounded` is merely
unfortunate. Thresholds (`fuzzyMinSimilarity` 0.82, `fuzzyMinMargin` 0.08) lean
toward the honest fallback and are exported as config to be tuned on a real
corpus.

**Consequences.** High-precision grounding with graceful, visible degradation.
