// `npm run reset-data` — re-seed the demo data.
//
// If a BRIAN server is running locally it holds the data in memory (and would overwrite the
// file on its next save), so we first ask it to reset itself via the API. Otherwise the data
// file is re-seeded directly.
import { config } from '../config';
import type { LoginResponse } from '../shared/contracts';
import { DEMO_ACCOUNTS } from './seed';
import { openJsonDb } from './store';

async function resetRunningServer(baseUrl: string): Promise<boolean> {
  const timeout = (): AbortSignal => AbortSignal.timeout(2000);
  try {
    const health = await fetch(`${baseUrl}/api/health`, { signal: timeout() });
    if (!health.ok) return false;
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: DEMO_ACCOUNTS.doctor, password: 'reset-data' }),
      signal: timeout(),
    });
    if (!login.ok) return false;
    const { token } = (await login.json()) as LoginResponse;
    const reset = await fetch(`${baseUrl}/api/admin/reset`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      signal: timeout(),
    });
    // Tidy up the session we just created.
    await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      signal: timeout(),
    }).catch(() => undefined);
    return reset.ok;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const baseUrl = `http://localhost:${config.port}`;
  if (await resetRunningServer(baseUrl)) {
    console.log(`✓ Demo data re-seeded by the running BRIAN server at ${baseUrl}.`);
    return;
  }
  const db = openJsonDb(config.dataFile);
  if (!db.seeded) db.reset();
  await db.close();
  console.log(`✓ Demo data re-seeded at ${db.file}`);
}

main().catch((err: unknown) => {
  console.error('Could not reset demo data:', err);
  process.exitCode = 1;
});
