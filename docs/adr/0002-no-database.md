# ADR-0002: No database

**Status:** Accepted

**Context.** A legal reading aid handles sensitive documents.

**Decision.** Store nothing. Documents are processed in memory for a single
analysis and discarded. Demo content is a code constant.

**Consequences.** Strong privacy posture and a trivial deployment. Trade-off: no
history across sessions — acceptable and arguably desirable for this use case.
