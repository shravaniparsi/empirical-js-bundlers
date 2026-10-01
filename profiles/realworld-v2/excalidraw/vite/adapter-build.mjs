import { createRequire } from 'node:module';
import fs from 'node:fs';
import { build } from 'vite';
const require = createRequire(import.meta.url);
const { orderedAliases } = require('./aliases.cjs');
const { definitions } = require('./environment.cjs');

await build({
  configFile: false,
  root: process.cwd(),
  publicDir: 'public',
  define: definitions(),
  resolve: { alias: orderedAliases() },
  build: {
    target: 'chrome107',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'oxc',
    cssMinify: 'lightningcss',
    assetsInlineLimit: 0,
    rollupOptions: { input: 'benchmark-index.html' },
  },
});
fs.renameSync('dist/benchmark-index.html', 'dist/index.html');
