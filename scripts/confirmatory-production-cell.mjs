#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { acceptProductionBuildCell, hashTree, processGroupAlive } from './confirmatory-cell-acceptance.mjs';
import { verifyConfiguration } from './verify-production-configuration.mjs';
import { verifyConfirmatoryWorkspace } from './confirmatory-workspace-contract.mjs';
import { verifyCloudCellWorkspace } from './cloud-cell-workspace-seal.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = new Set(['vite', 'rspack', 'esbuild', 'webpack', 'rollup']);
const workloads = new Set(['xs-50', 's-200', 'm-500', 'l-2000', 'xl-5000', 'bulletproof-react', 'memos', 'excalidraw']);
const ignoredSourceNames = ['dist', 'node_modules', '.vite', '.rspack', '.cache'];
const sha256 = value => createHash('sha256').update(value).digest('hex');

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith('--') || argv[index + 1] === undefined) throw new Error('arguments must be --name value pairs');
    result[argv[index].slice(2)] = argv[index + 1];
  }
  return result;
}

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: repository, encoding: 'utf8', timeout: 600_000, ...options });
  if (result.error || result.status !== 0) throw new Error(`${options.label ?? command} failed: ${result.error?.message ?? result.stderr ?? result.stdout}`.trim());
  return result;
}

function requireInside(root, candidate, label) {
  const resolvedRoot = fs.realpathSync(root);
  const resolved = fs.realpathSync(candidate);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error(`${label} escapes the configured workspace root`);
  return resolved;
}

function removeDeclaredCaches(workspace) {
  for (const relative of ['dist', '.vite', '.rspack', '.cache', 'node_modules/.cache']) {
    fs.rmSync(path.join(workspace, relative), { recursive: true, force: true });
  }
}

async function timedBuild(workspace, script, stdoutPath, stderrPath, timeoutMs) {
  const stdout = fs.openSync(stdoutPath, 'wx');
  const stderr = fs.openSync(stderrPath, 'wx');
  const startedNs = process.hrtime.bigint();
  const child = spawn('/usr/bin/time', ['-l', 'npm', 'run', script], {
    cwd: workspace,
    detached: true,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', stdout, stderr],
  });
  let timedOut = false;
  let forceTimer;
  const timer = setTimeout(() => {
    timedOut = true;
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    forceTimer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 30_000);
  }, timeoutMs);
  const completion = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  }).finally(() => {
    clearTimeout(timer);
    clearTimeout(forceTimer);
    fs.closeSync(stdout);
    fs.closeSync(stderr);
  });
  const completedNs = process.hrtime.bigint();
  let cleanupRequired = processGroupAlive(child.pid);
  if (cleanupRequired) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch {}
    for (let attempt = 0; attempt < 100 && processGroupAlive(child.pid); attempt += 1) await new Promise(resolve => setTimeout(resolve, 25));
  }
  return { pid: child.pid, startedNs, completedNs, timedOut, cleanupRequired, ...completion };
}

function verifyPreparedWorkspace(workload, workspace) {
  if (workload === 'memos') runChecked('npm', ['run', 'verify'], { cwd: workspace, label: 'Memos profile verification' });
  else if (workload === 'excalidraw') runChecked(process.execPath, ['verify-profile.mjs'], { cwd: workspace, label: 'Excalidraw profile verification' });
  else {
    const verified = verifyConfiguration(path.dirname(workspace));
    if (!verified.passed) throw new Error(`production profile verification failed: ${verified.errors.join('; ')}`);
  }
}

function validationCommands(workload, workspace, evidenceDir, upstreamRoot, backend) {
  const dist = path.join(workspace, 'dist');
  const contractReport = path.join(evidenceDir, 'output-contract.json');
  const browserDir = path.join(evidenceDir, 'browser');
  const browserReport = ['memos', 'excalidraw'].includes(workload) ? path.join(browserDir, 'browser.json') : path.join(evidenceDir, 'browser.json');
  const contractScript = workload === 'memos' ? 'check-memos-adapter-output.mjs' : workload === 'excalidraw' ? 'check-excalidraw-adapter-output.mjs' : 'check-production-contract.mjs';
  let browserArgs;
  if (workload === 'memos') {
    if (!backend) throw new Error('--memos-backend is required for the Memos browser gate');
    browserArgs = ['scripts/check-memos-browser.mjs', upstreamRoot, fs.realpathSync(backend), browserDir, dist];
  } else if (workload === 'excalidraw') browserArgs = ['scripts/check-excalidraw-browser.mjs', dist, browserDir, upstreamRoot];
  else browserArgs = [`scripts/check-${workload === 'bulletproof-react' ? 'realworld' : 'production'}-browser.mjs`, dist, browserReport];
  return {
    contractReport,
    browserReport,
    contract: [process.execPath, [`scripts/${contractScript}`, dist, contractReport]],
    browser: [process.execPath, browserArgs],
  };
}

export async function collectProductionCell(options) {
  if (process.platform !== 'darwin') throw new Error('primary production timing requires macOS /usr/bin/time -l');
  if (process.version !== 'v24.14.0') throw new Error(`expected Node v24.14.0, received ${process.version}`);
  if (!workloads.has(options.workload) || !tools.has(options.tool)) throw new Error('unknown workload or tool');
  const workspaceRoot = fs.realpathSync(options.workspaceRoot);
  const workspace = requireInside(workspaceRoot, options.workspace ?? path.join(workspaceRoot, 'production', options.workload, options.tool), 'tool workspace');
  const cloudSeal = options.cloudWorkspaceSealPath
    ? verifyCloudCellWorkspace({ workspace, seal: options.cloudWorkspaceSealPath, repository })
    : null;
  const sealed = cloudSeal ?? verifyConfirmatoryWorkspace(workspaceRoot, `production/${options.workload}/${options.tool}`);
  if (!sealed.passed) throw new Error(sealed.errors.join('; '));
  const upstreamRoot = ['memos', 'excalidraw'].includes(options.workload)
    ? requireInside(workspaceRoot, path.join(workspaceRoot, '_sources', options.workload), 'upstream source')
    : null;
  const sourceRoot = workspace;
  const evidenceDir = path.resolve(options.evidenceDir);
  if (fs.existsSync(evidenceDir)) throw new Error(`refusing to overwrite evidence: ${evidenceDir}`);
  fs.mkdirSync(evidenceDir, { recursive: true });
  const workspaceSealPath = options.cloudWorkspaceSealPath ?? path.join(workspaceRoot, 'confirmatory-workspaces.json');
  const workspaceSealBytes = fs.readFileSync(workspaceSealPath);
  fs.writeFileSync(path.join(evidenceDir, 'workspace-seal.json'), workspaceSealBytes, { flag: 'wx' });
  let hostGate = null;
  if (options.hostGatePath) {
    hostGate = JSON.parse(fs.readFileSync(options.hostGatePath, 'utf8'));
    if (hostGate.pass !== true) throw new Error('pre-block host gate did not pass');
    fs.copyFileSync(options.hostGatePath, path.join(evidenceDir, 'pre-block-host.json'));
  }
  const evidence = {
    schemaVersion: 1,
    kind: 'confirmatory-production-build-cell',
    publicationEligible: false,
    metricFamily: 'M2-M10-M11',
    workload: options.workload,
    tool: options.tool,
    runtime: process.version,
    workspace,
    sourceRoot,
    upstreamRoot,
    cachePolicy: { removed: ['dist', '.vite', '.rspack', '.cache', 'node_modules/.cache'], operatingSystemPageCacheDropped: false },
    accepted: false,
    workspaceSealVerified: true,
    workspaceSealKind: cloudSeal ? 'confirmatory-v2-cloud-cell-workspace-seal' : 'confirmatory-primary-workspace-seal',
    workspaceSealSha256: sha256(workspaceSealBytes),
    preBlockHostGate: hostGate ? { capturedAt: hostGate.capturedAt, fingerprintSha256: hostGate.fingerprintSha256, passed: true } : null,
  };
  try {
    verifyPreparedWorkspace(options.workload, workspace);
    removeDeclaredCaches(workspace);
    evidence.sourceBeforeSha256 = hashTree(sourceRoot, new Set(ignoredSourceNames));
    const buildScript = options.workload === 'excalidraw' ? 'benchmark:build' : 'build';
    evidence.command = { executable: '/usr/bin/time', args: ['-l', 'npm', 'run', buildScript], cwd: workspace };
    evidence.startedAt = new Date().toISOString();
    const build = await timedBuild(workspace, buildScript, path.join(evidenceDir, 'build.stdout.log'), path.join(evidenceDir, 'build.stderr-and-time.log'), Number(options.timeoutMs ?? 1_200_000));
    evidence.completedAt = new Date().toISOString();
    evidence.process = {
      groupPid: build.pid,
      exitCode: build.code,
      signal: build.signal,
      timedOut: build.timedOut,
      cleanupRequired: build.cleanupRequired,
      startedNs: String(build.startedNs),
      completedNs: String(build.completedNs),
    };
    if (build.timedOut) throw new Error('production build timed out');
    const validation = validationCommands(options.workload, workspace, evidenceDir, upstreamRoot, options.memosBackend);
    if (build.code === 0 && build.cleanupRequired === false) {
      runChecked(...validation.contract, { label: 'output contract validation' });
      runChecked(...validation.browser, { label: 'browser validation', timeout: 600_000, env: process.env });
    }
    const accepted = acceptProductionBuildCell({
      sourceRoot,
      sourceBeforeSha256: evidence.sourceBeforeSha256,
      ignoredSourceNames,
      processGroupPid: build.pid,
      processStartedNs: String(build.startedNs),
      processCompletedNs: String(build.completedNs),
      processCleanupRequired: build.cleanupRequired,
      buildExitCode: build.code,
      timingText: fs.readFileSync(path.join(evidenceDir, 'build.stderr-and-time.log'), 'utf8'),
      contractReportPath: validation.contractReport,
      browserReportPath: validation.browserReport,
    });
    Object.assign(evidence, accepted);
    if (cloudSeal) {
      const postMeasurementSeal = verifyCloudCellWorkspace({ workspace, seal: options.cloudWorkspaceSealPath, repository });
      evidence.postMeasurementWorkspaceSeal = postMeasurementSeal;
      if (!postMeasurementSeal.passed) throw new Error(`post-measurement cloud workspace seal failed: ${postMeasurementSeal.errors.join('; ')}`);
    }
  } catch (error) {
    evidence.accepted = false;
    evidence.error = error.message;
  }
  const evidenceFiles = [];
  const walkEvidence = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) walkEvidence(filename);
      else if (entry.isFile()) {
        const bytes = fs.readFileSync(filename);
        evidenceFiles.push({ path: path.relative(evidenceDir, filename).split(path.sep).join('/'), bytes: bytes.length, sha256: sha256(bytes) });
      }
    }
  };
  walkEvidence(evidenceDir);
  evidence.files = evidenceFiles;
  fs.writeFileSync(path.join(evidenceDir, 'cell.json'), `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' });
  if (!evidence.accepted) throw new Error(evidence.error ?? 'production cell was not accepted');
  return evidence;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const name of ['workspace-root', 'evidence-dir', 'workload', 'tool']) if (!args[name]) throw new Error(`missing --${name}`);
  const result = await collectProductionCell({
    workspaceRoot: args['workspace-root'],
    workspace: args.workspace,
    evidenceDir: args['evidence-dir'],
    workload: args.workload,
    tool: args.tool,
    memosBackend: args['memos-backend'],
    timeoutMs: args['timeout-ms'],
    hostGatePath: args['host-gate'],
    cloudWorkspaceSealPath: args['cloud-workspace-seal'],
  });
  console.log(JSON.stringify({ accepted: result.accepted, workload: result.workload, tool: result.tool, outcomes: result.outcomes }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(`ERROR: ${error.message}`); process.exit(1); });
}
