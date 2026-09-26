import os from 'node:os';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    testTimeout: 15_000,
    hookTimeout: 20_000,
    // Tests are hermetic: no outbound evidence calls, no real Claude calls, and never the
    // real data file (each test server also gets its own temp store).
    env: {
      BRIAN_EVIDENCE_OFFLINE: '1',
      ANTHROPIC_API_KEY: '',
      BRIAN_DATA_FILE: path.join(os.tmpdir(), `brian-vitest-${process.pid}`, 'db.json'),
    },
  },
});
