import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import url from '@rollup/plugin-url';
import { rollup } from 'rollup';
import postcss from 'rollup-plugin-postcss';
import { copyStatic, htmlWithEntry, resetDist } from './build-helpers.mjs';
import { transformApplication } from './transform.mjs';
const require = createRequire(import.meta.url);
const { orderedAliases } = require('./aliases.cjs');
const { definitions } = require('./environment.cjs');

const applicationTransform = {
  name: 'excalidraw-typescript-react-transform',
  async transform(code, id) {
    if (!/[/\\](?:excalidraw-app|packages)[/\\].*\.[cm]?[jt]sx?$/.test(id)) return null;
    return transformApplication(code, id);
  },
};
const htmlPlugin = {
  name: 'excalidraw-html',
  generateBundle(_options, bundle) {
    const entry = Object.values(bundle).find((item) => item.type === 'chunk' && item.isEntry);
    if (!entry) throw new Error('Rollup emitted no entry chunk');
    const stylesheet = Object.values(bundle).find((item) => item.type === 'asset' && item.fileName.endsWith('.css'));
    if (!stylesheet) throw new Error('Rollup emitted no stylesheet');
    this.emitFile({ type: 'asset', fileName: 'index.html', source: htmlWithEntry(`/${entry.fileName}`, `/${stylesheet.fileName}`) });
  },
};

resetDist();
const bundle = await rollup({
  input: 'excalidraw-app/index.tsx',
  onwarn(warning, warn) {
    if (!['MODULE_LEVEL_DIRECTIVE', 'CIRCULAR_DEPENDENCY'].includes(warning.code)) warn(warning);
  },
  plugins: [
    alias({ entries: orderedAliases() }),
    replace({ preventAssignment: true, values: { ...definitions(), 'process.env.NODE_ENV': JSON.stringify('production') } }),
    applicationTransform,
    nodeResolve({ browser: true, extensions: ['.mjs', '.js', '.json', '.node', '.mts', '.ts', '.tsx', '.jsx'] }),
    commonjs(),
    json(),
    url({
      include: ['**/*.{svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,excalidrawlib}'],
      limit: 0,
      emitFiles: true,
      fileName: 'assets/[name]-[hash][extname]',
    }),
    postcss({ extract: true, minimize: true, sourceMap: true, use: ['sass'] }),
    terser({ format: { comments: false } }),
    htmlPlugin,
  ],
});
await bundle.write({
  dir: 'dist',
  format: 'es',
  sourcemap: true,
  entryFileNames: 'assets/[name]-[hash].js',
  chunkFileNames: 'assets/[name]-[hash].js',
  assetFileNames: 'assets/[name]-[hash][extname]',
});
await bundle.close();
copyStatic();
fs.writeFileSync('dist/rollup-build.json', `${JSON.stringify({ publicationEligible: false, tool: 'rollup' }, null, 2)}\n`);
