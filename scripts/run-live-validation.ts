/**
 * run-live-validation.ts — proves the real Gemini path end-to-end.
 * Calls the live provider, validates the schema, and grounds every returned
 * quote with the deterministic matcher. Skips cleanly with no API key.
 *
 * Run: npm run validate:live   (reads GEMINI_API_KEY from env/.env)
 */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { GeminiProvider } from '../src/lib/providers/GeminiProvider';
import { indexFromPlainText } from '../src/lib/textIndex';
import { matchEvidence } from '../src/lib/evidenceMatcher';
import { contextDifferentiation } from '../src/lib/compare';
import { DEMO_DOCUMENT_TEXT } from '../src/lib/providers/demoData';

/** Load .env (KEY=VALUE), without overwriting real environment variables. */
function loadEnv(file = '.env'): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnv();

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    console.log('⚠  GEMINI_API_KEY not set — skipping live validation (this is OK).');
    return;
  }
  if (!existsSync('tests/fixtures/sample-lease.pdf')) {
    execSync('node scripts/generate-fixtures.mjs', { stdio: 'inherit' });
  }
  const pdfBase64 = readFileSync('tests/fixtures/sample-lease.pdf').toString('base64');

  const provider = new GeminiProvider(key, process.env.GEMINI_MODEL);
  console.log('→ Calling live Gemini…');
  const analysis = await provider.analyze({
    pdfBase64,
    role: 'tenant',
    concern: 'financial-exposure',
    jurisdiction: 'india',
  });

  // Ground quotes against the known text (the fixture mirrors DEMO_DOCUMENT_TEXT).
  const index = indexFromPlainText(DEMO_DOCUMENT_TEXT);
  const quotes = [
    ...analysis.obligations.map((o) => o.exact_quote),
    ...analysis.attention_items.map((a) => a.exact_quote),
  ];
  let grounded = 0;
  for (const q of quotes) {
    const r = matchEvidence(q, null, index);
    if (r.status === 'grounded' || r.status === 'grounded_fuzzy') grounded++;
  }
  const ratio = quotes.length ? grounded / quotes.length : 0;
  console.log(`✓ Schema valid. Grounded ${grounded}/${quotes.length} quotes (${(ratio * 100).toFixed(0)}%).`);

  // Problem-Alignment evidence: a different context must reason differently.
  const second = await provider.analyze({
    pdfBase64,
    role: 'landlord',
    concern: 'exit-termination',
    jurisdiction: 'india',
  });
  const diff = contextDifferentiation(analysis, second);
  console.log(`→ Context differentiation (tenant/financial vs landlord/exit): ${(diff * 100).toFixed(0)}%`);
  if (diff <= 0) console.warn('⚠  Contexts produced identical prioritisation — investigate prompt.');
  if (ratio < 0.5) {
    console.error('✗ Grounded ratio below 50% — investigate extraction/prompt.');
    process.exit(1);
  }
  console.log('✓ Live validation passed.');
}

main().catch((err) => {
  console.error('✗ Live validation failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
