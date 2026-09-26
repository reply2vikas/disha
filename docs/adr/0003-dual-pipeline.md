# ADR-0003: Separate analysis from verification

**Status:** Accepted

**Context.** The critical failure mode of AI legal tools is confident,
unverifiable claims.

**Decision.** Two pipelines. The model (A) interprets and proposes quotes; a
deterministic engine (B) verifies each quote against the real document. The model
has no input into verification.

**Consequences.** Trust is grounded in code, not in the model's self-report. This
is the product's central differentiator and is enforced by tests.
