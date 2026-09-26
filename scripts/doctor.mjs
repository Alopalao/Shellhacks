#!/usr/bin/env node
// `npm run doctor` — checks this computer is ready to run BRIAN and says how to fix what isn't:
// Node version, npm, installed dependencies, .env files, free ports, and the LAN address phones use.
// Exits 1 only for problems that stop BRIAN from running (old Node, missing dependencies).
import fs from 'node:fs';
import path from 'node:path';
import {
  API_PORT,
  METRO_PORT,
  NODE_RANGE,
  apiPort,
  bold,
  brianHealth,
  dim,
  fail,
  freePortHelp,
  lanAddresses,
  nodeInstallHelp,
  nodeVersionSupported,
  ok,
  portInUse,
  readEnvFile,
  root,
  spawnNpm,
  warn,
  yellow,
} from './lib.mjs';

let problems = 0;
const indent = (text) => text.split('\n').map((line) => `      ${line}`).join('\n');

console.log(`\n${yellow(bold('BRIAN doctor'))} ${dim(`(${process.platform} ${process.arch})`)}\n`);

// Node.js
if (nodeVersionSupported()) ok(`Node.js ${process.version} ${dim(`(supported: ${NODE_RANGE})`)}`);
else {
  problems++;
  fail(`Node.js ${process.version} is not supported`);
  console.log(indent(nodeInstallHelp()));
}

// npm
const npmVersion = await new Promise((resolve) => {
  let out = '';
  const child = spawnNpm(['--version'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
  child.stdout.on('data', (chunk) => (out += chunk));
  child.on('error', () => resolve(null));
  child.on('exit', (code) => resolve(code === 0 ? out.trim() : null));
});
if (npmVersion) ok(`npm ${npmVersion}`);
else {
  problems++;
  fail('npm could not be run. Reinstall Node.js (npm ships with it).');
}

// Dependencies
const readVersion = (...parts) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, ...parts, 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
};
const serverDeps = readVersion('server', 'node_modules', 'tsx') && readVersion('server', 'node_modules', 'express');
const expoVersion = readVersion('app', 'node_modules', 'expo');
if (serverDeps) ok('server/ dependencies installed');
if (expoVersion) {
  ok(`app/ dependencies installed ${dim(`(Expo SDK ${expoVersion.split('.')[0]}: Expo Go on phones must support SDK ${expoVersion.split('.')[0]})`)}`);
}
if (!serverDeps || !expoVersion) {
  problems++;
  fail(`${[!serverDeps && 'server/', !expoVersion && 'app/'].filter(Boolean).join(' and ')} dependencies missing. Run ${bold('npm run setup')}.`);
}

// Environment files (all optional)
const env = readEnvFile(path.join(root, '.env'));
if (fs.existsSync(path.join(root, '.env'))) {
  const set = ['ANTHROPIC_API_KEY', 'NCBI_API_KEY', 'OPENFDA_API_KEY'].filter((key) => env[key]);
  ok(`.env found ${dim(set.length > 0 ? `(set: ${set.join(', ')})` : '(no API keys set: AI runs in demo mode, which is fine)')}`);
} else {
  warn(`no .env ${dim('(optional; `npm run setup` creates one from .env.example)')}`);
}
const appEnv = readEnvFile(path.join(root, 'app', '.env'));
if (appEnv.EXPO_PUBLIC_API_URL) {
  warn(`app/.env pins the server to ${bold(appEnv.EXPO_PUBLIC_API_URL)} ${dim('(auto-detection is off; clear it to auto-detect)')}`);
}

// Ports
const port = apiPort();
const appPort = Number(process.env.EXPO_PUBLIC_API_PORT || appEnv.EXPO_PUBLIC_API_PORT) || null;
if (appPort && appPort !== port) {
  warn(`EXPO_PUBLIC_API_PORT=${appPort} but the server uses port ${port} ${dim('(make them match, or clear EXPO_PUBLIC_API_PORT in app/.env)')}`);
} else if (port !== API_PORT && !appPort) {
  warn(
    `PORT=${port} in .env: ${bold('npm run dev')} passes it to the app; if you start Expo separately, set EXPO_PUBLIC_API_PORT=${port} in app/.env`,
  );
}
if (await portInUse(port)) {
  if (await brianHealth(`http://localhost:${port}`)) ok(`a BRIAN server is already running on port ${port}`);
  else {
    const [find, kill] = freePortHelp(port);
    warn(`port ${port} is used by another program; the BRIAN server can't start until it's free:`);
    console.log(indent(`${find}\n${kill}`));
  }
} else ok(`port ${port} (API) is free`);
if (await portInUse(METRO_PORT)) {
  warn(`port ${METRO_PORT} (Expo) is in use ${dim('(already running? Otherwise Expo offers another port, e.g. 8082)')}`);
} else ok(`port ${METRO_PORT} (Expo / web app) is free`);

// Network
const addresses = await lanAddresses();
const [best] = addresses;
if (best && !best.virtual) {
  ok(`LAN address ${bold(best.address)} ${dim(`(${best.iface})`)}`);
  console.log(
    indent(
      [
        `Phones / other computers on the same Wi-Fi: API ${bold(`http://${best.address}:${port}`)} · web app ${bold(`http://${best.address}:${METRO_PORT}`)}`,
        ...addresses
          .slice(1)
          .map((a) => dim(`also ${a.address} (${a.iface}${a.virtual ? ', VPN/virtual: phones usually can\'t reach it' : ''})`)),
      ].join('\n'),
    ),
  );
} else {
  warn('no Wi-Fi/Ethernet address found: phones and other computers can\'t reach this one (connect to Wi-Fi)');
}

console.log('');
if (problems > 0) {
  console.log(`${bold(`${problems} problem${problems === 1 ? '' : 's'} to fix`)} before running BRIAN (see above).\n`);
  process.exit(1);
}
console.log(`${bold('Ready.')} Run ${bold('npm run dev:web')} (browser) or ${bold('npm run dev')} (phones with Expo Go).\n`);
