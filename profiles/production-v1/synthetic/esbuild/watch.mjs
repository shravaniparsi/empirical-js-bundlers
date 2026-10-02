// Production profile v1; separate from historical and correctness-pilot configs.
/**
 * esbuild watch mode script (for M3: incremental rebuild measurement).
 *
 * Uses an onEnd plugin to emit "build finished" after every rebuild,
 * which the measurement harness (measure-incremental.ts) detects as
 * the rebuild-completion signal.
 */
import * as esbuild from 'esbuild';
import cssModulesPlugin from 'esbuild-css-modules-plugin';

const rebuildReporter = {
  name: 'rebuild-reporter',
  setup(build) {
    let isFirstBuild = true;
    build.onEnd((result) => {
      const errors = result.errors.length;
      if (isFirstBuild) {
        isFirstBuild = false;
        console.log(`esbuild: initial build finished (${errors} errors)`);
      } else {
        console.log(`esbuild: build finished (${errors} errors)`);
      }
    });
  },
};

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
  plugins: [cssModulesPlugin(), rebuildReporter],
});

await ctx.rebuild();
await ctx.watch();
console.log('esbuild: watching for changes...');
