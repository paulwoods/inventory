// ESLint flat config for Next.js 15
import js from '@eslint/js';
import next from 'eslint-config-next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  ...next(),
  {
    rules: {
      // Example overrides
      'no-console': ['warn', {allow: ['warn', 'error']}],
    },
  },
];
