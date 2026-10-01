import { createRequire } from 'node:module';
import fs from 'node:fs';
import { build } from 'vite';
const require = createRequire(import.meta.url);
const { orderedAliases } = require('./aliases.cjs');
const { definitions } = require('./environment.cjs');
const watchMode = process.argv.includes('--watch');
const indexPlugin = {
  name: 'benchmark-index-name',
  writeBundle() {
    if (!fs.existsSync('dist/benchmark-index.html')) throw new Error('Vite emitted no benchmark HTML');
    fs.rmSync('dist/index.html', { force: true });
    fs.renameSync('dist/benchmark-index.html', 'dist/index.html');
  },
};

await build({
  configFile: false,
  root: process.cwd(),
  publicDir: 'public',
  define: definitions(),
  resolve: { alias: orderedAliases() },
  plugins: [indexPlugin],
  build: {
    target: 'chrome107',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'oxc',
    cssMinify: 'lightningcss',
    assetsInlineLimit: 0,
    rollupOptions: { input: 'benchmark-index.html' },
    ...(watchMode ? { watch: {} } : {}),
  },
});
