# ADR-0007: Deterministic jurisdiction/statutory engine

**Status:** Accepted

**Context.** Jurisdiction as a mere prompt label adds little and is unverifiable.
Real value comes from applying well-established statutory positions to the actual
document text.

**Decision.** A deterministic engine (`src/lib/jurisdiction.ts`) scans the extracted,
normalized document text for terms with a settled statutory treatment (India-first:
Contract Act ss. 27 & 74, Consumer Protection Act 2019, Arbitration Act 1996, DPDP
Act 2023) and surfaces informational, non-advice notes. Flags are computed, never
model-generated. `generic` jurisdiction carries no flags.

**Consequences.** Genuine, testable domain logic and India-first differentiation,
with a clean extension path per jurisdiction. It never opines on enforceability for
the user's case — it states the general position and defers to a professional.
