// Production profile v1; separate from historical and correctness-pilot configs.
/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  base: '/',
  plugins: [react(), viteTsconfigPaths()],
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/testing/setup-tests.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      include: ['src/**'],
    },
  },
  optimizeDeps: { exclude: ['fsevents'] },
  build: {
    target: "es2022",
    minify: "oxc",
    cssMinify: "lightningcss",
    cssTarget: "chrome107",
    assetsInlineLimit: 0,
    sourcemap: true,
    rollupOptions: {
      external: ['fs/promises', 'msw/browser', 'msw'],
    },
  },
});
