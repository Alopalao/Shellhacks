#!/usr/bin/env node
// `npm run dev` / `npm run dev:web` — the BRIAN server and the Expo app in one terminal
// (macOS, Linux and Windows).
//
// Expo gets this terminal directly: its QR code (for Expo Go on phones) and its keyboard shortcuts
// (r = reload, w = web, …) only appear when it owns a TTY, which a log-prefixing runner such as
// `concurrently` doesn't give it. The server runs alongside with its output prefixed "[server]" and
// no stdin, so `tsx watch` (which restarts on any key press) can't swallow Expo's shortcuts.
// Stopping either one (Ctrl+C, or a crash) stops both.
//
//   node scripts/dev.mjs          server + `expo start`        (phones via Expo Go, press w for web)
//   node scripts/dev.mjs --web    server + `expo start --web`  (opens http://localhost:8081)
//
// Any other arguments go to Expo, e.g. `npm run dev -- --clear` (clear the Metro cache) or
// `npm run dev -- --tunnel`. If a BRIAN server is already running on the API port, it is reused.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {
  apiPort,
  bold,
  brianHealth,
  dim,
  freePortHelp,
  isWindows,
  killTree,
  portInUse,
  readEnvFile,
  red,
  requireSupportedNode,
  root,
  spawnNpm,
} from './lib.mjs';

requireSupportedNode();

const args = process.argv.slice(2);
const appScript = args.includes('--web') ? 'web' : 'start';
const expoArgs = args.filter((arg) => arg !== '--web');
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const serverTag = useColor ? '\u001b[38;2;255;212;0m[server]\u001b[0m' : '[server]';

// ── Pre-flight ───────────────────────────────────────────────────────────────────────────────────

for (const [dir, pkg] of [
  ['server', 'tsx'],
  ['app', 'expo'],
]) {
  if (!fs.existsSync(path.join(root, dir, 'node_modules', pkg, 'package.json'))) {
    console.error(`\n  ${red('✗')} ${dir}/ dependencies are missing. Run ${bold('npm run setup')} first.\n`);
    process.exit(1);
  }
}

const port = apiPort();
let reuseServer = false;
if (await portInUse(port)) {
  if (await brianHealth(`http://localhost:${port}`)) {
    reuseServer = true;
    console.log(
      `\n  ${bold(`A BRIAN server is already running on port ${port}`)} — using it and starting only Expo.\n` +
        `  ${dim('(Stop it with Ctrl+C in its own terminal if you wanted a fresh one.)')}\n`,
    );
  } else {
    const [find, kill] = freePortHelp(port);
    console.error(
      [
        '',
        `  ${red('✗')} Port ${port} is already in use by another program, so the BRIAN server can't start.`,
        '    Find and stop it:',
        `      ${find}`,
        `      ${kill}`,
        `    …or set PORT in .env to a free port (${bold('npm run dev')} passes it to the app as EXPO_PUBLIC_API_PORT;`,
        '    restart with `npm run dev -- --clear` after changing it).',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }
}

// ── Process management ───────────────────────────────────────────────────────────────────────────

/** @type {Map<import('node:child_process').ChildProcess, { name: string, group: boolean }>} */
const running = new Map();
let stopping = false;
let exitCode = 0;

/** POSIX: graceful stop signals only our direct child (npm), which forwards it down the chain. */
function signalChild(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const { group } = running.get(child) ?? { group: false };
  try {
    // Graceful stop: signal only npm, which forwards it once, so `tsx watch` lets the server finish
    // its graceful shutdown (a second signal makes tsx SIGKILL it).
    // Force stop: a detached child leads its own process group, so kill the whole group.
    if (group && signal === 'SIGKILL') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    // Already gone.
  }
}

/**
 * Stop everything. `fromConsole`: the stop was triggered by Ctrl+C / Ctrl+Break, which on Windows
 * the console already delivered to every child, so they get a moment to shut down on their own.
 */
function stop(code, fromConsole = false) {
  if (stopping) return;
  stopping = true;
  exitCode = code;
  if (isWindows) {
    // No signals on Windows: child.kill() would only end npm and orphan the server (still holding
    // its port). End each child's whole process tree instead.
    setTimeout(
      () => {
        for (const child of running.keys()) killTree(child);
      },
      fromConsole ? 3000 : 0,
    );
  } else {
    for (const child of running.keys()) signalChild(child, 'SIGTERM');
  }
  const force = setTimeout(() => {
    for (const child of running.keys()) {
      if (isWindows) killTree(child);
      else signalChild(child, 'SIGKILL');
    }
    process.exit(exitCode);
  }, 8000);
  force.unref();
}

function start(name, npmArgs, options, group = false) {
  const child = spawnNpm(npmArgs, { cwd: root, ...options });
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

// 1) Server: own process group on macOS/Linux (so it can be stopped as a whole, and a terminal
//    Ctrl+C doesn't hit `tsx watch` twice); output prefixed; no stdin. On Windows it stays attached
//    to this console (no `detached` / `windowsHide`, which would give it a separate console or none),
//    so Ctrl+C reaches it directly.
if (!reuseServer) {
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
}

// 2) App: inherits this terminal (stays in the foreground process group so Expo can read keys and
//    print its QR code).
//    The app auto-detects the server on EXPO_PUBLIC_API_PORT (default 4000), so hand it the server's
//    PORT unless it is already set (in this shell or in app/.env, which Expo reads itself).
const appEnvPort = process.env.EXPO_PUBLIC_API_PORT || readEnvFile(path.join(root, 'app', '.env')).EXPO_PUBLIC_API_PORT;
start('app', ['--prefix', 'app', 'run', appScript, ...(expoArgs.length > 0 ? ['--', ...expoArgs] : [])], {
  stdio: 'inherit',
  env: appEnvPort ? process.env : { ...process.env, EXPO_PUBLIC_API_PORT: String(port) },
});

// Ctrl+C before Expo takes over the keyboard (or a SIGTERM from outside) stops both. Once Expo's
// interactive UI is up it handles Ctrl+C itself and exits, which stops the server via 'exit' above.
// A second Ctrl+C stops everything immediately.
const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', ...(isWindows ? ['SIGBREAK'] : [])];
for (const signal of signals) {
  process.on(signal, () => {
    if (stopping) {
      for (const child of running.keys()) {
        if (isWindows) killTree(child);
        else signalChild(child, 'SIGKILL');
      }
      process.exit(exitCode || 1);
    }
    stop(0, signal === 'SIGINT' || signal === 'SIGBREAK');
  });
}
