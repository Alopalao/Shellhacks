// GET /api/health — liveness + AI/evidence configuration (no auth).
import fs from 'node:fs';
import { Router } from 'express';
import type { Config } from '../config';
import type { ServerContext } from '../context';
import type { AiStatus, HealthResponse } from '../shared/contracts';

function readVersion(): string {
  try {
    const pkg: unknown = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    const version = (pkg as { version?: unknown }).version;
    return typeof version === 'string' ? version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const VERSION = readVersion();

export function aiStatusFromConfig(config: Config): AiStatus {
  const live = !config.evidenceOffline;
  return {
    provider: config.anthropicApiKey ? 'anthropic' : 'mock',
    model: config.anthropicApiKey ? config.claudeModel || null : null,
    evidence: { pubmed: live, medlineplus: live, openfda: live, rxnorm: live },
  };
}

export function createHealthRouter(ctx: ServerContext): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    const body: HealthResponse = {
      ok: true,
      name: 'BRIAN',
      version: VERSION,
      time: new Date().toISOString(),
      ai: aiStatusFromConfig(ctx.config),
    };
    res.json(body);
  });
  return router;
}
