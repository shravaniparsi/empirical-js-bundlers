import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, openSync, closeSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { candidate, verifySource, sha256 } from './verify-realworld-source.mjs';
const [id, sourceArg, reportArg] = process.argv.slice(2);
if (!id || !sourceArg || !reportArg) throw new Error('Usage: run-realworld-baseline.mjs <id> <source-dir> <NEW-report-dir>');
const app = candidate(id), source = resolve(sourceArg), report = resolve(reportArg);
mkdirSync(report, { recursive: false });
const receipt = { schemaVersion: 1, id, purpose: 'Upstream feasibility only; not comparative timing', publicationEligible: false, node: process.version, platform: process.platform, architecture: process.arch, startedAt: new Date().toISOString(), steps: [], status: 'running' };
const save = () => writeFileSync(join(report, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
function run(name, args, cwd) {
  const log = openSync(join(report, `${name}.log`), 'wx');
  const startedAt = new Date().toISOString();
  let result;
  try {
    result = spawnSync(args[0], args.slice(1), { cwd, env: { ...process.env, CI: 'true', HUSKY: '0', NODE_OPTIONS: '--max-old-space-size=6144', VITE_APP_ENABLE_TRACKING: 'false', VITE_APP_DISABLE_SENTRY: 'true' }, stdio: ['ignore', log, log], timeout: 20 * 60 * 1000 });
  } finally { closeSync(log); }
  receipt.steps.push({ name, args, cwd: relative(source, cwd) || '.', startedAt, endedAt: new Date().toISOString(), exitCode: result.status, signal: result.signal, error: result.error?.message, logSha256: sha256(readFileSync(join(report, `${name}.log`))) });
  save();
  if (result.status !== 0) throw new Error(`${name} failed; see ${name}.log`);
}
try {
  if (process.version !== `v${app.baselineNode}`) throw new Error(`Expected Node ${app.baselineNode}`);
  receipt.before = verifySource(id, source); save();
  const cwd = join(source, app.frontendDirectory);
  const pm = app.packageManager.split('@')[0];
  run('package-manager', [pm, '--version'], cwd);
  if (readFileSync(join(report, 'package-manager.log'), 'utf8').trim() !== app.packageManager.split('@')[1]) throw new Error('Package manager version mismatch');
  run('install', [pm, 'install', '--frozen-lockfile'], cwd);
  receipt.afterInstall = verifySource(id, source); save();
  run('build', app.build, cwd);
  receipt.afterBuild = verifySource(id, source);
  const output = join(source, app.outputDirectory), files = [];
  function walk(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) { const path = join(dir, entry.name); if (entry.isDirectory()) walk(path); else if (entry.isFile()) files.push({ path: relative(output, path), bytes: statSync(path).size, sha256: sha256(readFileSync(path)) }); } }
  walk(output);
  if (!files.some(file => file.path === 'index.html') || !files.some(file => file.path.endsWith('.js'))) throw new Error('Missing application output');
  writeFileSync(join(report, 'output-manifest.json'), JSON.stringify(files.sort((a,b) => a.path.localeCompare(b.path)), null, 2) + '\n');
  receipt.outputFiles = files.length;
  receipt.status = 'build-passed-browser-not-validated';
} catch (error) { receipt.status = 'failed'; receipt.error = error.message; process.exitCode = 1; }
finally { receipt.finishedAt = new Date().toISOString(); save(); console.log(JSON.stringify(receipt, null, 2)); }
