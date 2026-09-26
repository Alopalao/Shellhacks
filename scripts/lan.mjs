#!/usr/bin/env node
// `npm run lan` — prints this computer's LAN address and the URLs phones / other laptops on the same
// Wi-Fi should use (same on macOS, Linux and Windows).
import { METRO_PORT, apiPort, bold, dim, lanAddresses, yellow } from './lib.mjs';

const port = apiPort();
const addresses = await lanAddresses();
const [best] = addresses;

if (!best) {
  console.log('\nNo network address found. Connect this computer to Wi-Fi (or Ethernet) and try again.\n');
  process.exit(1);
}

console.log(`
${yellow(bold('BRIAN on your network'))} ${dim(`(${best.iface})`)}

  This computer's IP   ${bold(best.address)}
  API server           ${bold(`http://${best.address}:${port}`)}   ${dim('← "Server: … · Change" on the login screen')}
  Web app              ${bold(`http://${best.address}:${METRO_PORT}`)}   ${dim('← open in any browser on the same Wi-Fi (while `npm run dev:web` runs)')}
`);

if (best.virtual) {
  console.log(`  ${yellow('!')} ${best.iface} looks like a VPN/virtual adapter; phones usually can't reach it. Connect to Wi-Fi.\n`);
}
if (addresses.length > 1) {
  console.log(dim('  Other addresses (try these if the one above doesn\'t work):'));
  for (const a of addresses.slice(1)) {
    console.log(dim(`    ${a.address.padEnd(16)} ${a.iface}${a.virtual ? '  (VPN/virtual: phones usually can\'t reach it)' : ''}`));
  }
  console.log('');
}
