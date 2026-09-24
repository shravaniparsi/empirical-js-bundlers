/**
 * Unified deterministic output-quality collection for M5, M6, M8 and M9.
 *
 * M5: generated JS/CSS/HTML bytes (external maps and copied public files excluded)
 * M6: sum of individually gzipped generated JS files
 * M8: generated JS file count
 * M9: exact mapping of a generated sentinel back to its original source line
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { gzipSync } from 'node:zlib';
import { median } from 'simple-statistics';
import { SourceMapConsumer } from 'source-map';

interface Args {
  tool: string;
  project: string;
  size: string;
  runs: number;
  resultsDir: string;
  timestamp: string;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const values: Record<string, string> = {};
  for (let i = 0; i < raw.length; i += 2) values[raw[i].replace(/^--/, '')] = raw[i + 1];
  if (!values.tool || !values.project || !values.size || !values.resultsDir || !values.timestamp) {
    throw new Error('Missing required arguments');
  }
  return {
    tool: values.tool,
    project: path.resolve(values.project),
    size: values.size,
    runs: Number(values.runs ?? 5),
    resultsDir: path.resolve(values.resultsDir),
    timestamp: values.timestamp,
  };
}

function buildCommand(tool: string): string {
  switch (tool) {
    case 'vite': return 'npx vite build';
    case 'rspack': return 'NODE_ENV=production npx rspack build --config rspack.config.cjs';
    case 'esbuild': return 'node configs/esbuild/build.mjs';
    case 'webpack': return 'NODE_ENV=production npx webpack --mode production --config webpack.config.cjs';
    case 'rollup': return 'NODE_ENV=production node --stack-size=65536 ./node_modules/.bin/rollup -c rollup.config.mjs';
    default: throw new Error(`Unknown tool: ${tool}`);
  }
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files.sort();
}

function publicRelatives(project: string): Set<string> {
  const publicDir = path.join(project, 'public');
  return new Set(walk(publicDir).map(file => path.relative(publicDir, file)));
}

function generatedFiles(project: string): string[] {
  const dist = path.join(project, 'dist');
  const copiedPublic = publicRelatives(project);
  return walk(dist).filter(file => !copiedPublic.has(path.relative(dist, file)));
}

function manifestEntries(project: string): Record<string, string> {
  const dist = path.join(project, 'dist');
  return Object.fromEntries(generatedFiles(project).map(file => [
    path.relative(dist, file),
    createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  ]));
}

interface OutputSummary {
  rawBytes: number;
  gzipBytes: number;
  jsFiles: number;
  manifest: Record<string, string>;
}

function summarizeOutput(project: string): OutputSummary {
  const files = generatedFiles(project);
  const assets = files.filter(file => /\.(?:js|css|html)$/i.test(file));
  const js = files.filter(file => file.endsWith('.js'));
  return {
    rawBytes: assets.reduce((sum, file) => sum + fs.statSync(file).size, 0),
    gzipBytes: js.reduce((sum, file) => sum + gzipSync(fs.readFileSync(file), { level: 9 }).byteLength, 0),
    jsFiles: js.length,
    manifest: manifestEntries(project),
  };
}

function runBuild(args: Args, logFile: string): void {
  fs.rmSync(path.join(args.project, 'dist'), { recursive: true, force: true });
  fs.rmSync(path.join(args.project, '.rspack'), { recursive: true, force: true });
  fs.rmSync(path.join(args.project, '.vite'), { recursive: true, force: true });
  const result = spawnSync(buildCommand(args.tool), {
    cwd: args.project,
    env: { ...process.env, NODE_ENV: 'production' },
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
    shell: true,
  });
  fs.appendFileSync(logFile, `${result.stdout ?? ''}${result.stderr ?? ''}`);
  if (result.status !== 0) throw new Error(`Build failed with status ${result.status}`);
  if (!fs.existsSync(path.join(args.project, 'dist'))) throw new Error('Build produced no dist directory');
}

function writeMetric(args: Args, metric: string, values: number[], unit: string): void {
  const csv = path.join(args.resultsDir, `${args.tool}_${args.size}_${metric}.csv`);
  const rows = values.map(
    (value, index) => `${args.tool},${args.size},${metric},${index + 1},${value},${unit},${args.timestamp}`,
  );
  fs.writeFileSync(
    csv,
    `tool,size,metric,run,value,unit,timestamp\n${rows.join('\n')}\n`,
  );
}

async function main() {
  const args = parseArgs();
  if (!Number.isInteger(args.runs) || args.runs < 2) throw new Error('--runs must be an integer of at least 2');
  fs.mkdirSync(args.resultsDir, { recursive: true });
  const logsDir = path.join(args.resultsDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  const logFile = path.join(logsDir, `${args.tool}_${args.size}_output_${args.timestamp}.log`);
  fs.writeFileSync(logFile, '');

  runBuild(args, logFile);
  const dist = path.join(args.project, 'dist');
  const summaries: OutputSummary[] = [summarizeOutput(args.project)];

  const entry = path.join(args.project, 'src', 'main.tsx');
  const probe = path.join(args.project, 'src', '__benchmark_sourcemap_probe__.ts');
  const originalEntry = fs.readFileSync(entry, 'utf8');
  const originalEntryMode = fs.statSync(entry).mode;
  const probeExisted = fs.existsSync(probe);
  const originalProbe = probeExisted ? fs.readFileSync(probe) : undefined;
  const originalProbeMode = probeExisted ? fs.statSync(probe).mode : undefined;
  const entryHashBefore = createHash('sha256').update(originalEntry).digest('hex');
  const sentinel = `__SOURCEMAP_PROBE_${args.timestamp}__`;
  let mapResult: {
    valid: boolean;
    generatedFile?: string;
    originalSource?: string;
    originalLine?: number;
    originalColumn?: number;
    error?: string;
  };
  try {
    fs.writeFileSync(probe, `export function sourceMapProbe() {\n  throw new Error('${sentinel}');\n}\n(globalThis as any).__sourceMapProbe = sourceMapProbe;\n`);
    fs.writeFileSync(entry, `import './__benchmark_sourcemap_probe__';\n${originalEntry}`);
    runBuild(args, logFile);
    const generated = generatedFiles(args.project).filter(file => file.endsWith('.js'));
    const generatedFile = generated.find(file => fs.readFileSync(file, 'utf8').includes(sentinel));
    if (!generatedFile) {
      mapResult = { valid: false, error: 'sentinel absent from generated JavaScript' };
    } else if (!fs.existsSync(`${generatedFile}.map`)) {
      mapResult = { valid: false, generatedFile: path.relative(dist, generatedFile), error: 'sentinel bundle has no external map' };
    } else {
      const code = fs.readFileSync(generatedFile, 'utf8');
      const offset = code.indexOf(sentinel);
      const before = code.slice(0, offset);
      const generatedLine = before.split('\n').length;
      const lineStart = before.lastIndexOf('\n') + 1;
      const sentinelColumn = offset - lineStart;
      const consumer = await new SourceMapConsumer(JSON.parse(fs.readFileSync(`${generatedFile}.map`, 'utf8')));
      const mapped = consumer.originalPositionFor({ line: generatedLine, column: sentinelColumn });
      consumer.destroy();
      mapResult = mapped.source?.endsWith('__benchmark_sourcemap_probe__.ts') &&
          mapped.line === 2 && (mapped.column === 18 || mapped.column === 19)
        ? {
            valid: true,
            generatedFile: path.relative(dist, generatedFile),
            originalSource: mapped.source ?? undefined,
            originalLine: mapped.line ?? undefined,
            originalColumn: mapped.column ?? undefined,
          }
        : {
            valid: false,
            generatedFile: path.relative(dist, generatedFile),
            error: `sentinel column mapped to ${mapped.source}:${mapped.line}:${mapped.column}, expected probe line 2 column 18/19`,
          };
    }
  } finally {
    fs.writeFileSync(entry, originalEntry);
    fs.chmodSync(entry, originalEntryMode);
    if (probeExisted && originalProbe && originalProbeMode !== undefined) {
      fs.writeFileSync(probe, originalProbe);
      fs.chmodSync(probe, originalProbeMode);
    } else {
      fs.rmSync(probe, { force: true });
    }
  }

  const entryHashAfter = createHash('sha256').update(fs.readFileSync(entry)).digest('hex');
  const probeRestored = probeExisted
    ? fs.existsSync(probe) && originalProbe !== undefined &&
      createHash('sha256').update(fs.readFileSync(probe)).digest('hex') ===
      createHash('sha256').update(originalProbe).digest('hex')
    : !fs.existsSync(probe);
  if (entryHashBefore !== entryHashAfter || !probeRestored) {
    throw new Error('Sourcemap probe source paths were not restored');
  }

  for (let run = 2; run <= args.runs; run++) {
    runBuild(args, logFile);
    summaries.push(summarizeOutput(args.project));
  }
  const byteForByteDeterministic = summaries.every(
    summary => JSON.stringify(summary.manifest) === JSON.stringify(summaries[0].manifest),
  );

  writeMetric(args, 'M5', [median(summaries.map(summary => summary.rawBytes))], 'bytes');
  writeMetric(args, 'M6', [median(summaries.map(summary => summary.gzipBytes))], 'bytes');
  writeMetric(args, 'M8', [median(summaries.map(summary => summary.jsFiles))], 'count');
  writeMetric(args, 'M9', [mapResult.valid ? 100 : 0], 'percent');

  const metadataFile = path.join(args.resultsDir, `${args.tool}_${args.size}_output.meta.json`);
  fs.writeFileSync(metadataFile, `${JSON.stringify({
    ...args,
    definitions: {
      M5: 'generated JS/CSS/HTML bytes; external maps and copied public files excluded',
      M6: 'sum of generated JS files gzipped individually at level 9',
      M8: 'generated JS file count',
      M9: 'exact generated-to-original mapping of an injected sentinel probe',
    },
    buildCommand: buildCommand(args.tool),
    analyticalAggregation: 'one median observation from five clean verification builds',
    aggregationReason: byteForByteDeterministic
      ? 'Five builds were byte-for-byte identical; median equals every run.'
      : 'Output varied across clean builds; M5/M6/M8 use the predeclared five-build median.',
    outputRuns: summaries,
    sourceMapProbe: mapResult,
    sourceRestoration: { entryHashBefore, entryHashAfter, probeExisted, probeRestored },
    byteForByteDeterministic,
    metricsAccepted: true,
  }, null, 2)}\n`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
