import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const result = await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'dist',
  splitting: true,
  format: 'esm',
  sourcemap: true,
  metafile: true,
  minify: true,
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css', '.svg': 'file', '.png': 'file', '.jpg': 'file', '.gif': 'file' },
  jsx: 'automatic',
  alias: { '@': './src' },
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': '"production"' },
});

const html = fs.readFileSync('index.html', 'utf-8');
const outputs = Object.keys(result.metafile.outputs);
const jsEntry = outputs.find(o => o.endsWith('.js') && !o.includes('chunk'));
const cssEntry = outputs.find(o => o.endsWith('.css') && !o.includes('chunk'));
let injected = html.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  `${cssEntry ? `<link rel="stylesheet" href="/${cssEntry}">` : ''}
   <script type="module" src="/${jsEntry}"></script>`
);
fs.writeFileSync('dist/index.html', injected);

const analysis = await esbuild.analyzeMetafile(result.metafile, { verbose: false });
console.log(analysis);
