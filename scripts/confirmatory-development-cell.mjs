#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';
import { acceptDevelopmentReadinessCell, hashTree, processGroupAlive } from './confirmatory-cell-acceptance.mjs';
import { verifyConfirmatoryWorkspace } from './confirmatory-workspace-contract.mjs';
import { verifyCloudCellWorkspace } from './cloud-cell-workspace-seal.mjs';

const tools = new Set(['vite', 'rspack', 'webpack']);
const workloads = new Set(['xs-50', 'm-500', 'xl-5000', 'bulletproof-react', 'memos', 'excalidraw']);
const ignoredSourceNames = ['dist', 'node_modules', '.vite', '.rspack', '.cache'];
const sha256 = value => createHash('sha256').update(value).digest('hex');

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

async function reservePort() {
  const server = http.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function stopGroup(child, graceMs = 30_000) {
  if (!child?.pid) return { stopped: true, cleanupRequired: false };
  let cleanupRequired = processGroupAlive(child.pid);
  if (cleanupRequired) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    const deadline = Date.now() + graceMs;
    while (Date.now() < deadline && processGroupAlive(child.pid)) await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (processGroupAlive(child.pid)) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch {}
    for (let attempt = 0; attempt < 100 && processGroupAlive(child.pid); attempt++) await new Promise(resolve => setTimeout(resolve, 25));
  }
  return { stopped: !processGroupAlive(child.pid), cleanupRequired };
}

function removeDeclaredCaches(workspace) {
  for (const relative of ['dist', '.vite', '.rspack', '.cache', 'node_modules/.cache', 'node_modules/.vite']) {
    fs.rmSync(path.join(workspace, relative), { recursive: true, force: true });
  }
}

function verifyDevelopmentWorkspace(workload, tool, workspace) {
  if (['memos', 'excalidraw'].includes(workload)) {
    const command = workload === 'memos' ? ['npm', ['run', 'verify']] : [process.execPath, ['verify-profile.mjs']];
    const result = spawnSync(command[0], command[1], { cwd: workspace, encoding: 'utf8', timeout: 600_000 });
    if (result.error || result.status !== 0) throw new Error(`${workload} profile verification failed: ${result.error?.message ?? result.stderr ?? result.stdout}`.trim());
    return;
  }
  const receipt = JSON.parse(fs.readFileSync(path.join(workspace, 'DEVELOPMENT_PROFILE.json'), 'utf8'));
  const kind = workload === 'bulletproof-react' ? 'realworld' : 'synthetic';
  if (receipt.id !== 'development-v1' || receipt.kind !== kind || receipt.tool !== tool) throw new Error('development profile receipt does not match the cell');
}

async function startMemosBackend(binary, evidenceDir) {
  const port = await reservePort();
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'confirmatory-m1-memos-'));
  const logPath = path.join(evidenceDir, 'memos-backend.log');
  const log = fs.openSync(logPath, 'wx');
  const child = spawn(fs.realpathSync(binary), ['--addr', '127.0.0.1', '--port', String(port), '--data', data, '--driver', 'sqlite'], { detached: true, stdio: ['ignore', log, log] });
  const origin = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 240; attempt++) {
    if (child.exitCode !== null) throw new Error('Memos backend exited before readiness');
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) return { child, data, log, origin }; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  await stopGroup(child);
  fs.closeSync(log);
  fs.rmSync(data, { recursive: true, force: true });
  throw new Error('Memos backend readiness timeout');
}

async function startBulletproofApi(frontendPort) {
  const port = await reservePort();
  const server = http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', `http://127.0.0.1:${frontendPort}`);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Content-Type', 'application/json');
    if (request.method === 'OPTIONS') { response.writeHead(204).end(); return; }
    if (new URL(request.url, 'http://localhost').pathname === '/api/auth/me') { response.end('{"data":null}'); return; }
    response.writeHead(404).end('{}');
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { server, origin: `http://127.0.0.1:${port}/api` };
}

function readinessSpec(workload) {
  if (workload === 'bulletproof-react') return { route: '/auth/register', selector: 'input[name="firstName"]' };
  if (workload === 'memos') return { route: '/', selector: '#signup-username' };
  if (workload === 'excalidraw') return { route: '/', selector: '.excalidraw canvas.interactive' };
  return { route: '/', selector: 'h1', text: 'TaskBoard' };
}

export async function collectDevelopmentReadinessCell(options) {
  if (process.version !== 'v24.14.0') throw new Error(`expected Node v24.14.0, received ${process.version}`);
  if (!workloads.has(options.workload) || !tools.has(options.tool)) throw new Error('unknown workload or tool');
  const workspaceRoot = fs.realpathSync(options.workspaceRoot);
  const workspace = fs.realpathSync(options.workspace ?? path.join(workspaceRoot, 'development', options.workload, options.tool));
  let cloudSeal = null;
  if (!options.correctnessOnly) {
    if (process.platform !== 'darwin') throw new Error('primary M1 timing requires macOS');
    cloudSeal = options.cloudWorkspaceSealPath
      ? verifyCloudCellWorkspace({ workspace, seal: options.cloudWorkspaceSealPath })
      : null;
    const sealed = cloudSeal ?? verifyConfirmatoryWorkspace(workspaceRoot, `development/${options.workload}/${options.tool}`);
    if (!sealed.passed) throw new Error(sealed.errors.join('; '));
  }
  const evidenceDir = path.resolve(options.evidenceDir);
  if (fs.existsSync(evidenceDir)) throw new Error(`refusing to overwrite evidence: ${evidenceDir}`);
  fs.mkdirSync(evidenceDir, { recursive: true });
  if (!options.correctnessOnly) fs.copyFileSync(options.cloudWorkspaceSealPath ?? path.join(workspaceRoot, 'confirmatory-workspaces.json'), path.join(evidenceDir, 'workspace-seal.json'), fs.constants.COPYFILE_EXCL);
  if (options.hostGatePath) {
    const gate = JSON.parse(fs.readFileSync(options.hostGatePath, 'utf8'));
    if (gate.pass !== true) throw new Error('pre-block host gate did not pass');
    fs.copyFileSync(options.hostGatePath, path.join(evidenceDir, 'pre-block-host.json'), fs.constants.COPYFILE_EXCL);
  }
  const evidence = {
    schemaVersion: 1,
    kind: options.correctnessOnly ? 'confirmatory-m1-executor-correctness' : 'confirmatory-development-readiness-cell',
    publicationEligible: false,
    newPrimaryMeasurements: options.correctnessOnly ? 0 : 1,
    metric: 'M1', workload: options.workload, tool: options.tool, runtime: process.version,
    workspace, accepted: false, correctnessOnly: Boolean(options.correctnessOnly),
    workspaceSealKind: options.correctnessOnly ? null : cloudSeal ? 'confirmatory-v2-cloud-cell-workspace-seal' : 'confirmatory-primary-workspace-seal',
    cachePolicy: { removed: ['dist', '.vite', '.rspack', '.cache', 'node_modules/.cache', 'node_modules/.vite'], operatingSystemPageCacheDropped: false },
  };
  let browser;
  let page;
  let server;
  let serverLog;
  let backend;
  let api;
  let readinessObservedNs;
  let processStartedNs;
  let cleanupRequired = false;
  try {
    verifyDevelopmentWorkspace(options.workload, options.tool, workspace);
    removeDeclaredCaches(workspace);
    evidence.sourceBeforeSha256 = hashTree(workspace, new Set(ignoredSourceNames));
    const frontendPort = await reservePort();
    if (options.workload === 'memos') {
      if (!options.memosBackend) throw new Error('Memos readiness requires --memos-backend');
      backend = await startMemosBackend(options.memosBackend, evidenceDir);
    }
    if (options.workload === 'bulletproof-react') api = await startBulletproofApi(frontendPort);
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined });
    page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.setRequestInterception(true);
    const origin = `http://127.0.0.1:${frontendPort}`;
    page.on('request', request => {
      const url = request.url();
      if (url.startsWith(origin) || (api && url.startsWith(api.origin)) || /^(data:|blob:)/.test(url)) request.continue();
      else if (request.resourceType() === 'script') request.respond({ status: 200, contentType: 'text/javascript', body: '' });
      else request.abort();
    });
    const environment = { ...process.env, NODE_ENV: 'development' };
    if (backend) environment.MEMOS_BACKEND_ORIGIN = backend.origin;
    if (api) {
      environment.VITE_APP_API_URL = api.origin;
      environment.VITE_APP_ENABLE_API_MOCKING = 'false';
    }
    serverLog = fs.openSync(path.join(evidenceDir, 'development-server.log'), 'wx');
    const args = ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort), ...(options.tool === 'vite' ? ['--strictPort'] : [])];
    processStartedNs = process.hrtime.bigint();
    server = spawn('npm', args, { cwd: workspace, env: environment, detached: true, stdio: ['ignore', serverLog, serverLog] });
    let serverSpawnError;
    server.once('error', error => { serverSpawnError = error; });
    evidence.command = { executable: 'npm', args, cwd: workspace };
    const deadline = Date.now() + Number(options.timeoutMs ?? 300_000);
    let httpReady = false;
    while (Date.now() < deadline) {
      if (serverSpawnError) throw serverSpawnError;
      if (server.exitCode !== null) throw new Error('development server exited before readiness');
      try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) { httpReady = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    if (!httpReady) throw new Error('development server HTTP readiness timeout');
    const spec = readinessSpec(options.workload);
    await page.goto(origin + spec.route, { waitUntil: 'domcontentloaded', timeout: Math.max(1, deadline - Date.now()) });
    await page.waitForSelector(spec.selector, { visible: true, timeout: Math.max(1, deadline - Date.now()) });
    if (spec.text) await page.waitForFunction((selector, text) => document.querySelector(selector)?.textContent?.includes(text), { timeout: Math.max(1, deadline - Date.now()) }, spec.selector, spec.text);
    await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
    readinessObservedNs = process.hrtime.bigint();
    evidence.serverAliveAtReadiness = server.exitCode === null && processGroupAlive(server.pid);
    if (!evidence.serverAliveAtReadiness) throw new Error('development server was not alive at browser readiness');
    const readinessReport = { passed: pageErrors.length === 0, httpReady, applicationReady: true, route: spec.route, selector: spec.selector, pageErrors };
    fs.writeFileSync(path.join(evidenceDir, 'browser-readiness.json'), `${JSON.stringify(readinessReport, null, 2)}\n`, { flag: 'wx' });
    if (!readinessReport.passed) throw new Error(`browser page errors: ${pageErrors.join('; ')}`);
  } catch (error) {
    evidence.error = error.message;
  } finally {
    if (page && evidence.error) {
      await page.screenshot({ path: path.join(evidenceDir, 'failure.png') }).catch(() => {});
      fs.writeFileSync(path.join(evidenceDir, 'failure.html'), await page.content().catch(() => ''), { flag: 'wx' });
    }
    if (browser) await browser.close().catch(() => {});
    if (server) {
      const stopped = await stopGroup(server);
      cleanupRequired ||= stopped.cleanupRequired && !stopped.stopped;
      if (!stopped.stopped) evidence.error ??= 'development server process group did not terminate';
    }
    if (backend?.child) {
      const stopped = await stopGroup(backend.child);
      if (!stopped.stopped) evidence.error ??= 'Memos backend process group did not terminate';
      fs.closeSync(backend.log);
      fs.rmSync(backend.data, { recursive: true, force: true });
    }
    if (api?.server) await new Promise(resolve => api.server.close(resolve));
    if (serverLog !== undefined) fs.closeSync(serverLog);
  }
  try {
    if (evidence.error) throw new Error(evidence.error);
    const accepted = acceptDevelopmentReadinessCell({
      sourceRoot: workspace,
      sourceBeforeSha256: evidence.sourceBeforeSha256,
      ignoredSourceNames,
      processGroupPid: server.pid,
      processStartedNs: String(processStartedNs),
      readinessObservedNs: String(readinessObservedNs),
      processCleanupRequired: cleanupRequired,
      readinessReportPath: path.join(evidenceDir, 'browser-readiness.json'),
      declaredCachesCleared: true,
    });
    evidence.accepted = accepted.accepted;
    evidence.sourceAfterSha256 = accepted.sourceAfterSha256;
    evidence.processTreeStopped = accepted.processTreeStopped;
    evidence.browserReadinessValidated = accepted.browserReadinessValidated;
    if (cloudSeal) {
      const postMeasurementSeal = verifyCloudCellWorkspace({ workspace, seal: options.cloudWorkspaceSealPath });
      evidence.postMeasurementWorkspaceSeal = postMeasurementSeal;
      if (!postMeasurementSeal.passed) throw new Error(`post-measurement cloud workspace seal failed: ${postMeasurementSeal.errors.join('; ')}`);
    }
    if (!options.correctnessOnly) evidence.outcomes = accepted.outcomes;
  } catch (error) { evidence.accepted = false; evidence.error ??= error.message; }
  const files = [];
  const walk = current => { for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const filename = path.join(current, entry.name); if (entry.isDirectory()) walk(filename); else if (entry.isFile()) { const bytes = fs.readFileSync(filename); files.push({ path: path.relative(evidenceDir, filename).split(path.sep).join('/'), bytes: bytes.length, sha256: sha256(bytes) }); } } };
  walk(evidenceDir);
  evidence.files = files;
  fs.writeFileSync(path.join(evidenceDir, 'cell.json'), `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' });
  if (!evidence.accepted) throw new Error(evidence.error ?? 'M1 cell was not accepted');
  return evidence;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const name of ['workspace-root', 'evidence-dir', 'workload', 'tool']) if (!args[name]) throw new Error(`missing --${name}`);
  const result = await collectDevelopmentReadinessCell({
    workspaceRoot: args['workspace-root'], workspace: args.workspace, evidenceDir: args['evidence-dir'],
    workload: args.workload, tool: args.tool, memosBackend: args['memos-backend'],
    timeoutMs: args['timeout-ms'], hostGatePath: args['host-gate'], correctnessOnly: args['correctness-only'],
    cloudWorkspaceSealPath: args['cloud-workspace-seal'],
  });
  console.log(JSON.stringify({ accepted: result.accepted, correctnessOnly: result.correctnessOnly, workload: result.workload, tool: result.tool, outcomes: result.outcomes }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(`ERROR: ${error.message}`); process.exit(1); });
