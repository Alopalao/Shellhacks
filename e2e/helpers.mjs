// Shared helpers for the BRIAN live two-user demo test (no app/server code is imported).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, '..');

const trimSlash = (s) => s.replace(/\/+$/, '');
const flag = (name) => process.argv.includes(`--${name}`);

export const config = {
  web: trimSlash(process.env.BRIAN_WEB_URL || 'http://localhost:8081'),
  api: trimSlash(process.env.BRIAN_API_URL || 'http://localhost:4000'),
  shots: path.resolve(process.env.E2E_SHOTS || path.join(here, 'shots')),
  headed: process.env.HEADED === '1' || flag('headed'),
  slowMo: Number(process.env.SLOWMO || (process.env.HEADED === '1' || flag('headed') ? 150 : 0)),
  /** Wipe + re-seed the demo data before the run (POST /api/admin/reset). */
  reset: process.env.E2E_RESET === '1' || flag('reset'),
  /** Start/stop our own server (temp data file) — also enables the server-restart step. */
  manageServer: process.env.E2E_MANAGE_SERVER === '1' || flag('managed'),
  /** Force the app to talk to BRIAN_API_URL (localStorage override), whatever the build defaults to. */
  pinServerUrl: process.env.E2E_PIN_SERVER_URL !== '0',
  /** Run only these step numbers, e.g. E2E_ONLY=1,3,4. Setup always runs. */
  only: (process.env.E2E_ONLY || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** First navigation can be slow on `expo start --web` (bundling). */
  firstLoadTimeout: Number(process.env.E2E_FIRST_LOAD_TIMEOUT || 180_000),
  timeout: Number(process.env.E2E_TIMEOUT || 15_000),
};

export const DEMO = {
  patient: { email: 'patient@brian.demo', id: 'usr_demo_maya', name: 'Maya Johnson' },
  doctor: { email: 'doctor@brian.demo', id: 'usr_demo_reyes', name: 'Dr. Daniel Reyes' },
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll `fn` until it returns a truthy value (returned) or throw with `message` after `timeout`. */
export async function waitFor(fn, message, { timeout = config.timeout, interval = 250 } = {}) {
  const end = Date.now() + timeout;
  let last;
  let lastError;
  while (Date.now() < end) {
    try {
      last = await fn();
      if (last) return last;
    } catch (e) {
      lastError = e;
    }
    await sleep(interval);
  }
  const why = lastError ? ` (last error: ${lastError.message.split('\n')[0]})` : '';
  throw new Error(`Timed out after ${timeout} ms: ${message}${why}`);
}

export async function bodyText(page) {
  // The app joins some words with no-break spaces (e.g. "Dr.\u00A0Reyes", times like "8:00\u202FAM");
  // compare what the user sees, with plain spaces.
  return (await page.locator('body').innerText()).replace(/[\u00A0\u202F]/g, ' ');
}

/** Wait until the page body contains `needle` (string or RegExp). */
export async function waitForText(page, needle, message, opts) {
  const test = typeof needle === 'string' ? (t) => t.includes(needle) : (t) => needle.test(t);
  return waitFor(async () => test(await bodyText(page)), message ?? `text ${needle} on ${page.url()}`, opts);
}

export async function waitForNoText(page, needle, message, opts) {
  const test = typeof needle === 'string' ? (t) => t.includes(needle) : (t) => needle.test(t);
  return waitFor(async () => !test(await bodyText(page)), message ?? `text ${needle} to disappear on ${page.url()}`, opts);
}

export async function waitForUrl(page, re, message, opts) {
  return waitFor(async () => re.test(page.url()), message ?? `URL ${re} (at ${page.url()})`, opts);
}

/** Text of the bottom tab bar, e.g. "Home | Meds | BRIAN AI | 1 Care | Lessons". */
export async function tabBar(page) {
  const tabs = await page.locator('[role="tab"]').allInnerTexts();
  return tabs.map((t) => t.replace(/\s+/g, ' ').trim()).join(' | ');
}

/** Badge number rendered on a tab (0 when none). */
export async function tabBadge(page, name) {
  // innerText = icon glyph (private-use char) + optional badge number + title.
  const tabs = await page.locator('[role="tab"]').allInnerTexts();
  for (const raw of tabs) {
    const t = raw.replace(/\s+/g, ' ').trim();
    const m = new RegExp(`(?:^|[^A-Za-z0-9])(?:(\\d+)\\s*)?${name}$`).exec(t);
    if (m) return m[1] ? Number(m[1]) : 0;
  }
  return 0;
}

/** Tap a bottom tab by its visible title (tabs may carry longer aria-labels and a badge number). */
export async function clickTab(page, name) {
  await page
    .locator('[role="tab"]')
    .filter({ hasText: new RegExp(`(^|[^A-Za-z])${name}\\s*$`) }) // text = icon glyph + badge + title
    .first()
    .click();
}

// ───────────────────────── REST (setup / cleanup / cross-checks) ─────────────────────────

export async function api(method, route, { token, body } = {}) {
  const res = await fetch(config.api + route, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`${method} ${route} → ${res.status} ${json?.error ?? text}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

const tokens = new Map();

/**
 * Bearer token for `email`, one login per account per run: the server keeps at most 20 sessions per
 * user, so logging in on every call could sign a presenter's real browser out after a few runs.
 */
export async function apiLogin(email) {
  if (!tokens.has(email)) {
    const res = await api('POST', '/api/auth/login', { body: { email, password: 'e2e' } });
    tokens.set(email, res.token);
  }
  return tokens.get(email);
}

/** Forget cached tokens (after a reset / managed-server restart with a fresh data file). */
export function forgetTokens() {
  tokens.clear();
}

export async function isUp(url, timeoutMs = 2000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

// ───────────────────────── Optional managed server ─────────────────────────

export class ManagedServer {
  constructor() {
    const url = new URL(config.api);
    this.port = url.port || '4000';
    this.dataFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'brian-e2e-')), 'db.json');
    this.logFile = path.join(config.shots, 'server.log');
    this.child = null;
  }

  async start() {
    const cli = path.join(repoRoot, 'server', 'node_modules', 'tsx', 'dist', 'cli.mjs');
    if (!fs.existsSync(cli)) throw new Error(`tsx not found at ${cli} — run "npm run setup" at the repo root first.`);
    fs.mkdirSync(config.shots, { recursive: true });
    const out = fs.openSync(this.logFile, 'a');
    this.child = spawn(process.execPath, [cli, 'src/index.ts'], {
      cwd: path.join(repoRoot, 'server'),
      env: { ...process.env, PORT: this.port, BRIAN_DATA_FILE: this.dataFile, NO_COLOR: '1' },
      stdio: ['ignore', out, out],
    });
    const child = this.child;
    await waitFor(
      async () => {
        if (child.exitCode !== null) throw new Error(`server exited with code ${child.exitCode} — see ${this.logFile}`);
        return isUp(`${config.api}/api/health`);
      },
      `server to answer on ${config.api}`,
      { timeout: 30_000, interval: 300 },
    );
  }

  async stop() {
    const child = this.child;
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise((r) => child.once('exit', r));
    child.kill('SIGTERM');
    await Promise.race([exited, sleep(6000)]);
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await waitFor(async () => !(await isUp(`${config.api}/api/health`, 500)), 'server to stop', { timeout: 10_000 });
    this.child = null;
  }
}
