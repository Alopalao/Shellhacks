// Shared helpers for the repo-root scripts (setup, dev, doctor, lan). Plain Node, no dependencies,
// so they run straight after `git clone` on macOS, Linux and Windows.
import { spawn } from 'node:child_process';
import dgram from 'node:dgram';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const isWindows = process.platform === 'win32';
export const isMac = process.platform === 'darwin';

/** Default ports: BRIAN API (server/.env PORT) and Expo's Metro dev server (serves the web app too). */
export const API_PORT = 4000;
export const METRO_PORT = 8081;

// ── Output ───────────────────────────────────────────────────────────────────────────────────────

const useColor = !!process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : String(text));
export const yellow = paint('38;2;255;212;0');
export const bold = paint('1');
export const dim = paint('2');
export const red = paint('31');
export const green = paint('32');

export const ok = (text) => console.log(`  ${green('✓')} ${text}`);
export const warn = (text) => console.log(`  ${yellow('!')} ${text}`);
export const fail = (text) => console.log(`  ${red('✗')} ${text}`);

// ── Node version ─────────────────────────────────────────────────────────────────────────────────

/**
 * Node versions every part of BRIAN supports: the intersection of the dependencies' `engines`
 * (react-native / metro: ^20.19.4 || ^22.13.0 || ^24.3.0 || >=25; vitest 5: ^22.12.0 || ^24 || >=26).
 * Keep in sync with "engines" in the root package.json.
 */
export const NODE_RANGE = '^22.13.0 || ^24.3.0 || >=26.0.0';

export function nodeVersionSupported(version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number);
  return (major === 22 && minor >= 13) || (major === 24 && minor >= 3) || major >= 26;
}

export function nodeInstallHelp() {
  const lines = [
    `BRIAN needs Node.js 24 LTS (supported: ${NODE_RANGE}). You have ${process.version}.`,
    '',
  ];
  if (isWindows) {
    lines.push(
      'Install it from PowerShell:',
      '  winget install --id OpenJS.NodeJS.LTS -e',
      'or download the LTS installer from https://nodejs.org',
      'Then close and reopen the terminal and run `node -v` again.',
    );
  } else if (isMac) {
    lines.push(
      'Install it with Homebrew:',
      '  brew install node@24 && brew link --overwrite --force node@24',
      'or with nvm:  nvm install 24   (this repo has an .nvmrc, so `nvm use` picks 24)',
      'or download the LTS installer from https://nodejs.org',
      'Then open a new terminal and run `node -v` again.',
    );
  } else {
    lines.push(
      'Install it with nvm:  nvm install 24   (this repo has an .nvmrc, so `nvm use` picks 24)',
      'or see https://nodejs.org/en/download',
    );
  }
  return lines.join('\n');
}

/** Exit with install instructions when this Node is too old (or an unsupported odd release). */
export function requireSupportedNode() {
  if (nodeVersionSupported()) return;
  const [first, ...rest] = nodeInstallHelp().split('\n');
  console.error(`\n${red('✗')} ${first}\n${rest.map((line) => (line ? `  ${line}` : '')).join('\n')}\n`);
  process.exit(1);
}

// ── npm ──────────────────────────────────────────────────────────────────────────────────────────

/** Path to npm's JS entry point (npm-cli.js), so npm can be run with this very Node binary. */
function findNpmCli() {
  const fromNpm = process.env.npm_execpath; // set when we were started by `npm run …`
  if (fromNpm && /npm-cli\.c?js$/.test(fromNpm) && fs.existsSync(fromNpm)) return fromNpm;
  const nodeDir = path.dirname(process.execPath);
  const candidates = [
    path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'), // Windows installer, nvm-windows
    path.join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'), // macOS/Linux, nvm, Homebrew
  ];
  return candidates.find((file) => fs.existsSync(file)) ?? null;
}

/**
 * Spawn `npm <args>` without going through a shell: `node npm-cli.js <args>` when npm's entry point
 * can be found (no DEP0190 warning, no npm.cmd batch-file layer on Windows, and the same Node
 * version as this script). Falls back to the `npm` / `npm.cmd` on PATH.
 */
export function spawnNpm(args, options = {}) {
  const cli = findNpmCli();
  if (cli) return spawn(process.execPath, [cli, ...args], options);
  if (isWindows) {
    // npm.cmd is a batch file, which Node can only start through a shell. Pass one command string
    // (args are fixed, trusted strings) rather than an args array, which Node 24 deprecates (DEP0190).
    const quoted = args.map((a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a));
    return spawn(['npm', ...quoted].join(' '), { ...options, shell: true });
  }
  return spawn('npm', args, options);
}

/** Run `npm <args>` to completion with inherited output. Resolves with the exit code. */
export function runNpm(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawnNpm(args, { cwd: root, stdio: 'inherit', ...options });
    child.on('error', (err) => {
      console.error(`  Couldn't run npm: ${err.message}`);
      resolve(1);
    });
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

/**
 * Stop a child process and everything it started. On Windows a plain kill() only ends the direct
 * child (npm), leaving `tsx watch` / node / Metro running and holding their ports, so the whole
 * process tree is ended with taskkill instead.
 */
export function killTree(child, signal = 'SIGTERM') {
  if (!child || child.pid === undefined || child.exitCode !== null || child.signalCode !== null) return;
  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }).on(
      'error',
      () => child.kill(),
    );
    return;
  }
  try {
    child.kill(signal);
  } catch {
    // Already gone.
  }
}

// ── Files ────────────────────────────────────────────────────────────────────────────────────────

/** Minimal .env reader (KEY=value lines; quotes stripped). Missing file → {}. */
export function readEnvFile(file) {
  const out = {};
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return out;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

/** The API port the server will use (PORT in the root .env, else 4000). */
export function apiPort() {
  const port = Number(process.env.PORT || readEnvFile(path.join(root, '.env')).PORT);
  return Number.isInteger(port) && port > 0 ? port : API_PORT;
}

// ── Network ──────────────────────────────────────────────────────────────────────────────────────

// Adapters phones can't reach: VPNs, WSL/Hyper-V/Docker/VM bridges, Tailscale/ZeroTier, Apple peer links.
const VIRTUAL_ADAPTER =
  /^(utun|tun|tap|ppp|ipsec|gif|stf|awdl|llw|anpi|bridge|docker|br-|veth|virbr|vmnet|vboxnet|zt|tailscale|wg)|vethernet|wsl|hyper-v|virtualbox|vmware|docker|loopback|tailscale|zerotier|vpn|bluetooth/i;

function isPrivateIPv4(address) {
  const [a, b] = address.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** The local address the OS would use to reach the internet (no packets are sent). */
function defaultRouteAddress() {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    const done = (value) => {
      try {
        socket.close();
      } catch {
        // Already closed.
      }
      resolve(value);
    };
    socket.on('error', () => done(null));
    try {
      socket.connect(53, '1.1.1.1', () => {
        try {
          done(socket.address().address);
        } catch {
          done(null);
        }
      });
    } catch {
      done(null);
    }
  });
}

/**
 * Non-internal IPv4 addresses, best guess for "the Wi-Fi IP phones should use" first:
 * physical adapter with a private address on the default route > other physical private addresses >
 * everything else (VPN, WSL, Docker, …, flagged `virtual`).
 */
export async function lanAddresses() {
  const list = [];
  for (const [iface, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' && entry.family !== 4) continue;
      if (entry.internal || entry.address.startsWith('169.254.')) continue;
      list.push({ address: entry.address, iface, virtual: VIRTUAL_ADAPTER.test(iface) });
    }
  }
  const viaDefault = await defaultRouteAddress();
  const score = (a) =>
    (a.virtual ? 0 : 4) + (isPrivateIPv4(a.address) ? 2 : 0) + (a.address === viaDefault ? 1 : 0);
  return list.sort((x, y) => score(y) - score(x));
}

/** True when something already listens on `port` (checked both by binding and by connecting). */
export async function portInUse(port, host = '0.0.0.0') {
  const bindFails = await new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => resolve(err.code === 'EADDRINUSE' || err.code === 'EACCES'));
    server.once('listening', () => server.close(() => resolve(false)));
    server.listen(port, host);
  });
  if (bindFails) return true;
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(500, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

/** GET /api/health on a BRIAN server; resolves with the JSON body, or null if it isn't one. */
export async function brianHealth(baseUrl, timeoutMs = 1500) {
  try {
    const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const body = await res.json();
    return body && body.name === 'BRIAN' ? body : null;
  } catch {
    return null;
  }
}

/** OS-specific commands to find and stop whatever holds a port. */
export function freePortHelp(port) {
  return isWindows
    ? [`netstat -ano | findstr :${port}`, 'taskkill /PID <the number in the last column> /F']
    : [`lsof -nP -iTCP:${port} -sTCP:LISTEN`, `kill $(lsof -ti tcp:${port})`];
}
