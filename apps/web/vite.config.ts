import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
  },
});
