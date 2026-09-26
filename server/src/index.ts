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

interface LanAddress {
  address: string;
  /** OS interface name, e.g. "en0", "Wi-Fi", "vEthernet (WSL)". */
  iface: string;
  /** VPN / VM / container adapter: other devices on the Wi-Fi usually can't reach it. */
  virtual: boolean;
}

/** Adapter names of VPNs, VMs, WSL/Hyper-V and containers (macOS, Windows, Linux). */
const VIRTUAL_IFACE =
  /vEthernet|WSL|Hyper-V|Default Switch|VirtualBox|VMware|docker|podman|^br-|^veth|virbr|vbox|vmnet|^bridge|^utun|^tun|^tap|^ppp|^ipsec|^wg|wireguard|tailscale|zerotier|^zt|VPN/i;

/** RFC 1918 ranges that home and office Wi-Fi hand out. */
function isPrivateIPv4(address: string): boolean {
  const [a = 0, b = 0] = address.split('.').map(Number);
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

/**
 * Non-internal IPv4 addresses, most likely reachable first: physical adapters on private
 * ranges, then other physical ones, then virtual/VPN adapters (a /32 netmask is a VPN tell).
 */
function lanAddresses(): LanAddress[] {
  const out: LanAddress[] = [];
  for (const [iface, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal || entry.address.startsWith('169.254.')) continue;
      if (out.some((a) => a.address === entry.address)) continue;
      const virtual = VIRTUAL_IFACE.test(iface) || entry.netmask === '255.255.255.255';
      out.push({ address: entry.address, iface, virtual });
    }
  }
  const rank = (a: LanAddress): number => (a.virtual ? 2 : 0) + (isPrivateIPv4(a.address) ? 0 : 1);
  return out.sort((a, b) => rank(a) - rank(b));
}

function printBanner(server: BrianServer): void {
  const { config } = server.ctx;
  const listensOnAll = config.host === '0.0.0.0' || config.host === '::';
  const lan = listensOnAll ? lanAddresses() : [];
  // Lead with the adapters phones can reach; list VPN/virtual ones separately (or alone if that's all there is).
  const physical = lan.filter((a) => !a.virtual);
  const network = physical.length > 0 ? physical : lan;
  const other = physical.length > 0 ? lan.filter((a) => a.virtual) : [];
  const urlFor = (a: LanAddress): string => `http://${a.address}:${server.port}`;
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
    ...(network.length > 0
      ? network.map((a, i) => `  ${label(i === 0 ? 'Network' : '')}${bold(urlFor(a))}  ${dim(a.iface)}`)
      : [`  ${label('Network')}${dim(listensOnAll ? 'no LAN address found' : `bound to ${config.host} only`)}`]),
    network.length > 0
      ? `  ${label('')}${dim(`↑ phones & other computers on the same Wi-Fi use ${network.length > 1 ? 'one of these URLs' : 'this URL'}`)}`
      : '',
    ...other.map((a, i) => `  ${label(i === 0 ? 'Other' : '')}${dim(`${urlFor(a)}  ${a.iface} (VPN/virtual — usually not reachable)`)}`),
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
          '  Stop the other process, or set PORT in .env to use a different port (npm run dev passes\n' +
          '  it to the app; if you start Expo separately, also set EXPO_PUBLIC_API_PORT to the same value\n' +
          '  in app/.env, or change Server on the app\'s login screen).\n',
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
