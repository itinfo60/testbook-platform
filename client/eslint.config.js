import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  { ignores: ['dist', 'dev-dist', 'coverage', 'playwright-report'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaVersion: 'latest', ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      // `no-undef` is the rule that catches the missing-import crashes
      // ("useState is not defined"). Flat config does not enable it by
      // default, so these only ever surfaced in the browser at runtime.
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Marks identifiers referenced from JSX as used. Without this every
      // component and icon used only in markup is reported unused, and the
      // resulting noise hides real errors.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Test files run under Vitest globals
    files: ['**/*.{test,spec}.{js,jsx}', 'src/tests/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.vitest } },
  },
];
