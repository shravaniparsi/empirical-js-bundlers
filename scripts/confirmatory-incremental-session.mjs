#!/usr/bin/env node
/** M3 session collector: one untimed stabilization update plus five measured updates. */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { IncrementalCompletionGate, incrementalCompletionPatterns } from './incremental-completion-gate.mjs';
import { verifyCloudCellWorkspace } from './cloud-cell-workspace-seal.mjs';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index];
    if (!item.startsWith('--')) throw new Error(`unexpected argument ${item}`);
    const name = item.slice(2);
    if (name === 'correctness-only') options[name] = true;
    else if (argv[index + 1] === undefined || argv[index + 1].startsWith('--')) throw new Error(`missing value for --${name}`);
    else options[name] = argv[++index];
  }
  return options;
}
const options = parseArgs(process.argv.slice(2));
const tool = options.tool;
const workspaceArg = options.workspace;
const evidenceDirArg = options['evidence-dir'];
const workload = options.workload;
const targetArg = options.target ?? 'src/App.tsx';
const editMode = options['edit-mode'] ?? 'append';
const correctnessOnly = Boolean(options['correctness-only']);
const startupTimeoutMs = Number(options['startup-timeout-ms'] ?? 600_000);
const updateTimeoutMs = Number(options['update-timeout-ms'] ?? 120_000);
if (!Object.hasOwn(incrementalCompletionPatterns, tool) || !workspaceArg || !evidenceDirArg || !workload || !['append', 'memos', 'excalidraw'].includes(editMode)) {
  throw new Error('Usage: confirmatory-incremental-session.mjs --tool TOOL --workspace DIR --evidence-dir NEW-DIR --workload NAME [--target FILE --edit-mode append|memos|excalidraw --workspace-seal FILE --host-gate FILE --correctness-only]');
}
if (process.version !== 'v24.14.0') throw new Error(`expected Node v24.14.0, received ${process.version}`);
if (!correctnessOnly && process.platform !== 'darwin') throw new Error('primary M3 timing requires macOS');
if (![startupTimeoutMs, updateTimeoutMs].every(value => Number.isFinite(value) && value > 0)) throw new Error('timeouts must be positive milliseconds');
const workspace = fs.realpathSync(workspaceArg);
const evidenceDir = path.resolve(evidenceDirArg);
if (fs.existsSync(evidenceDir)) throw new Error('Refusing to overwrite incremental session evidence');
fs.mkdirSync(evidenceDir, { recursive: true });
const reportPath = path.join(evidenceDir, 'session.json');
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let workspaceSeal = null;
if (!correctnessOnly) {
  const freezePath = path.join(repository, 'protocols/confirmatory-v2-cloud/FREEZE.json');
  if (!fs.existsSync(freezePath)) throw new Error('primary M3 collection is locked until confirmatory-v2-cloud is frozen');
  const freeze = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
  const executorRelative = 'scripts/confirmatory-incremental-session.mjs';
  const executorExpected = freeze.files?.[executorRelative];
  const executorActual = createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex');
  if (freeze.protocol !== 'confirmatory-v2-cloud-m1' || !executorExpected || executorActual !== executorExpected) throw new Error('primary M3 executor does not match the frozen protocol manifest');
  if (!options['workspace-seal']) throw new Error('primary M3 collection requires --workspace-seal');
  workspaceSeal = verifyCloudCellWorkspace({ workspace, seal: options['workspace-seal'], repository });
  if (!workspaceSeal.passed) throw new Error(workspaceSeal.errors.join('; '));
  fs.copyFileSync(options['workspace-seal'], path.join(evidenceDir, 'workspace-seal.json'), fs.constants.COPYFILE_EXCL);
  if (!options['host-gate']) throw new Error('primary M3 collection requires --host-gate');
  const hostGate = JSON.parse(fs.readFileSync(options['host-gate'], 'utf8'));
  if (hostGate.pass !== true) throw new Error('pre-block host gate did not pass');
  fs.copyFileSync(options['host-gate'], path.join(evidenceDir, 'pre-block-host.json'), fs.constants.COPYFILE_EXCL);
}
const target = path.resolve(workspace, targetArg);
if (!target.startsWith(`${workspace}${path.sep}`) || !fs.existsSync(target)) throw new Error('Target must be an existing file inside the workspace');
const original = fs.readFileSync(target);
const originalText = original.toString('utf8');
const realworldAnchors = {
  memos: 'className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-accent/50 px-3 py-2 text-[13px] leading-relaxed text-muted-foreground"',
  excalidraw: 'data-testid="main-menu-trigger"',
};
if (editMode !== 'append' && originalText.split(realworldAnchors[editMode]).length !== 2) {
  throw new Error(`Expected one reviewed ${editMode} edit anchor in ${targetArg}`);
}
function editedSource(marker) {
  if (editMode === 'memos') {
    return Buffer.from(originalText.replace(realworldAnchors.memos, realworldAnchors.memos.replace('mt-4 ', `mt-4 ${marker} `)));
  }
  if (editMode === 'excalidraw') {
    return Buffer.from(originalText.replace(realworldAnchors.excalidraw, `${realworldAnchors.excalidraw} data-benchmark-marker="${marker}"`));
  }
  return Buffer.concat([original, Buffer.from(`\n;globalThis[${JSON.stringify(`__${marker}`)}] = ${JSON.stringify(marker)};\n`)]);
}
const hash = value => createHash('sha256').update(value).digest('hex');
const originalHash = hash(original);
const logPath = path.join(evidenceDir, 'watch.log');
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
  rspack: /compiled (?:successfully|with \d+ warnings?)/i,
  esbuild: /initial build finished \(0 errors\)/i,
  webpack: /compiled (?:successfully|with \d+ warnings?)/i,
  rollup: /created .+ in /i,
};
const [command, args] = commands[tool];
const report = {
  schemaVersion: 1,
  kind: correctnessOnly ? 'confirmatory-m3-session-correctness-control' : 'confirmatory-m3-session',
  publicationEligible: false,
  newPrimaryMeasurements: correctnessOnly ? 0 : 1,
  metric: 'M3',
  workload,
  tool,
  node: process.version,
  target: targetArg,
  editMode,
  targetSha256Before: originalHash,
  lockSha256: fs.existsSync(path.join(workspace, 'package-lock.json')) ? hash(fs.readFileSync(path.join(workspace, 'package-lock.json'))) : null,
  command: [path.basename(command), ...args],
  correctnessOnly,
  untimedWarmupUpdates: 1,
  measuredUpdatesPlanned: 5,
  workspaceSealVerified: correctnessOnly ? null : true,
  checks: {},
  edits: [],
  errors: [],
  passed: false,
};

function outputHas(marker) {
  const output = path.join(workspace, 'dist');
  if (!fs.existsSync(output)) return false;
  const currentFilesManifest = path.join(output, '.benchmark-current-files.json');
  if (fs.existsSync(currentFilesManifest)) {
    const currentFiles = JSON.parse(fs.readFileSync(currentFilesManifest, 'utf8'));
    if (!Array.isArray(currentFiles) || currentFiles.some((filename) => typeof filename !== 'string')) {
      throw new Error('Invalid current-output manifest');
    }
    return currentFiles.some((filename) => {
      const resolved = path.resolve(output, filename);
      return resolved.startsWith(`${output}${path.sep}`) && fs.existsSync(resolved) && fs.readFileSync(resolved, 'utf8').includes(marker);
    });
  }
  const html = path.join(output, 'index.html');
  // Webpack and Rspack encode lazy-chunk relationships in runtime tables rather
  // than static import specifiers. Scan their emitted JS set; a unique marker
  // must also disappear after the restoration build, so orphaned stale chunks
  // cannot create a passing cycle.
  if (fs.existsSync(html) && !['rspack', 'webpack'].includes(tool)) {
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
}, startupTimeoutMs);
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
  for (let edit = 0; edit <= 5; edit += 1) {
    const phase = edit === 0 ? 'warmup' : 'measured';
    const marker = `confirmatory_m3_${phase}_${tool}_${edit}`;
    if (original.includes(marker) || outputHas(marker)) throw new Error(`marker ${marker} existed before edit`);
    const modified = editedSource(marker);
    const probe = gate.arm({ marker, markerPresent: outputHas, timeoutMs: updateTimeoutMs });
    fs.writeFileSync(target, modified);
    const completion = await probe.promise;
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!outputHas(marker)) throw new Error(`marker ${marker} disappeared before settle check`);
    const revert = gate.arm({ marker: `revert-${marker}`, markerPresent: async () => !outputHas(marker), timeoutMs: updateTimeoutMs });
    fs.writeFileSync(target, original);
    await revert.promise;
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (outputHas(marker)) throw new Error(`marker ${marker} survived source restoration rebuild`);
    report.edits.push({
      edit,
      phase,
      marker,
      ...(correctnessOnly ? { diagnosticDurationMs: completion.durationMs } : edit === 0 ? {} : { durationMs: completion.durationMs }),
      postEditSuccess: true,
      markerObserved: true,
      sourceRestorationRebuilt: true,
      staleSuccessesIgnored: completion.unmatchedSuccesses,
      completionLine: completion.completionLine,
    });
  }
  report.checks.oneWarmupAndFiveMeasuredCycles = report.edits.length === 6 && report.edits[0].phase === 'warmup' && report.edits.slice(1).every(edit => edit.phase === 'measured') && report.edits.every(edit => edit.postEditSuccess && edit.markerObserved && edit.sourceRestorationRebuilt);
  if (!correctnessOnly) {
    const measured = report.edits.slice(1).map(edit => edit.durationMs);
    const ordered = [...measured].sort((a, b) => a - b);
    report.outcomes = { measuredUpdateMs: measured, sessionMedianMs: ordered[Math.floor(ordered.length / 2)] };
  }
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
  if (workspaceSeal) {
    report.postMeasurementWorkspaceSeal = verifyCloudCellWorkspace({ workspace, seal: options['workspace-seal'], repository });
    report.checks.workspaceSealRestored = report.postMeasurementWorkspaceSeal.passed;
  }
  report.passed = report.passed && Object.values(report.checks).every(Boolean) && report.errors.length === 0;
  const files = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) walk(filename);
      else if (entry.isFile()) {
        const bytes = fs.readFileSync(filename);
        files.push({ path: path.relative(evidenceDir, filename).split(path.sep).join('/'), bytes: bytes.length, sha256: hash(bytes) });
      }
    }
  };
  walk(evidenceDir);
  report.files = files;
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
}

console.log(JSON.stringify({ tool, workload, correctnessOnly, passed: report.passed, checks: report.checks, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
