#!/usr/bin/env node
// `npm run setup` — one-time setup after cloning, on macOS, Linux or Windows:
//   1. checks the Node.js version (and explains how to install Node 24 LTS if it's too old),
//   2. installs the root, server/ and app/ dependencies,
//   3. creates .env and app/.env from their .example files if they don't exist yet (never overwrites),
//   4. prints how to run the demo.
import fs from 'node:fs';
import path from 'node:path';
import {
  bold,
  dim,
  fail,
  lanAddresses,
  ok,
  requireSupportedNode,
  root,
  runNpm,
  yellow,
} from './lib.mjs';

requireSupportedNode();

console.log(`\n${yellow(bold('BRIAN setup'))} ${dim(`(Node ${process.version}, ${process.platform})`)}\n`);

// 1) Dependencies. `npm install` (not `npm ci`) so re-running setup is quick and keeps node_modules.
const installs = [
  { label: 'root', dir: root },
  { label: 'server/', dir: path.join(root, 'server') },
  { label: 'app/', dir: path.join(root, 'app') },
];
for (const { label, dir } of installs) {
  console.log(`${bold(`→ Installing ${label} dependencies`)} ${dim('(npm install)')}`);
  const code = await runNpm(['install', '--no-audit', '--no-fund'], { cwd: dir });
  if (code !== 0) {
    console.log('');
    fail(`npm install failed in ${label} (exit code ${code}).`);
    console.log(
      [
        '    Check your internet connection, then run `npm run setup` again.',
        '    Still failing? Delete that folder\'s node_modules and retry, or see "Troubleshooting" in README.md.',
        '',
      ].join('\n'),
    );
    process.exit(code || 1);
  }
  ok(`${label} dependencies installed\n`);
}

// 2) Environment files: every key is optional and blank by default (BRIAN runs in demo mode).
console.log(bold('→ Environment files'));
for (const [example, target] of [
  ['.env.example', '.env'],
  [path.join('app', '.env.example'), path.join('app', '.env')],
]) {
  const from = path.join(root, example);
  const to = path.join(root, target);
  if (fs.existsSync(to)) {
    ok(`${target} already exists ${dim('(left unchanged)')}`);
    continue;
  }
  try {
    fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
    ok(`created ${target} from ${example} ${dim('(all keys optional, blank = demo mode)')}`);
  } catch (err) {
    fail(`couldn't create ${target}: ${err.message}`);
  }
}

// 3) Next steps.
const expoVersion = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'app', 'node_modules', 'expo', 'package.json'), 'utf8'))
      .version;
  } catch {
    return null;
  }
})();
const sdk = expoVersion ? expoVersion.split('.')[0] : '57';
const [lan] = await lanAddresses();

console.log(`
${yellow(bold('✓ BRIAN is ready.'))} Pick a way to run the demo:

  ${bold('npm run dev:web')}   one computer: API + web app → open ${bold('http://localhost:8081')} in a normal
                    and a private/incognito window (patient in one, doctor in the other)
  ${bold('npm run dev')}       phones: API + Expo → scan the QR code with Expo Go ${dim(`(must support SDK ${sdk})`)};
                    phones must be on the same Wi-Fi as this computer${lan ? dim(` (this computer: ${lan.address})`) : ''}

  ${bold('Demo accounts')} ${dim('(any password; the server answers "lgtm")')}
    Patient  ${yellow('patient@brian.demo')}
    Doctor   ${yellow('doctor@brian.demo')}

  ${dim('Optional: add API keys to .env (see README → Environment variables). `npm run doctor` checks your setup.')}
`);
