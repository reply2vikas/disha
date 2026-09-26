/**
 * loadEnv.ts — tiny, dependency-free .env loader (server/CLI only).
 * Reads KEY=VALUE lines from a .env file in the current directory and fills any
 * variables not already set in the environment. Kept out of src/ so it never
 * enters the browser bundle.
 */
import { readFileSync, existsSync } from 'node:fs';

export function loadEnv(path = '.env'): void {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
