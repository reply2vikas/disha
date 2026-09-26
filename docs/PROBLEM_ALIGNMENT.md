# Problem Alignment

**User problem.** A non-lawyer must act on a document they cannot fully parse, and
the real danger of an AI helper is a confident but unverifiable claim.

**Product behaviour.** The reader declares role, concern and jurisdiction. The
model reasons *from that lens*; a deterministic engine then proves every quote
against the document, and a jurisdiction-aware statutory scanner adds informational
context. Findings carry a plain-language mode and a "prepare for your lawyer" pack.

**Evidence it is genuinely context-aware (not a generic summary).** The two demo
contexts produce different prioritised findings, and `contextDifferentiation`
(`src/lib/compare.ts`) quantifies the gap; `npm run validate:live` reports the same
metric on the real model. Role/concern/jurisdiction reach the prompt
(`src/lib/providers/prompt.ts`) and the statutory engine (`src/lib/jurisdiction.ts`).

**User outcome.** The reader sees what matters to them, why, where the document
proves it, and what to ask a professional — without being given legal advice.
