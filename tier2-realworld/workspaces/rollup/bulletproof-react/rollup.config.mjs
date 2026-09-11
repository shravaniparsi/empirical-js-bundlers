import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { swc } from 'rollup-plugin-swc3';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import html from '@rollup/plugin-html';
import alias from '@rollup/plugin-alias';
import url from '@rollup/plugin-url';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default {
  input: 'src/main.tsx',
  output: { dir: 'dist', format: 'es', sourcemap: true, entryFileNames: '[name]-[hash].js', chunkFileNames: 'chunk-[hash].js' },
  plugins: [
    alias({ entries: [{ find: '@', replacement: path.resolve(__dirname, 'src') }] }),
    replace({ preventAssignment: true, 'process.env.NODE_ENV': JSON.stringify('production'),
      'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': '"production"' }),
    postcss({ extract: true, minimize: true }),
    url({ include: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif'], limit: 0, destDir: 'dist/assets' }),
    resolve({ extensions: ['.tsx', '.ts', '.jsx', '.js'], browser: true }),
    commonjs(),
    swc({ jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } }, minify: true }),
    html({ template: ({ files }) => {
      const js = (files.js || []).map(f => `<script type="module" src="${f.fileName}"></script>`).join('');
      const css = (files.css || []).map(f => `<link rel="stylesheet" href="${f.fileName}">`).join('');
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>App</title>${css}</head><body><div id="root"></div>${js}</body></html>`;
    }}),
  ],
};
