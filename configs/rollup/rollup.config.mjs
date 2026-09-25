import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import swc from '@rollup/plugin-swc';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import html from '@rollup/plugin-html';
import { readFileSync } from 'node:fs';

const isProduction = process.env.NODE_ENV === 'production';
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
  input: 'src/main.tsx',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    entryFileNames: isProduction ? '[name]-[hash].js' : '[name].js',
    chunkFileNames: isProduction ? '[name]-[hash].js' : '[name].js',
    manualChunks(id) {
      if (id.includes('node_modules')) {
        return 'vendor';
      }
    },
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      },
    }),
    resolve({
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      browser: true,
    }),
    commonjs(),
    postcss({
      modules: {
        generateScopedName: isProduction
          ? '[hash:base64:8]'
          : '[name]__[local]--[hash:base64:5]',
      },
      extract: isProduction,
      minimize: isProduction,
      autoModules: true,
    }),
    swc({
      include: /\.[jt]sx?$/,
      swc: {
        minify: isProduction,
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: {
            react: { runtime: 'automatic' },
          },
          target: 'es2022',
          minify: isProduction ? { compress: true, mangle: true } : undefined,
        },
      },
    }),
    html({
      title: `JS Bundler Benchmark — ${pkg.name}`,
      template: ({ files }) => {
        const scripts = (files.js || [])
          .filter(file => file.isEntry)
          .map(({ fileName }) => `<script type="module" src="${fileName}"></script>`)
          .join('\n    ');
        const styles = (files.css || [])
          .map(({ fileName }) => `<link rel="stylesheet" href="${fileName}">`)
          .join('\n    ');
        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pkg.name}</title>
    ${styles}
  </head>
  <body>
    <div id="root"></div>
    ${scripts}
  </body>
</html>`;
      },
    }),
  ],
  onwarn(warning, warn) {
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
    warn(warning);
  },
};
