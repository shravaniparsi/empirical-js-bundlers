/**
 * esbuild production build script.
 *
 * esbuild is API-driven (no declarative config file).
 * This follows the official esbuild documentation approach.
 */
import * as esbuild from 'esbuild';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import fs from 'node:fs';
import path from 'node:path';

const outdir = 'dist';

// Clean output
fs.rmSync(outdir, { recursive: true, force: true });

const result = await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir,
  splitting: true,
  format: 'esm',
  minify: true,
  sourcemap: true,
  metafile: true,
  target: ['es2022'],
  jsx: 'automatic',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.js': 'js',
    '.jsx': 'jsx',
    '.png': 'file',
    '.jpg': 'file',
    '.gif': 'file',
    '.svg': 'file',
  },
  plugins: [cssModulesPlugin()],
});

// Use metadata, not output ordering: lazy chunks are not HTML entry scripts.
const html = fs.readFileSync('index.html', 'utf-8');
const entry = Object.entries(result.metafile.outputs).find(([, info]) =>
  info.entryPoint === 'src/main.tsx');
if (!entry) throw new Error('Missing main.tsx entry in esbuild output metadata');
const [entryJs, info] = entry;
const publicUrl = file => '/' + path.relative(outdir, file).split(path.sep).join('/');
const marker = '<script type="module" src="/src/main.tsx"></script>';
if (!html.includes(marker)) throw new Error('Missing source entry in HTML template');
const tags = [
  info.cssBundle ? `<link rel="stylesheet" href="${publicUrl(info.cssBundle)}">` : '',
  `<script type="module" src="${publicUrl(entryJs)}"></script>`,
].filter(Boolean).join('\n');
fs.writeFileSync(path.join(outdir, 'index.html'), html.replace(marker, tags));
