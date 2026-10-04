// @ts-check
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/build/',
    '**/coverage/',
    'apps/api/src/generated/',
  ]),
  eslint.configs.recommended,
  tseslint.configs.strict,
  {
    rules: {
      // NestJS modules are empty classes carrying a @Module() decorator.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      // Allows `const { omitted, ...rest } = obj` to drop keys, and `_`-prefixed parameters
      // required by a signature (e.g. decorated parameters in tests).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
    },
  },
);
