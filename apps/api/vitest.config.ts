import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC replaces esbuild so that NestJS decorator metadata (emitDecoratorMetadata) is emitted.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    environment: 'node',
  },
});
