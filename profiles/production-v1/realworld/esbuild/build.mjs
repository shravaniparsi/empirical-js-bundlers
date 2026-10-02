// Production profile v1; separate from historical and correctness-pilot configs.
import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

fs.rmSync('dist', { recursive: true, force: true });
const result = await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  target: ['es2022'],
  outdir: 'dist',
  publicPath: '/',
  splitting: true,
  format: 'esm',
  sourcemap: true,
  metafile: true,
  minify: true,
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css', '.svg': 'file', '.png': 'file', '.jpg': 'file', '.gif': 'file' },
  jsx: 'automatic',
  alias: { '@': './src' },
  define: { 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production', VITE_APP_API_URL: '/api', VITE_APP_ENABLE_API_MOCKING: 'false' }) },
  plugins: [{ name: 'benchmark-postcss', setup(build) {
    build.onLoad({ filter: /\.css$/ }, async args => {
      const processed = await postcss([tailwindcss, autoprefixer]).process(fs.readFileSync(args.path, 'utf8'), { from: args.path });
      return { contents: processed.css, loader: 'css', resolveDir: path.dirname(args.path) };
    });
  } }],
});

const html = fs.readFileSync('index.html', 'utf-8');
const entry = Object.entries(result.metafile.outputs).find(([, info]) => info.entryPoint === 'src/main.tsx');
if (!entry) throw new Error('Missing main entry');
const [entryJs, info] = entry;
const url = file => '/' + path.relative('dist', file).split(path.sep).join('/');
const injected = html.replace('<script type="module" src="/src/main.tsx"></script>',
  `${info.cssBundle ? `<link rel="stylesheet" href="${url(info.cssBundle)}">` : ''}<script type="module" src="${url(entryJs)}"></script>`);
fs.writeFileSync('dist/index.html', injected);
