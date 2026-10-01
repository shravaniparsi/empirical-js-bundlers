import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import esbuild from 'esbuild';
import * as sass from 'sass';
import { copyStatic, resetDist, writeHtml } from './build-helpers.mjs';
const require = createRequire(import.meta.url);
const { resolveAlias } = require('./aliases.cjs');
const { definitions } = require('./environment.cjs');

const aliasPlugin = {
  name: 'excalidraw-source-aliases',
  setup(build) {
    build.onResolve({ filter: /^@excalidraw\// }, async (args) => {
      const mapped = resolveAlias(args.path);
      if (!mapped) return null;
      return build.resolve(mapped, { kind: args.kind, resolveDir: args.resolveDir });
    });
  },
};
const sassPlugin = {
  name: 'excalidraw-sass',
  setup(build) {
    build.onLoad({ filter: /\.scss$/ }, async (args) => {
      const result = await sass.compileAsync(args.path, { style: 'compressed', loadPaths: [path.resolve('node_modules')], sourceMap: true });
      return { contents: result.css, loader: 'css', resolveDir: path.dirname(args.path) };
    });
  },
};

const watchMode = process.argv.includes('--watch');
let successfulWatchBuilds = 0;
const finalize = async (result) => {
  const entryRecord = Object.entries(result.metafile.outputs).find(([, value]) => value.entryPoint === 'excalidraw-app/index.tsx');
  if (!entryRecord) throw new Error('esbuild did not report the Excalidraw entry output');
  const [entry, entryMetadata] = entryRecord;
  const stylesheet = entryMetadata.cssBundle;
  if (!stylesheet) throw new Error('esbuild did not report the Excalidraw CSS bundle');
  copyStatic();
  writeHtml(`/${entry.replace(/^dist\//, '')}`, `/${stylesheet.replace(/^dist\//, '')}`);
  await fsp.writeFile('dist/metafile.json', `${JSON.stringify(result.metafile, null, 2)}\n`);
};
const completionPlugin = {
  name: 'excalidraw-watch-completion',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length) {
        console.error(`esbuild: build finished (${result.errors.length} errors)`);
        return;
      }
      await finalize(result);
      successfulWatchBuilds += 1;
      console.log(successfulWatchBuilds === 1
        ? 'esbuild: initial build finished (0 errors)'
        : 'esbuild: build finished (0 errors)');
    });
  },
};

resetDist();
const buildOptions = {
  entryPoints: ['excalidraw-app/index.tsx'],
  outdir: 'dist/assets',
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[name]-[hash]',
  assetNames: '[name]-[hash]',
  publicPath: '/assets',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  target: 'chrome107',
  minify: true,
  sourcemap: 'linked',
  sourcesContent: true,
  metafile: true,
  define: { ...definitions(), 'process.env.NODE_ENV': JSON.stringify('production') },
  loader: {
    '.png': 'file', '.jpg': 'file', '.jpeg': 'file', '.gif': 'file', '.webp': 'file',
    '.svg': 'file', '.woff': 'file', '.woff2': 'file', '.ttf': 'file', '.eot': 'file', '.excalidrawlib': 'file',
  },
  plugins: [aliasPlugin, sassPlugin, ...(watchMode ? [completionPlugin] : [])],
};
if (watchMode) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
} else {
  await finalize(await esbuild.build(buildOptions));
}
