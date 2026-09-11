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

// Copy index.html and inject script
const html = fs.readFileSync('index.html', 'utf-8');
const outputs = Object.keys(result.metafile.outputs);
const entryJs = outputs.find(f => f.endsWith('.js') && !f.includes('chunk'));
const injectedHtml = html.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  `<script type="module" src="/${entryJs}"></script>`
);
fs.writeFileSync(path.join(outdir, 'index.html'), injectedHtml);

// Report
const analyzeText = await esbuild.analyzeMetafile(result.metafile);
console.log(analyzeText);
