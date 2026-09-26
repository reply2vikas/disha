/**
 * server/index.ts — Express server for Cloud Run.
 *
 * Serves the built SPA and exposes /api/health and /api/analyze. It reuses the
 * SAME provider/schema/prompt library the app is built from (no duplicated
 * logic). The Gemini API key lives here (server-side) and never reaches the
 * client bundle. Run via `tsx` (see package.json `start`).
 */
import express from 'express';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { selectProvider } from '../src/lib/providers/index';
import type { ConcernId, JurisdictionId, RoleId } from '../src/lib/domain';

/** Minimal .env loader (no dependency): KEY=VALUE lines, does not overwrite real env. */
function loadEnv(file = '.env'): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

const dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '25mb' }));

const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
};
const hasKey = (): boolean => Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    genai_configured: hasKey(),
    provider: hasKey() ? 'gemini' : 'demo',
    model: hasKey() ? env.GEMINI_MODEL || 'gemini-3.8-flash' : null,
  });
});

app.post('/api/analyze', async (req, res) => {
  const body = req.body as {
    pdfBase64?: string;
    role?: RoleId;
    concern?: ConcernId;
    jurisdiction?: JurisdictionId;
  };
  if (!body?.role || !body?.concern || !body?.jurisdiction) {
    return res.status(400).json({ error: 'role, concern and jurisdiction are required' });
  }
  const provider = selectProvider(env);
  if (provider.id === 'gemini' && !body.pdfBase64) {
    return res.status(400).json({ error: 'pdfBase64 is required for live analysis' });
  }
  try {
    const analysis = await provider.analyze({
      pdfBase64: body.pdfBase64 ?? '',
      role: body.role,
      concern: body.concern,
      jurisdiction: body.jurisdiction,
    });
    return res.json({ provider: provider.id, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    // Unprepared demo context is a client-addressable condition, not a server fault.
    if (provider.id === 'demo') return res.status(422).json({ error: message });
    return res.status(500).json({ error: message });
  }
});

const dist = path.join(dirname, '..', 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Disha on :${port} (genai_configured=${hasKey()})`);
});
