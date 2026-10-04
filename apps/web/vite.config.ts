import react from '@vitejs/plugin-react';
import { defaultClientConditions } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Bundles @openjobseekr/domain from its TypeScript sources (no build needed).
  resolve: { conditions: ['source', ...defaultClientConditions] },
  server: {
    // Local-only app, like the API: not reachable from other machines.
    host: '127.0.0.1',
    port: 5173,
    // The API listens on 127.0.0.1 only; the dev server forwards /api/* to it (no CORS needed).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}'],
    css: false,
    // The first full-page render of each file pays the MUI, emotion and i18n cold start in
    // jsdom: up to ~5 s when every file runs in parallel, against 1 s for the next tests.
    testTimeout: 15_000,
  },
});
