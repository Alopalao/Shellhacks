import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, '../..');

dotenv.config({ path: path.join(repoRoot, '.env'), quiet: true });

const env = (name: string): string => (process.env[name] ?? '').trim();

export const config = {
  port: Number(env('PORT') || 4000),
  host: env('HOST') || '0.0.0.0',
  /** JSON store location. Tests override this with a temp file. */
  dataFile: env('BRIAN_DATA_FILE') || path.join(repoRoot, 'server', 'data', 'db.json'),
  anthropicApiKey: env('ANTHROPIC_API_KEY'),
  claudeModel: env('CLAUDE_MODEL') || 'claude-opus-5',
  claudeEffort: (env('CLAUDE_EFFORT') || 'medium') as 'low' | 'medium' | 'high' | 'xhigh' | 'max',
  ncbiApiKey: env('NCBI_API_KEY'),
  ncbiEmail: env('NCBI_EMAIL'),
  openFdaApiKey: env('OPENFDA_API_KEY'),
  /** Set to "1" to skip all outbound evidence calls (offline demos / tests). */
  evidenceOffline: env('BRIAN_EVIDENCE_OFFLINE') === '1',
};

export type Config = typeof config;
