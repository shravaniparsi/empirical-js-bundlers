/**
 * Unified M2/M10/M11 collection from the same production-build invocations.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Args {
  tool: string;
  project: string;
  size: string;
  runs: number;
  runOffset: number;
  append: boolean;
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
    runs: Number(values.runs ?? 10),
    runOffset: Number(values.runOffset ?? 0),
    append: values.append === 'true',
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

function sourceHash(project: string): string {
  const digest = createHash('sha256');
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        digest.update(path.relative(project, full));
        digest.update(fs.readFileSync(full));
      }
    }
  };
  walk(path.join(project, 'src'));
  return digest.digest('hex');
}

function main() {
  const args = parseArgs();
  if (!Number.isInteger(args.runs) || args.runs < 1) throw new Error('--runs must be a positive integer');
  if (process.platform !== 'darwin') throw new Error('This validated parser currently requires macOS /usr/bin/time -l');
  fs.mkdirSync(args.resultsDir, { recursive: true });
  const logsDir = path.join(args.resultsDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  const logFile = path.join(logsDir, `${args.tool}_${args.size}_M2-M10-M11_${args.timestamp}.log`);
  fs.writeFileSync(logFile, '');

  const metrics = ['M2', 'M10', 'M11'];
  const metricRows: Record<string, string[]> = Object.fromEntries(metrics.map(metric => {
    const file = path.join(args.resultsDir, `${args.tool}_${args.size}_${metric}.csv`);
    const existing = args.append && fs.existsSync(file)
      ? fs.readFileSync(file, 'utf8').trim().split('\n').slice(1)
          .filter(row => {
            const run = Number(row.split(',')[3]);
            return run <= args.runOffset || run > args.runOffset + args.runs;
          })
      : [];
    return [metric, ['tool,size,metric,run,value,unit,timestamp', ...existing]];
  }));
  const beforeHash = sourceHash(args.project);
  const metadataFile = path.join(args.resultsDir, `${args.tool}_${args.size}_M2-M10-M11.meta.json`);
  const previousMetadata = args.append && fs.existsSync(metadataFile)
    ? JSON.parse(fs.readFileSync(metadataFile, 'utf8'))
    : undefined;
  const runDetails: Array<{ run: number; realSeconds: number; userSeconds: number; systemSeconds: number; rssBytes: number }> =
    ((previousMetadata?.runDetails ?? []) as Array<{ run: number; realSeconds: number; userSeconds: number; systemSeconds: number; rssBytes: number }>)
      .filter(detail => detail.run <= args.runOffset || detail.run > args.runOffset + args.runs);

  for (let localRun = 1; localRun <= args.runs; localRun++) {
    const run = args.runOffset + localRun;
    for (const relative of ['dist', '.rspack', '.vite', 'node_modules/.cache']) {
      fs.rmSync(path.join(args.project, relative), { recursive: true, force: true });
    }
    const command = `${buildCommand(args.tool)} > /dev/null 2>&1`;
    const result = spawnSync('/usr/bin/time', ['-l', 'bash', '-c', command], {
      cwd: args.project,
      env: { ...process.env, NODE_ENV: 'production' },
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const timing = result.stderr ?? '';
    fs.appendFileSync(logFile, `\n--- run ${run} ---\n${timing}`);
    if (result.status !== 0) throw new Error(`Run ${run} failed with status ${result.status}`);

    const cpu = timing.match(/([\d.]+)\s+real\s+([\d.]+)\s+user\s+([\d.]+)\s+sys/);
    const rss = timing.match(/(\d+)\s+maximum resident set size/);
    if (!cpu || !rss) throw new Error(`Run ${run}: could not parse /usr/bin/time output`);
    const realSeconds = Number(cpu[1]);
    const userSeconds = Number(cpu[2]);
    const systemSeconds = Number(cpu[3]);
    const rssBytes = Number(rss[1]);
    const m2 = Math.round(realSeconds * 1000);
    const m10 = Math.round(rssBytes / 1_048_576 * 100) / 100;
    const m11 = Math.round((userSeconds + systemSeconds) * 100) / 100;
    metricRows.M2.push(`${args.tool},${args.size},M2,${run},${m2},ms,${args.timestamp}`);
    metricRows.M10.push(`${args.tool},${args.size},M10,${run},${m10},MiB,${args.timestamp}`);
    metricRows.M11.push(`${args.tool},${args.size},M11,${run},${m11},seconds,${args.timestamp}`);
    runDetails.push({ run, realSeconds, userSeconds, systemSeconds, rssBytes });
    console.log(`Run ${run}: wall=${m2}ms max-process-RSS=${m10}MiB CPU=${m11}s`);
  }

  const afterHash = sourceHash(args.project);
  if (beforeHash !== afterHash) throw new Error('Source changed during resource campaign');
  for (const [metric, rows] of Object.entries(metricRows)) {
    const [header, ...data] = rows;
    data.sort((left, right) => Number(left.split(',')[3]) - Number(right.split(',')[3]));
    fs.writeFileSync(path.join(args.resultsDir, `${args.tool}_${args.size}_${metric}.csv`), `${[header, ...data].join('\n')}\n`);
  }
  runDetails.sort((a, b) => a.run - b.run);
  fs.writeFileSync(
    metadataFile,
    `${JSON.stringify({
      ...args,
      definition: {
        M2: 'wall time of a production build after clearing bundler output and caches',
        M10: 'maximum resident set size reported by macOS /usr/bin/time -l for the command process and waited-for children; not aggregate simultaneous process-tree RSS',
        M11: 'user plus system CPU seconds from macOS /usr/bin/time -l',
      },
      command: buildCommand(args.tool),
      sourceSha256: beforeHash,
      runDetails,
    }, null, 2)}\n`,
  );
}

main();
