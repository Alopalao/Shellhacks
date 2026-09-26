// BRIAN server entry point: boot, print a friendly banner, shut down gracefully.
import os from 'node:os';
import { config } from './config';
import { DEMO_ACCOUNTS } from './db/seed';
import { createServer, type BrianServer } from './server';

// FORCE_COLOR keeps the banner colored when a runner pipes our output (e.g. `npm run dev` at the repo root).
const useColor = (process.stdout.isTTY || !!process.env.FORCE_COLOR) && !process.env.NO_COLOR;
const paint = (code: string) => (text: string): string => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);
const yellow = paint('38;2;255;212;0');
const bold = paint('1');
const dim = paint('2');

const WORDMARK = [
  '██████╗ ██████╗ ██╗ █████╗ ███╗   ██╗',
  '██╔══██╗██╔══██╗██║██╔══██╗████╗  ██║',
  '██████╔╝██████╔╝██║███████║██╔██╗ ██║',
  '██╔══██╗██╔══██╗██║██╔══██║██║╚██╗██║',
  '██████╔╝██║  ██║██║██║  ██║██║ ╚████║',
  '╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝',
];

/** Non-internal IPv4 addresses other devices on the network can reach. */
function lanAddresses(): string[] {
  const out: string[] = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.')) {
        out.push(entry.address);
      }
    }
  }
  return [...new Set(out)];
}

function printBanner(server: BrianServer): void {
  const { config } = server.ctx;
  const listensOnAll = config.host === '0.0.0.0' || config.host === '::';
  const lan = listensOnAll ? lanAddresses() : [];
  const ai = config.anthropicApiKey
    ? `Claude (${config.claudeModel})`
    : 'Demo mode (no ANTHROPIC_API_KEY)';
  const evidence = config.evidenceOffline
    ? 'Offline (BRIAN_EVIDENCE_OFFLINE=1)'
    : 'PubMed · MedlinePlus · openFDA · RxNorm';
  const label = (text: string): string => dim(text.padEnd(10));

  const lines = [
    '',
    ...WORDMARK.map((line) => `  ${yellow(line)}`),
    `  ${dim('Built for patients · Reliable prescriptions · Integrated AI doctor')}`,
    `  ${dim('Always connected to your physician · Next-generation healthcare')}`,
    '',
    `  ${label('Local')}${bold(server.url)}`,
    ...(lan.length > 0
      ? lan.map((ip, i) => `  ${label(i === 0 ? 'Network' : '')}${bold(`http://${ip}:${server.port}`)}`)
      : [`  ${label('Network')}${dim(listensOnAll ? 'no LAN address found' : `bound to ${config.host} only`)}`]),
    lan.length > 0 ? `  ${label('')}${dim('↑ phones & other computers on the same Wi-Fi use this URL')}` : '',
    `  ${label('AI')}${ai}`,
    `  ${label('Evidence')}${evidence}`,
    `  ${label('Data')}${dim(server.db.file)}`,
    '',
    `  ${bold('Demo accounts')} ${dim('(any password works — the server answers "lgtm")')}`,
    `    Patient  ${yellow(DEMO_ACCOUNTS.patient)}`,
    `    Doctor   ${yellow(DEMO_ACCOUNTS.doctor)}`,
    '',
    `  ${dim('Press Ctrl+C to stop.')}`,
    '',
  ];
  console.log(lines.filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n'));
}

async function main(): Promise<void> {
  let server: BrianServer;
  try {
    server = await createServer();
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EADDRINUSE') {
      console.error(
        `\n  Port ${config.port} is already in use — is BRIAN already running?\n` +
          '  Stop the other process or set PORT in .env to use a different port.\n',
      );
    } else {
      console.error('\n  BRIAN failed to start:', err);
    }
    process.exit(1);
  }

  printBanner(server);

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) {
      process.exit(1); // second Ctrl+C: stop immediately
    }
    shuttingDown = true;
    console.log(`\n  ${signal} received — shutting down BRIAN…`);
    const force = setTimeout(() => {
      console.error('  Shutdown timed out; exiting.');
      process.exit(1);
    }, 5000);
    force.unref();
    server.close().then(
      () => process.exit(0),
      (err: unknown) => {
        console.error('  Error during shutdown:', err);
        process.exit(1);
      },
    );
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled promise rejection:', reason);
  });
}

void main();
