# ADR-0001: All-TypeScript stack on Cloud Run

**Status:** Accepted

**Context.** The build must be small (<10 MB repo), fast to reason about, and
deployable with a live AI endpoint.

**Decision.** One language end to end: React + Vite (SPA) and an Express server,
all TypeScript. The server reuses the exact same `src/lib` the app is built from,
run via `tsx`, so there is no duplicated analysis logic. Deployed on Cloud Run
via a small Dockerfile.

**Consequences.** A single mental model and type system across UI, engine and
server. The server holds the API key. Trade-off: `tsx` runs TS at runtime rather
than shipping precompiled JS — accepted because eliminating duplicated logic is a
larger correctness and code-quality win.
