#!/usr/bin/env node
// `npm run dev` / `npm run dev:web` — the BRIAN server and the Expo app in one terminal.
//
// Expo gets this terminal directly: its QR code (for Expo Go on phones) and its keyboard shortcuts
// (r = reload, w = web, …) only appear when it owns a TTY, which a log-prefixing runner such as
// `concurrently` doesn't give it. The server runs alongside with its output prefixed "[server]" and
// no stdin, so `tsx watch` (which restarts on any key press) can't swallow Expo's shortcuts.
// Stopping either one (Ctrl+C, or a crash) stops both.
//
//   node scripts/dev.mjs          server + `expo start`        (phones via Expo Go, press w for web)
//   node scripts/dev.mjs --web    server + `expo start --web`  (opens http://localhost:8081)
import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const appScript = process.argv.includes('--web') ? 'web' : 'start';
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const serverTag = useColor ? '\u001b[38;2;255;212;0m[server]\u001b[0m' : '[server]';

/** @type {Map<import('node:child_process').ChildProcess, { name: string, group: boolean }>} */
const running = new Map();
let stopping = false;
let exitCode = 0;

function signalChild(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const { group } = running.get(child) ?? { group: false };
  try {
    // Graceful stop: signal only our direct child (npm), which forwards it down the chain once, so
    // `tsx watch` lets the server finish its graceful shutdown (a second signal makes tsx SIGKILL it).
    // Force stop: a detached child leads its own process group, so kill the whole group.
    if (group && signal === 'SIGKILL') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    // Already gone.
  }
}

function stop(code) {
  if (stopping) return;
  stopping = true;
  exitCode = code;
  for (const child of running.keys()) signalChild(child, 'SIGTERM');
  const force = setTimeout(() => {
    for (const child of running.keys()) signalChild(child, 'SIGKILL');
    process.exit(exitCode);
  }, 8000);
  force.unref();
}

function start(name, args, options, group = false) {
  const child = spawn(npm, args, { cwd: root, shell: isWindows, ...options });
  running.set(child, { name, group });
  child.on('error', (err) => {
    console.error(`[dev] Couldn't start the ${name}: ${err.message}`);
    running.delete(child);
    stop(1);
    if (running.size === 0) process.exit(exitCode);
  });
  child.on('exit', (code, signal) => {
    running.delete(child);
    if (!stopping) {
      console.log(`\n[dev] The ${name} stopped (${signal ?? `exit code ${code}`}), so BRIAN dev is shutting down.`);
      stop(code ?? 0);
    }
    if (running.size === 0) process.exit(exitCode);
  });
  return child;
}

// 1) Server: own process group (POSIX) so it can be stopped as a whole; output prefixed; no stdin.
const serverGroup = !isWindows;
const server = start(
  'server',
  ['--prefix', 'server', 'run', 'dev'],
  {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: serverGroup,
    env: { ...process.env, ...(useColor ? { FORCE_COLOR: '1' } : {}) },
  },
  serverGroup,
);
for (const [stream, out] of [
  [server.stdout, process.stdout],
  [server.stderr, process.stderr],
]) {
  readline.createInterface({ input: stream }).on('line', (line) => out.write(`${serverTag} ${line}\n`));
}

// 2) App: inherits this terminal (stays in the foreground process group so Expo can read keys).
start('app', ['--prefix', 'app', 'run', appScript], { stdio: 'inherit' });

// Ctrl+C before Expo takes over the keyboard (or a SIGTERM from outside) stops both. Once Expo's
// interactive UI is up it handles Ctrl+C itself and exits, which stops the server via 'exit' above.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => stop(0));
}
