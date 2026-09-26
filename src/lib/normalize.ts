/**
 * normalize.ts — Text normalization for grounding.
 *
 * The single most important property of the verification pipeline is SYMMETRY:
 * the exact-same normalization is applied to (a) the full document text and
 * (b) every quote returned by the model, before they are ever compared.
 * Matching is only reliable because both sides pass through this one function.
 */

const LIGATURES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\uFB00/g, 'ff'],
  [/\uFB01/g, 'fi'],
  [/\uFB02/g, 'fl'],
  [/\uFB03/g, 'ffi'],
  [/\uFB04/g, 'ffl'],
  [/\u00E6/g, 'ae'],
  [/\u0153/g, 'oe'],
];

/** Canonical normalization used for BOTH document text and model quotes (case preserved). */
export function normalizeText(input: string): string {
  let out = input;
  for (const [re, sub] of LIGATURES) out = out.replace(re, sub);
  out = out.normalize('NFKC');
  out = out.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  out = out.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  out = out.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-');
  out = out.replace(/\u00AD\s*/g, '');
  out = out.replace(/[\s\u00A0\u2007\u202F]+/g, ' ');
  return out.trim();
}

/** Comparison normalization (adds case-folding). */
export function normalizeForMatch(input: string): string {
  return normalizeText(input).toLowerCase();
}

/** Whitespace tokenizer applied after match-normalization. */
export function tokenize(input: string): string[] {
  const n = normalizeForMatch(input);
  return n.length === 0 ? [] : n.split(' ').filter(Boolean);
}
