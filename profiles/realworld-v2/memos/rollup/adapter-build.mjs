import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import url from '@rollup/plugin-url';
import { rollup } from 'rollup';
import postcss from 'rollup-plugin-postcss';
import postcssProcessor from 'postcss';
import postcssConfig from './postcss.config.cjs';
import { copyPublic, htmlWithEntry, resetDist } from './build-helpers.mjs';
import { transformApplication } from './transform.mjs';

const textPrefix = '\0memos-text:';
const workerPrefix = '\0memos-worker:';
const resourceQueries = {
  name: 'memos-resource-queries',
  async resolveId(source, importer) {
    const text = source.match(/^(.*)\?(?:raw|inline)$/);
    const worker = source.match(/^(.*)\?worker&url$/);
    const match = text ?? worker;
    if (!match) return null;
    const resolved = await this.resolve(match[1], importer, { skipSelf: true });
    if (!resolved) throw new Error(`Unable to resolve resource query ${source}`);
    return `${text ? textPrefix : workerPrefix}${resolved.id}`;
  },
  async load(id) {
    if (id.startsWith(textPrefix)) {
      return `export default ${JSON.stringify(await fsp.readFile(id.slice(textPrefix.length), 'utf8'))};`;
    }
    if (id.startsWith(workerPrefix)) {
      const filename = id.slice(workerPrefix.length);
      const reference = this.emitFile({ type: 'asset', name: path.basename(filename), source: await fsp.readFile(filename) });
      return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
    }
    return null;
  },
};

const applicationTransform = {
  name: 'memos-common-application-transform',
  async transform(code, id) {
    return /[/\\]src[/\\].*\.[cm]?[jt]sx?$/.test(id) ? transformApplication(code, id) : null;
  },
};

const applicationCss = {
  name: 'memos-common-tailwind-transform',
  async load(id) {
    if (id !== path.resolve('src/index.css')) return null;
    const result = await postcssProcessor(postcssConfig.plugins).process(await fsp.readFile(id, 'utf8'), { from: id, map: false });
    return result.css;
  },
};

const htmlPlugin = {
  name: 'memos-html',
  generateBundle(_options, bundle) {
    const entry = Object.values(bundle).find((item) => item.type === 'chunk' && item.isEntry);
    if (!entry) throw new Error('Rollup emitted no entry chunk');
    this.emitFile({ type: 'asset', fileName: 'index.html', source: htmlWithEntry(`/${entry.fileName}`) });
  },
};

resetDist();
const bundle = await rollup({
  input: 'src/main.tsx',
  onwarn(warning, warn) {
    if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning);
  },
  plugins: [
    resourceQueries,
    alias({ entries: [{ find: '@', replacement: path.resolve('src') }] }),
    replace({
      preventAssignment: true,
      values: {
        'import.meta.env.DEV': 'false',
        'import.meta.env.PROD': 'true',
        'import.meta.env.MODE': JSON.stringify('production'),
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    }),
    applicationTransform,
    applicationCss,
    dynamicImportVars({ include: ['src/**/*.{js,jsx,ts,tsx}'] }),
    nodeResolve({ browser: true, extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx', '.jsx'] }),
    commonjs(),
    json(),
    url({ limit: 0, emitFiles: true, fileName: 'assets/[name]-[hash][extname]' }),
    postcss({
      extract: true,
      minimize: true,
      sourceMap: true,
      plugins: postcssConfig.plugins,
    }),
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
copyPublic();
fs.writeFileSync('dist/rollup-build.json', `${JSON.stringify({ publicationEligible: false, tool: 'rollup' }, null, 2)}\n`);
