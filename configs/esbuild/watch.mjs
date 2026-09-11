/**
 * esbuild watch mode script (for M3: incremental rebuild measurement).
 *
 * esbuild does NOT have native HMR or a dev server comparable to Vite/Webpack.
 * This script uses --watch for incremental rebuild timing only.
 */
import * as esbuild from 'esbuild';
import cssModulesPlugin from 'esbuild-css-modules-plugin';

const ctx = await esbuild.context({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'dist',
  splitting: true,
  format: 'esm',
  sourcemap: true,
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

await ctx.watch();
console.log('esbuild: watching for changes...');
