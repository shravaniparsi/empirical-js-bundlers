/** Small instrumentation pilot only. Never append to publication-authoritative data. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
const workspaceRoot = path.resolve(process.argv[2] ?? '');
const output = path.resolve(process.argv[3] ?? '');
if (!process.argv[2] || !process.argv[3] || !workspaceRoot.includes('.submission-pilot')) throw new Error('Usage: node scripts/collect-production-pilot.mjs <isolated-pilot-root> <new-review-directory>');
if (!output.includes(`${path.sep}review${path.sep}`) || fs.existsSync(output)) throw new Error('Choose a new output directory under review/');
fs.mkdirSync(output, { recursive: true });
const tools = ['vite', 'rspack', 'esbuild', 'webpack', 'rollup'];
let seed = 20260924;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;return seed / 2 ** 32; };
const schedule = [];
for (let block = 1; block <= 3; block++) {
  const order = [...tools];for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1));[order[i], order[j]] = [order[j], order[i]]; }
  order.forEach((tool, index) => schedule.push({ block, order: index + 1, tool }));
}
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function tree(dir) {
  const files = {};function walk(current) { for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) { const full = path.join(current, entry.name);if (entry.isDirectory()) walk(full);else if (entry.isFile()) files[path.relative(dir, full)] = hash(full); } }walk(dir);return files;
}
const manifests = {};
for (const tool of tools) {
  const workspace = path.join(workspaceRoot, tool), gate = path.join(workspaceRoot, `${tool}-production-acceptance.json`);
  if (!fs.existsSync(gate) || !JSON.parse(fs.readFileSync(gate)).passed) throw new Error(`Missing successful production acceptance: ${tool}`);
  manifests[tool] = { sources: tree(path.join(workspace, 'src')), package: hash(path.join(workspace, 'package.json')), lock: hash(path.join(workspace, 'package-lock.json')), acceptance: hash(gate) };
  const config = tool === 'esbuild' ? path.join(workspace, 'configs/esbuild/build.mjs') : path.join(workspace, { vite: 'vite.config.ts', rspack: 'rspack.config.cjs', webpack: 'webpack.config.cjs', rollup: 'rollup.config.mjs' }[tool]);
  manifests[tool].config = hash(config);
  const archive = path.join(output, 'provenance', tool);fs.mkdirSync(archive, { recursive: true });
  for (const name of ['package.json', 'package-lock.json', 'MANIFEST.json', 'GRAPH.json']) fs.copyFileSync(path.join(workspace, name), path.join(archive, name));
  fs.copyFileSync(config, path.join(archive, path.basename(config)));
  fs.copyFileSync(gate, path.join(archive, 'acceptance.json'));
  const pkg = { vite: 'vite', rspack: '@rspack/core', esbuild: 'esbuild', webpack: 'webpack', rollup: 'rollup' }[tool];
  manifests[tool].resolvedToolVersion = JSON.parse(fs.readFileSync(path.join(workspace, 'node_modules', pkg, 'package.json'))).version;
  manifests[tool].resolvedReactVersion = JSON.parse(fs.readFileSync(path.join(workspace, 'node_modules/react/package.json'))).version;
}
const capacity = fs.statfsSync(workspaceRoot);
if (capacity.bavail * capacity.bsize < 3 * 1024 ** 3) throw new Error('At least 3 GiB free disk is required for this small pilot');
if (os.loadavg()[0] > os.cpus().length) throw new Error('Host load exceeds logical CPU count; defer collection');
fs.copyFileSync(new URL(import.meta.url), path.join(output, 'provenance/collector.mjs'));
fs.copyFileSync('tier1-synthetic/generate-project.ts', path.join(output, 'provenance/generate-project.ts'));
const manifest = { collectorSha256: hash(new URL(import.meta.url)), npm: spawnSync('npm', ['--version'], { encoding: 'utf8' }).stdout.trim(), status: 'running', publicationEligible: false, purpose: 'instrumentation and run-cost pilot; no comparative inference', seed: 20260924, schedule, definition: 'Monotonic elapsed milliseconds around npm run build; includes process and npm startup; bundler caches/output cleared, OS cache uncontrolled', host: { platform: os.platform(), release: os.release(), arch: os.arch(), memoryBytes: os.totalmem(), cpu: os.cpus()[0].model, logicalCpus: os.cpus().length, node: process.version }, manifests };
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const rows = [];
for (const run of schedule) {
  const workspace = path.join(workspaceRoot, run.tool);
  for (const name of ['dist', '.vite', '.rspack', 'node_modules/.cache', 'node_modules/.vite']) fs.rmSync(path.join(workspace, name), { recursive: true, force: true });
  const logName = `${run.block}-${run.order}-${run.tool}.log`, log = fs.openSync(path.join(output, logName), 'wx');
  const timestamp = new Date().toISOString(), loadBefore = os.loadavg();
  const started = performance.now();
  const result = spawnSync('npm', ['run', 'build'], { cwd: workspace, env: { ...process.env, NODE_ENV: 'production', NO_COLOR: '1', npm_config_update_notifier: 'false' }, stdio: ['ignore', log, log], timeout: 120000 });
  const wallMs = performance.now() - started;fs.closeSync(log);
  const restored = JSON.stringify(tree(path.join(workspace, 'src'))) === JSON.stringify(manifests[run.tool].sources);
  rows.push({ ...run, timestamp, wallMs, exitCode: result.status, error: result.error?.message, loadBefore, sourceUnchanged: restored, log: logName, outputFiles: result.status === 0 ? tree(path.join(workspace, 'dist')) : {} });
  fs.writeFileSync(path.join(output, 'observations.json'), JSON.stringify(rows, null, 2) + '\n');
  if (result.status !== 0 || !restored) { manifest.status = 'failed';break; }
  console.log(`Pilot block ${run.block}: ${run.tool} complete`);
}
manifest.status = manifest.status === 'failed' ? 'failed' : 'complete';
manifest.completedAt = new Date().toISOString();manifest.observations = rows.length;
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
process.exitCode = manifest.status === 'complete' ? 0 : 1;
