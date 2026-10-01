import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import esbuild from 'esbuild';
import postcss from 'postcss';
import postcssConfig from './postcss.config.cjs';
import { copyPublic, resetDist, writeHtml } from './build-helpers.mjs';
import { transformApplication, withInlineSourceMap } from './transform.mjs';

const queryPlugin = {
  name: 'memos-resource-queries',
  setup(build) {
    build.onResolve({ filter: /\?(?:raw|inline)$/ }, async (args) => {
      const specifier = args.path.replace(/\?(?:raw|inline)$/, '');
      const resolved = await build.resolve(specifier, { resolveDir: args.resolveDir, kind: args.kind });
      if (resolved.errors.length) return { errors: resolved.errors };
      return { path: resolved.path, namespace: 'text-resource' };
    });
    build.onLoad({ filter: /.*/, namespace: 'text-resource' }, async (args) => ({
      contents: `export default ${JSON.stringify(await fsp.readFile(args.path, 'utf8'))};`,
      loader: 'js',
    }));
    build.onResolve({ filter: /maplibre-gl-worker\.mjs\?worker&url$/ }, async (args) => {
      const specifier = args.path.replace(/\?worker&url$/, '');
      const resolved = await build.resolve(specifier, { resolveDir: args.resolveDir, kind: args.kind });
      if (resolved.errors.length) return { errors: resolved.errors };
      return { path: resolved.path, namespace: 'worker-resource' };
    });
    build.onLoad({ filter: /.*/, namespace: 'worker-resource' }, async (args) => ({
      contents: await fsp.readFile(args.path),
      loader: 'file',
    }));
  },
};

const applicationPlugin = {
  name: 'memos-common-application-transform',
  setup(build) {
    build.onLoad({ filter: /[/\\]src[/\\].*\.[cm]?[jt]sx?$/ }, async (args) => {
      const transformed = await transformApplication(await fsp.readFile(args.path, 'utf8'), args.path);
      return { contents: withInlineSourceMap(transformed), loader: 'js', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /[/\\]src[/\\]index\.css$/ }, async (args) => {
      const result = await postcss(postcssConfig.plugins).process(await fsp.readFile(args.path, 'utf8'), {
        from: args.path,
        map: { inline: false, annotation: false },
      });
      return { contents: result.css, loader: 'css', resolveDir: path.dirname(args.path) };
    });
  },
};

const watchMode = process.argv.includes('--watch');
let successfulWatchBuilds = 0;
const finalize = (result) => {
  const entry = Object.entries(result.metafile.outputs).find(([, value]) => value.entryPoint === 'src/main.tsx')?.[0];
  if (!entry) throw new Error('esbuild did not report the Memos entry output');
  copyPublic();
  writeHtml(`/${entry.replace(/^dist\//, '')}`);
  fs.writeFileSync('dist/metafile.json', `${JSON.stringify(result.metafile, null, 2)}\n`);
};
const completionPlugin = {
  name: 'memos-watch-completion',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length) {
        console.error(`esbuild: build finished (${result.errors.length} errors)`);
        return;
      }
      finalize(result);
      successfulWatchBuilds += 1;
      console.log(successfulWatchBuilds === 1
        ? 'esbuild: initial build finished (0 errors)'
        : 'esbuild: build finished (0 errors)');
    });
  },
};

resetDist();
const buildOptions = {
  entryPoints: ['src/main.tsx'],
  outdir: 'dist/assets',
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[name]-[hash]',
  assetNames: '[name]-[hash]',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: 'chrome107',
  minify: true,
  sourcemap: 'linked',
  metafile: true,
  alias: { '@': path.resolve('src') },
  define: {
    'import.meta.env.DEV': 'false',
    'import.meta.env.PROD': 'true',
    'import.meta.env.MODE': JSON.stringify('production'),
  },
  loader: {
    '.png': 'file', '.jpg': 'file', '.jpeg': 'file', '.gif': 'file', '.webp': 'file',
    '.svg': 'file', '.woff': 'file', '.woff2': 'file', '.ttf': 'file', '.eot': 'file',
  },
  plugins: [queryPlugin, applicationPlugin, ...(watchMode ? [completionPlugin] : [])],
};
if (watchMode) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
} else {
  finalize(await esbuild.build(buildOptions));
}
