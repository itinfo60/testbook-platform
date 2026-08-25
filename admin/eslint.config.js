import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  { ignores: ['dist', 'coverage', 'playwright-report'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      // `no-undef` catches missing-import crashes ("useState is not defined")
      // before they reach the browser. Flat config does not enable it by default.
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Marks identifiers referenced from JSX as used, so the unused-import
      // reports are trustworthy instead of drowning real errors in noise.
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
    files: ['e2e/**/*.{js,jsx}', '**/*.{test,spec}.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
