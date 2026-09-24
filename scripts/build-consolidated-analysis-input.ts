#!/usr/bin/env npx tsx
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Args {
  output: string;
  batches: string[];
  supplemental: string[];
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const args: Args = { output: '', batches: [], supplemental: [] };
  for (let index = 0; index < raw.length; index += 2) {
    const key = raw[index];
    const value = raw[index + 1];
    if (!value) throw new Error(`Missing value for ${key}`);
    if (key === '--output') args.output = path.resolve(value);
    else if (key === '--batch') args.batches.push(path.resolve(value));
    else if (key === '--supplemental') args.supplemental.push(path.resolve(value));
    else throw new Error(`Unknown argument: ${key}`);
  }
  if (!args.output || args.batches.length === 0) {
    throw new Error('Usage: --output DIR --batch DIR [...] [--supplemental CSV ...]');
  }
  return args;
}

function hashFile(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function csvFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['analysis', 'logs'].includes(entry.name)) return csvFiles(full);
    return entry.isFile() && entry.name.endsWith('.csv') ? [full] : [];
  });
}

function validateCsv(file: string, expectedMetric?: string): number {
  const [header, ...rows] = fs.readFileSync(file, 'utf8').trim().split('\n');
  if (!header?.startsWith('tool,size,metric,run,value,unit,timestamp')) {
    throw new Error(`Invalid CSV header: ${file}`);
  }
  if (rows.length === 0) throw new Error(`CSV has no observations: ${file}`);
  for (const row of rows) {
    const fields = row.split(',');
    if (expectedMetric && fields[2] !== expectedMetric) {
      throw new Error(`Expected ${expectedMetric} in ${file}, found ${fields[2]}`);
    }
    if (!Number.isInteger(Number(fields[3])) || !Number.isFinite(Number(fields[4])) || Number(fields[4]) < 0) {
      throw new Error(`Invalid run or value in ${file}: ${row}`);
    }
  }
  return rows.length;
}

const args = parseArgs();
if (fs.existsSync(args.output)) throw new Error(`Refusing to overwrite existing output: ${args.output}`);
const portablePath = (file: string): string => path.relative(process.cwd(), file);

const sourceBatches = args.batches.map(batch => {
  const manifestFile = path.join(batch, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (manifest.status !== 'complete' ||
      manifest.sourceVerification !== 'passed' ||
      fs.existsSync(path.join(batch, 'INVALID.md')) ||
      fs.existsSync(path.join(batch, '.incomplete'))) {
    throw new Error(`Refusing source batch ${batch} with status ${manifest.status}`);
  }
  return {
    batch: portablePath(batch),
    batchId: manifest.batchId,
    phase: manifest.phase,
    manifestSha256: hashFile(manifestFile),
    environment: {
      gitCommit: manifest.gitCommit,
      node: manifest.node,
      platform: manifest.platform,
      release: manifest.release,
      cpus: manifest.cpus,
      totalMemoryBytes: manifest.totalMemoryBytes,
    },
  };
});
const requiredPhases = ['M3', 'M4', 'M7', 'output', 'resources'];
const phases = sourceBatches.map(batch => batch.phase).sort();
if (JSON.stringify(phases) !== JSON.stringify([...requiredPhases].sort())) {
  throw new Error(`Expected exactly one completed source batch for ${requiredPhases.join(', ')}, found ${phases.join(', ')}`);
}
const environments = new Set(sourceBatches.map(batch => JSON.stringify(batch.environment)));
if (environments.size !== 1 ||
    sourceBatches.some(batch => Object.values(batch.environment).some(value => value === undefined || value === ''))) {
  throw new Error('Source batches do not share one complete commit and host environment fingerprint');
}

fs.mkdirSync(path.join(args.output, 'tier1'), { recursive: true });
fs.mkdirSync(path.join(args.output, 'tier2'), { recursive: true });
fs.writeFileSync(path.join(args.output, '.incomplete'), '');

const copied = new Map<string, { source: string; sha256: string; observations: number }>();
function copyCsv(source: string, tier: 'tier1' | 'tier2', expectedMetric?: string): void {
  const relative = path.join(tier, path.basename(source));
  if (copied.has(relative)) {
    throw new Error(`Duplicate consolidated CSV ${relative}: ${copied.get(relative)!.source} and ${source}`);
  }
  const observations = validateCsv(source, expectedMetric);
  const destination = path.join(args.output, relative);
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  copied.set(relative, { source: portablePath(source), sha256: hashFile(source), observations });
}

for (const batch of args.batches) {
  for (const tier of ['tier1', 'tier2'] as const) {
    const tierDir = path.join(batch, tier);
    if (!fs.existsSync(tierDir)) continue;
    for (const file of csvFiles(tierDir)) copyCsv(file, tier);
  }
}
for (const file of args.supplemental) copyCsv(file, 'tier1', 'M1');

const tools = ['vite', 'rspack', 'esbuild', 'webpack', 'rollup'];
const devTools = ['vite', 'rspack', 'webpack'];
const sizes = ['xs-50', 's-200', 'm-500', 'l-2000', 'xl-5000'];
const devSizes = ['xs-50', 'm-500', 'xl-5000'];
const expected = new Map<string, number>();
const expect = (tier: string, metric: string, size: string, tool: string, observations: number) => {
  expected.set(`${tier}|${metric}|${size}|${tool}`, observations);
};
for (const tool of devTools) for (const size of devSizes) expect('tier1', 'M1', size, tool, 20);
for (const metric of ['M2', 'M10', 'M11']) {
  for (const tool of tools) {
    for (const size of sizes) expect('tier1', metric, size, tool, 10);
    expect('tier2', metric, 'bp-react', tool, 10);
  }
}
for (const tool of tools) for (const size of sizes) expect('tier1', 'M3', size, tool, 20);
for (const tool of devTools) {
  for (const size of devSizes) expect('tier1', 'M4', size, tool, 20);
  expect('tier2', 'M4', 'bp-react', tool, 20);
}
for (const metric of ['M5', 'M6', 'M8', 'M9']) {
  for (const tool of tools) {
    for (const size of sizes) expect('tier1', metric, size, tool, 1);
    expect('tier2', metric, 'bp-react', tool, 1);
  }
}
for (const tool of tools) expect('tier1', 'M7', 'tree-shake', tool, 1);

const observed = new Map<string, number>();
for (const relative of copied.keys()) {
  const tier = relative.startsWith('tier2') ? 'tier2' : 'tier1';
  const [, ...rows] = fs.readFileSync(path.join(args.output, relative), 'utf8').trim().split('\n');
  for (const row of rows) {
    const [tool, size, metric] = row.split(',');
    const key = `${tier}|${metric}|${size}|${tool}`;
    observed.set(key, (observed.get(key) ?? 0) + 1);
  }
}
const coverageErrors = [
  ...[...expected].flatMap(([key, count]) => observed.get(key) === count
    ? []
    : [`${key}: expected ${count}, found ${observed.get(key) ?? 0}`]),
  ...[...observed.keys()].filter(key => !expected.has(key)).map(key => `${key}: unexpected group`),
];
if (coverageErrors.length) {
  throw new Error(`Consolidated coverage validation failed:\n${coverageErrors.join('\n')}`);
}

const files = [...copied.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([file, provenance]) => ({ file, ...provenance }));
const rawObservations = files.reduce((sum, file) => sum + file.observations, 0);
fs.writeFileSync(path.join(args.output, 'manifest.json'), `${JSON.stringify({
  batchId: path.basename(args.output),
  kind: 'consolidated-validated-analysis-input',
  status: 'complete',
  generatedAt: new Date().toISOString(),
  sourceVerification: 'passed-at-consolidation',
  sourceBatches,
  supplementalFiles: args.supplemental.map(file => ({ file: portablePath(file), sha256: hashFile(file) })),
  csvFileCount: files.length,
  rawObservations,
  coverageValidation: 'passed',
  files,
}, null, 2)}\n`);
fs.rmSync(path.join(args.output, '.incomplete'));

console.log(`Consolidated ${files.length} CSV files and ${rawObservations} observations into ${args.output}`);
