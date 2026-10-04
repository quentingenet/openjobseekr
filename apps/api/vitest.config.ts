import swc from 'unplugin-swc';
import { defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';

// SWC replaces esbuild so that NestJS decorator metadata (emitDecoratorMetadata) is emitted.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  // Loads @openjobseekr/domain from its TypeScript sources (no build needed).
  ssr: { resolve: { conditions: ['source', ...defaultServerConditions] } },
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    environment: 'node',
  },
});
