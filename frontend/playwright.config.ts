import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      command: 'cd ../backend && npx tsx src/server.ts',
      port: 3000,
      timeout: 15_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx vite',
      port: 5173,
      timeout: 15_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
