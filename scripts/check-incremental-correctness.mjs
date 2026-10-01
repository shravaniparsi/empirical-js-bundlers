#!/usr/bin/env node
/** M3 completion-boundary correctness. Deliberately records no latency values. */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { IncrementalCompletionGate, incrementalCompletionPatterns } from './incremental-completion-gate.mjs';

const [tool, workspaceArg, reportArg, targetArg = 'src/App.tsx'] = process.argv.slice(2);
if (!Object.hasOwn(incrementalCompletionPatterns, tool) || !workspaceArg || !reportArg) {
  throw new Error('Usage: check-incremental-correctness.mjs <vite|rspack|esbuild|webpack|rollup> <workspace> <NEW-report.json> [target-relative]');
}
const workspace = fs.realpathSync(workspaceArg);
const reportPath = path.resolve(reportArg);
if (fs.existsSync(reportPath)) throw new Error('Refusing to overwrite an incremental correctness report');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
const target = path.resolve(workspace, targetArg);
if (!target.startsWith(`${workspace}${path.sep}`) || !fs.existsSync(target)) throw new Error('Target must be an existing file inside the workspace');
const original = fs.readFileSync(target);
const hash = value => createHash('sha256').update(value).digest('hex');
const originalHash = hash(original);
const logPath = reportPath.replace(/\.json$/, '.log');
const log = fs.createWriteStream(logPath, { flags: 'wx' });
const bin = name => path.join(workspace, 'node_modules', '.bin', name);
const adapterBuild = path.join(workspace, 'adapter-build.mjs');
const usesRealworldAdapter = fs.existsSync(adapterBuild) && fs.existsSync(path.join(workspace, 'benchmark-profile.json'));
const commands = {
  vite: usesRealworldAdapter ? [process.execPath, ['adapter-build.mjs', '--watch']] : [bin('vite'), ['build', '--watch', '--mode', 'development', '--minify', 'false']],
  rspack: [bin('rspack'), ['build', '--watch', '--config', 'rspack.config.cjs']],
  esbuild: usesRealworldAdapter ? [process.execPath, ['adapter-build.mjs', '--watch']] : [process.execPath, ['configs/esbuild/watch.mjs']],
  webpack: [bin('webpack'), ['--watch', '--config', 'webpack.config.cjs']],
  rollup: usesRealworldAdapter ? [process.execPath, ['adapter-build.mjs', '--watch']] : [bin('rollup'), ['-c', 'rollup.config.mjs', '-w']],
};
const initialPatterns = {
  vite: /built in/i,
  rspack: /compiled successfully/i,
  esbuild: /initial build finished \(0 errors\)/i,
  webpack: /compiled successfully/i,
  rollup: /created .+ in /i,
};
const [command, args] = commands[tool];
const report = {
  schemaVersion: 1,
  kind: 'incremental-completion-correctness-not-latency-data',
  publicationEligible: false,
  tool,
  node: process.version,
  target: targetArg,
  targetSha256Before: originalHash,
  lockSha256: fs.existsSync(path.join(workspace, 'package-lock.json')) ? hash(fs.readFileSync(path.join(workspace, 'package-lock.json'))) : null,
  command: [path.basename(command), ...args],
  checks: {},
  edits: [],
  errors: [],
  passed: false,
};

function outputHas(marker) {
  const output = path.join(workspace, 'dist');
  if (!fs.existsSync(output)) return false;
  const html = path.join(output, 'index.html');
  if (fs.existsSync(html)) {
    const source = fs.readFileSync(html, 'utf8');
    const roots = [...source.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.(?:m?js|cjs))(?:\?[^"']*)?["']/gi)]
      .map(match => match[1]);
    if (roots.length) {
      const queue = roots.map(specifier => path.resolve(output, specifier.replace(/^\//, '')));
      const visited = new Set();
      while (queue.length) {
        const filename = queue.pop();
        if (visited.has(filename) || !filename.startsWith(`${output}${path.sep}`) || !fs.existsSync(filename)) continue;
        visited.add(filename);
        const javascript = fs.readFileSync(filename, 'utf8');
        if (javascript.includes(marker)) return true;
        for (const match of javascript.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+\.(?:m?js|cjs))(?:\?[^"']*)?["']/g)) {
          const specifier = match[1];
          queue.push(specifier.startsWith('/') ? path.resolve(output, specifier.slice(1)) : path.resolve(path.dirname(filename), specifier));
        }
      }
      return false;
    }
  }
  const pending = [output];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(filename);
      else if (entry.isFile() && /\.(?:m?js|cjs)$/.test(entry.name) && fs.readFileSync(filename, 'utf8').includes(marker)) return true;
    }
  }
  return false;
}

function processGroupAlive(child) {
  try { process.kill(-child.pid, 0); return true; } catch { return false; }
}

async function stop(child) {
  if (!child?.pid) return true;
  try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  for (let attempt = 0; attempt < 300 && processGroupAlive(child); attempt += 1) await new Promise(resolve => setTimeout(resolve, 100));
  if (processGroupAlive(child)) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
  for (let attempt = 0; attempt < 50 && processGroupAlive(child); attempt += 1) await new Promise(resolve => setTimeout(resolve, 100));
  return !processGroupAlive(child);
}

fs.rmSync(path.join(workspace, 'dist'), { recursive: true, force: true });
const gate = new IncrementalCompletionGate(incrementalCompletionPatterns[tool]);
let initialResolve;
let initialReject;
let initialSettled = false;
let lineBuffer = '';
const initial = new Promise((resolve, reject) => { initialResolve = resolve; initialReject = reject; });
const initialTimeout = setTimeout(() => {
  if (!initialSettled) { initialSettled = true; initialReject(new Error('initial watch build timeout')); }
}, 600_000);
const child = spawn(command, args, {
  cwd: workspace,
  detached: true,
  env: { ...process.env, NODE_ENV: 'development', NO_COLOR: '1', FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const consume = chunk => {
  log.write(chunk);
  gate.ingest(chunk);
  if (initialSettled) return;
  lineBuffer += String(chunk).replaceAll('\r', '\n');
  const lines = lineBuffer.split('\n');
  lineBuffer = lines.pop() ?? '';
  for (const line of lines) {
    const failure = incrementalCompletionPatterns[tool].failurePattern;
    failure.lastIndex = 0;
    if (failure.test(line)) {
      initialSettled = true;
      clearTimeout(initialTimeout);
      initialReject(new Error(`initial build failed: ${line.trim()}`));
      return;
    }
    initialPatterns[tool].lastIndex = 0;
    if (initialPatterns[tool].test(line)) {
      initialSettled = true;
      clearTimeout(initialTimeout);
      initialResolve();
      return;
    }
  }
};
child.stdout.on('data', consume);
child.stderr.on('data', consume);
child.once('exit', (code, signal) => {
  const message = `watch process exited before cleanup: code=${code} signal=${signal}`;
  if (!initialSettled) { initialSettled = true; clearTimeout(initialTimeout); initialReject(new Error(message)); }
  gate.cancel(message);
});

try {
  await initial;
  report.checks.initialBuildSucceeded = true;
  if (!fs.existsSync(path.join(workspace, 'dist'))) throw new Error('initial build produced no dist directory');
  report.checks.initialOutputExists = true;
  for (let edit = 1; edit <= 3; edit += 1) {
    const marker = `confirmatory_m3_correctness_${tool}_${edit}`;
    if (original.includes(marker) || outputHas(marker)) throw new Error(`marker ${marker} existed before edit`);
    const modified = Buffer.concat([original, Buffer.from(`\n;globalThis[${JSON.stringify(`__${marker}`)}] = ${JSON.stringify(marker)};\n`)]);
    const probe = gate.arm({ marker, markerPresent: outputHas, timeoutMs: 120_000 });
    fs.writeFileSync(target, modified);
    const completion = await probe.promise;
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!outputHas(marker)) throw new Error(`marker ${marker} disappeared before settle check`);
    const revert = gate.arm({ marker: `revert-${marker}`, markerPresent: async () => !outputHas(marker), timeoutMs: 120_000 });
    fs.writeFileSync(target, original);
    await revert.promise;
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (outputHas(marker)) throw new Error(`marker ${marker} survived source restoration rebuild`);
    report.edits.push({ edit, marker, postEditSuccess: true, markerObserved: true, sourceRestorationRebuilt: true, staleSuccessesIgnored: completion.unmatchedSuccesses });
  }
  report.checks.threeEditAndRevertCycles = report.edits.length === 3 && report.edits.every(edit => edit.postEditSuccess && edit.markerObserved && edit.sourceRestorationRebuilt);
  report.passed = true;
} catch (error) {
  report.errors.push(error.message);
} finally {
  clearTimeout(initialTimeout);
  gate.cancel('correctness harness cleanup');
  fs.writeFileSync(target, original);
  report.checks.sourceRestored = hash(fs.readFileSync(target)) === originalHash;
  report.checks.processTreeStopped = await stop(child);
  await new Promise(resolve => log.end(resolve));
  report.targetSha256After = hash(fs.readFileSync(target));
  report.passed = report.passed && Object.values(report.checks).every(Boolean) && report.errors.length === 0;
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
}

console.log(JSON.stringify({ tool, passed: report.passed, checks: report.checks, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
