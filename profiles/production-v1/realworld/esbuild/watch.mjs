// Correctness-validated M3 watch adapter for the frozen Bulletproof React profile.
import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

let initial = true;
const reporter = {
  name: 'confirmatory-m3-reporter',
  setup(build) {
    build.onEnd(result => {
      const label = initial ? 'initial build' : 'build';
      initial = false;
      console.log(`esbuild: ${label} finished (${result.errors.length} errors)`);
    });
  },
};
const postcssPlugin = {
  name: 'benchmark-postcss',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async args => {
      const processed = await postcss([tailwindcss, autoprefixer]).process(fs.readFileSync(args.path, 'utf8'), { from: args.path });
      return { contents: processed.css, loader: 'css', resolveDir: path.dirname(args.path) };
    });
  },
};

fs.rmSync('dist', { recursive: true, force: true });
const context = await esbuild.context({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  target: ['es2022'],
  outdir: 'dist',
  publicPath: '/',
  splitting: true,
  format: 'esm',
  sourcemap: true,
  minify: false,
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css', '.svg': 'file', '.png': 'file', '.jpg': 'file', '.gif': 'file' },
  jsx: 'automatic',
  alias: { '@': './src' },
  define: { 'import.meta.env': JSON.stringify({ DEV: true, PROD: false, MODE: 'development', VITE_APP_API_URL: '/api', VITE_APP_ENABLE_API_MOCKING: 'false' }) },
  plugins: [postcssPlugin, reporter],
});
await context.rebuild();
await context.watch();
console.log('esbuild: watching for changes...');
