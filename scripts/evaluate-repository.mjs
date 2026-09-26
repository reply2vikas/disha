/**
 * evaluate-repository.mjs — pre-submission engineering self-audit.
 *
 * NOT a Hack2Skill score and NOT a fabricated percentage. It runs the real gates
 * and structural/security checks and prints PASS/FAIL per dimension plus a blocker
 * count, so problems are caught before submission. Exits non-zero on any blocker.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const results = { 'Code Quality': [], Security: [], Efficiency: [], Testing: [], Accessibility: [], 'Problem Alignment': [] };
let blockers = 0;

function gate(dim, name, fn, isBlocker = true) {
  let ok = false;
  try { ok = Boolean(fn()); } catch { ok = false; }
  results[dim].push({ name, ok });
  if (!ok && isBlocker) blockers++;
  return ok;
}
function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
  return true;
}
function read(p) {
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}
function srcNoProcessEnvKey() {
  // Client source (src/) must not read the API key directly.
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const fp = path.join(dir, e.name);
    return e.isDirectory() ? walk(fp) : [fp];
  });
  return walk('src').every((f) => !read(f).includes('process.env.GEMINI_API_KEY'));
}
function bundleHasNoKey() {
  const dir = 'dist/assets';
  if (!existsSync(dir)) return false;
  return readdirSync(dir).filter((f) => f.endsWith('.js')).every((f) => {
    const c = read(path.join(dir, f));
    return !c.includes('GEMINI_API_KEY') && !/AIza[0-9A-Za-z_-]{20,}/.test(c);
  });
}

console.log('Running gates… (typecheck, lint, test, build)');
gate('Code Quality', 'typecheck', () => run('npm run typecheck'));
gate('Code Quality', 'lint (0 errors)', () => run('npm run lint'));
gate('Testing', 'unit + golden + adversarial suite', () => run('npm test'));
gate('Code Quality', 'production build', () => run('npm run build'));

// Security
gate('Security', 'no evidence_status in schema', () => !read('src/lib/schema.ts').includes('evidence_status'));
gate('Security', 'strict schema validation', () => read('src/lib/schema.ts').includes('.strict()'));
gate('Security', 'injection posture in prompt', () => /untrusted content/i.test(read('src/lib/providers/prompt.ts')));
gate('Security', 'API key not read in client src', srcNoProcessEnvKey);
gate('Security', 'API key absent from built bundle', bundleHasNoKey);
gate('Security', 'dependency audit (high)', () => run('npm run security:audit'), false);

// Efficiency
gate('Efficiency', 'context cache present', () => /cache\.current/.test(read('src/hooks/useAnalysis.ts')));
gate('Efficiency', 'lazy PDF import', () => /import\('pdfjs-dist'\)/.test(read('src/lib/pdfText.ts')));
gate('Efficiency', 'cheapest model tier', () => /gemini-[0-9.]+-flash/.test(read('src/lib/providers/GeminiProvider.ts')));

// Accessibility
gate('Accessibility', 'skip link', () => read('src/App.tsx').includes('skip-link'));
gate('Accessibility', 'aria-live status', () => read('src/App.tsx').includes('aria-live'));
gate('Accessibility', 'non-dismissible disclaimer', () => existsSync('src/components/LegalDisclaimer.tsx'));

// Problem Alignment
gate('Problem Alignment', 'role/concern/jurisdiction in prompt', () => {
  const p = read('src/lib/providers/prompt.ts');
  return p.includes('roleLabel') && p.includes('concernLabel') && p.includes('jurisdictionLabel');
});
gate('Problem Alignment', 'statutory engine', () => existsSync('src/lib/jurisdiction.ts'));
gate('Problem Alignment', 'context differentiation metric', () => read('src/lib/compare.ts').includes('contextDifferentiation'));
gate('Problem Alignment', 'discoverability files', () => existsSync('public/llms.txt') && existsSync('public/.well-known/ai-catalog.json'));

// Report
console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║  DISHA — PRE-SUBMISSION SELF-AUDIT                 ║');
console.log('╠══════════════════════════════════════════════════════╣');
for (const [dim, checks] of Object.entries(results)) {
  const pass = checks.every((c) => c.ok);
  console.log(`║  ${(dim + ' ').padEnd(20, '·')} ${pass ? 'PASS' : 'FAIL'}${' '.repeat(28)}║`.slice(0, 56) + '║');
  for (const c of checks) console.log(`║    ${c.ok ? '✓' : '✗'} ${c.name}`.padEnd(55) + '║');
}
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  BLOCKERS: ${blockers}`.padEnd(55) + '║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('\nThis is an engineering self-check, not an official score.');
process.exit(blockers > 0 ? 1 : 0);
