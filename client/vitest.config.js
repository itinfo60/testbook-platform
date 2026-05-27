import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';
import path from 'path';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.js'],
      globals: true,
      css: false,
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e'],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['src/tests/**', 'src/main.jsx', 'e2e/**'],
      },
    },
  })
);
