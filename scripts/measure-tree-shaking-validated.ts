/**
 * M7: controlled lodash-es elimination using empty, used-export and full-library
 * fixture builds. Values report the percentage of full-library bytes eliminated.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Args {
  tool: string;
  project: string;
  resultsDir: string;
  timestamp: string;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const values: Record<string, string> = {};
  for (let i = 0; i < raw.length; i += 2) values[raw[i].replace(/^--/, '')] = raw[i + 1];
  if (!values.tool || !values.project || !values.resultsDir || !values.timestamp) {
    throw new Error('Missing required arguments');
  }
  return {
    tool: values.tool,
    project: path.resolve(values.project),
    resultsDir: path.resolve(values.resultsDir),
    timestamp: values.timestamp,
  };
}

function writeConfig(tool: string, temp: string, entry: string, outDir: string): { config: string; command: string } {
  const q = JSON.stringify;
  switch (tool) {
    case 'vite': {
      const config = path.join(temp, 'vite.config.mjs');
      fs.writeFileSync(config, `
import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    lib: { entry: ${q(entry)}, formats: ['es'], fileName: () => 'bundle.js' },
    outDir: ${q(outDir)}, emptyOutDir: true, minify: false, sourcemap: false
  }
});
`);
      return { config, command: `npx vite build --config ${q(config)}` };
    }
    case 'rspack': {
      const config = path.join(temp, 'rspack.config.cjs');
      fs.writeFileSync(config, `
const path = require('path');
module.exports = {
  mode: 'production', entry: ${q(entry)}, target: 'web',
  output: { path: ${q(outDir)}, filename: 'bundle.js', clean: true },
  optimization: { minimize: false }
};
`);
      return { config, command: `npx rspack build --config ${q(config)}` };
    }
    case 'webpack': {
      const config = path.join(temp, 'webpack.config.cjs');
      fs.writeFileSync(config, `
module.exports = {
  mode: 'production', entry: ${q(entry)}, target: 'web',
  output: { path: ${q(outDir)}, filename: 'bundle.js', clean: true },
  optimization: { minimize: false }
};
`);
      return { config, command: `npx webpack --config ${q(config)}` };
    }
    case 'esbuild': {
      const config = path.join(temp, 'esbuild.mjs');
      fs.writeFileSync(config, `
import * as esbuild from 'esbuild';
await esbuild.build({
  entryPoints: [${q(entry)}], bundle: true, outfile: ${q(path.join(outDir, 'bundle.js'))},
  format: 'esm', platform: 'browser', minify: false, sourcemap: false
});
`);
      return { config, command: `node ${q(config)}` };
    }
    case 'rollup': {
      const config = path.join(temp, 'rollup.config.mjs');
      fs.writeFileSync(config, `
import resolve from '@rollup/plugin-node-resolve';
export default {
  input: ${q(entry)},
  output: { file: ${q(path.join(outDir, 'bundle.js'))}, format: 'es' },
  plugins: [resolve({ browser: true })]
};
`);
      return { config, command: `node --stack-size=65536 ./node_modules/.bin/rollup -c ${q(config)}` };
    }
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

function buildSize(args: Args, variant: string, source: string, temp: string, logFile: string): number {
  const entry = path.join(temp, `${variant}.mjs`);
  const outDir = path.join(temp, `dist-${variant}`);
  fs.writeFileSync(entry, source);
  const { command } = writeConfig(args.tool, temp, entry, outDir);
  fs.rmSync(outDir, { recursive: true, force: true });
  const result = spawnSync(command, {
    cwd: args.project,
    env: { ...process.env, NODE_ENV: 'production' },
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
    shell: true,
  });
  fs.appendFileSync(logFile, `\n--- ${variant} ---\n${result.stdout ?? ''}${result.stderr ?? ''}`);
  if (result.status !== 0) throw new Error(`${variant} build failed with status ${result.status}`);
  const bundle = path.join(outDir, 'bundle.js');
  if (!fs.existsSync(bundle)) throw new Error(`${variant} build produced no bundle.js`);
  return fs.statSync(bundle).size;
}

function main() {
  const args = parseArgs();
  fs.mkdirSync(args.resultsDir, { recursive: true });
  const logsDir = path.join(args.resultsDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  const temp = path.join(args.project, '.benchmark-tree-shaking');
  const logFile = path.join(logsDir, `${args.tool}_tree-shake_M7_${args.timestamp}.log`);
  fs.rmSync(temp, { recursive: true, force: true });
  fs.mkdirSync(temp);
  fs.writeFileSync(logFile, '');

  const sources = {
    empty: `globalThis.__treeShakeFixture = [{ a: 1 }, 'function'];\n`,
    used: `import { pick, debounce } from 'lodash-es';\nconst debounced = debounce(() => 42, 1);\ndebounced();\nglobalThis.__treeShakeFixture = [pick({ a: 1, b: 2 }, ['a']), debounced];\n`,
    full: `import * as lodash from 'lodash-es';\nglobalThis.__treeShakeFixture = lodash;\n`,
  };

  try {
    const first = Object.fromEntries(
      Object.entries(sources).map(([variant, source]) => [variant, buildSize(args, variant, source, temp, logFile)]),
    ) as Record<keyof typeof sources, number>;
    const second = Object.fromEntries(
      Object.entries(sources).map(([variant, source]) => [variant, buildSize(args, variant, source, temp, logFile)]),
    ) as Record<keyof typeof sources, number>;
    if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error('Fixture output is not deterministic');

    const usedBytes = first.used - first.empty;
    const fullBytes = first.full - first.empty;
    if (usedBytes < 0 || fullBytes <= 0 || usedBytes > fullBytes) {
      throw new Error(`Invalid differential sizes: empty=${first.empty}, used=${first.used}, full=${first.full}`);
    }
    const eliminatedPercent = Math.round((1 - usedBytes / fullBytes) * 10_000) / 100;
    const csv = path.join(args.resultsDir, `${args.tool}_tree-shake_M7.csv`);
    fs.writeFileSync(
      csv,
      `tool,size,metric,run,value,unit,timestamp\n${args.tool},tree-shake,M7,1,${eliminatedPercent},percent,${args.timestamp}\n`,
    );
    fs.writeFileSync(
      path.join(args.resultsDir, `${args.tool}_tree-shake_M7.meta.json`),
      `${JSON.stringify({
        ...args,
        definition: 'percentage of full lodash-es differential bytes eliminated when only pick and debounce are observably used',
        unminified: true,
        firstBuildBytes: first,
        deterministicSecondBuildBytes: second,
        usedDifferentialBytes: usedBytes,
        fullDifferentialBytes: fullBytes,
        eliminatedPercent,
      }, null, 2)}\n`,
    );
    console.log(`${args.tool}: ${eliminatedPercent}% eliminated (empty=${first.empty}, used=${first.used}, full=${first.full})`);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

main();
