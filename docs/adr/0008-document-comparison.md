# ADR-0008: Role-aware document comparison

**Status:** Accepted

**Context.** Readers frequently compare a draft against a revision and need to know
what got worse for them.

**Decision.** `src/lib/compare.ts` compares two analyses by clause category and
severity, classifying each category as added / removed / weakened / strengthened /
unchanged from the declared reader's perspective, with an ordering weight so the UI
can lead with the most consequential change. The same module exposes
`contextDifferentiation`, reused as Problem-Alignment evidence.

**Consequences.** A real, evidence-grounded comparison feature and a reusable
differentiation metric, both pure and unit-tested.
