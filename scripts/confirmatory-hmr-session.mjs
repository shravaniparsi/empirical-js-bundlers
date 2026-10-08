#!/usr/bin/env node
/** M4 session collector: one untimed HMR update plus five measured state-preserving updates. */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { verifyCloudCellWorkspace } from './cloud-cell-workspace-seal.mjs';
import { acceptHmrUpdate, acceptReloadDetector } from './hmr-session-acceptance.mjs';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
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
const workload = options.workload;
const correctnessOnly = Boolean(options['correctness-only']);
const startupTimeoutMs = Number(options['startup-timeout-ms'] ?? 600_000);
const updateTimeoutMs = Number(options['update-timeout-ms'] ?? 120_000);
const supportedWorkloads = ['xs-50', 'm-500', 'xl-5000', 'bulletproof-react', 'memos', 'excalidraw'];
if (!['vite', 'rspack', 'webpack'].includes(tool) || !supportedWorkloads.includes(workload) || !options.workspace || !options['evidence-dir']) {
  throw new Error('Usage: confirmatory-hmr-session.mjs --tool vite|rspack|webpack --workload NAME --workspace DIR --evidence-dir NEW-DIR [--memos-backend FILE --workspace-seal FILE --host-gate FILE --correctness-only]');
}
if (workload === 'memos' && !options['memos-backend']) throw new Error('Memos HMR requires --memos-backend');
if (process.version !== 'v24.14.0') throw new Error(`expected Node v24.14.0, received ${process.version}`);
if (!correctnessOnly && process.platform !== 'darwin') throw new Error('primary M4 timing requires macOS');
if (![startupTimeoutMs, updateTimeoutMs].every(value => Number.isFinite(value) && value > 0)) throw new Error('timeouts must be positive milliseconds');

const workspace = fs.realpathSync(options.workspace);
const evidenceDir = path.resolve(options['evidence-dir']);
if (fs.existsSync(evidenceDir)) throw new Error('Refusing to overwrite HMR session evidence');
fs.mkdirSync(evidenceDir, { recursive: true });
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = path.join(evidenceDir, 'session.json');
const sha256 = value => createHash('sha256').update(value).digest('hex');

let workspaceSeal = null;
if (!correctnessOnly) {
  const freezePath = path.join(repository, 'protocols/confirmatory-v2-cloud/FREEZE.json');
  if (!fs.existsSync(freezePath)) throw new Error('primary M4 collection is locked until confirmatory-v2-cloud is frozen');
  const freeze = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
  const frozenImplementation = [
    ['scripts/confirmatory-hmr-session.mjs', fileURLToPath(import.meta.url)],
    ['scripts/hmr-session-acceptance.mjs', path.join(repository, 'scripts/hmr-session-acceptance.mjs')],
  ];
  if (freeze.protocol !== 'confirmatory-v2-cloud-m1') throw new Error('primary M4 executor does not match the frozen protocol manifest');
  for (const [relative, filename] of frozenImplementation) {
    if (!freeze.files?.[relative] || sha256(fs.readFileSync(filename)) !== freeze.files[relative]) throw new Error(`primary M4 implementation does not match frozen file ${relative}`);
  }
  if (!options['workspace-seal']) throw new Error('primary M4 collection requires --workspace-seal');
  workspaceSeal = verifyCloudCellWorkspace({ workspace, seal: options['workspace-seal'], repository });
  if (!workspaceSeal.passed) throw new Error(workspaceSeal.errors.join('; '));
  fs.copyFileSync(options['workspace-seal'], path.join(evidenceDir, 'workspace-seal.json'), fs.constants.COPYFILE_EXCL);
  if (!options['host-gate']) throw new Error('primary M4 collection requires --host-gate');
  const hostGate = JSON.parse(fs.readFileSync(options['host-gate'], 'utf8'));
  if (hostGate.pass !== true) throw new Error('pre-block host gate did not pass');
  fs.copyFileSync(options['host-gate'], path.join(evidenceDir, 'pre-block-host.json'), fs.constants.COPYFILE_EXCL);
}

const profiles = {
  synthetic: {
    target: 'src/App.tsx', route: '/', stateSelector: 'input:not([type="hidden"]):not([disabled])',
    anchorPattern: /<h1(?:\s[^>]*)?>TaskBoard<\/h1>/,
    edit(source, marker) { return source.replace(this.anchorPattern, `<h1 data-benchmark-marker="${marker}">TaskBoard</h1>`); },
    markerSelector(marker) { return `[data-benchmark-marker="${marker}"]`; },
  },
  'bulletproof-react': {
    target: 'src/features/auth/components/register-form.tsx', route: '/auth/register', stateSelector: 'input[name="firstName"]',
    anchor: '<div className="mt-2 flex items-center justify-end">',
    edit(source, marker) { return source.replace(this.anchor, `<div data-benchmark-marker="${marker}" className="mt-2 flex items-center justify-end">`); },
    markerSelector(marker) { return `[data-benchmark-marker="${marker}"]`; },
  },
  memos: {
    target: 'src/pages/SignUp.tsx', route: '/',
    anchor: 'className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-accent/50 px-3 py-2 text-[13px] leading-relaxed text-muted-foreground"',
    edit(source, marker) { return source.replace(this.anchor, this.anchor.replace('mt-4 ', `mt-4 ${marker} `)); },
    markerSelector(marker) { return `.${marker}`; },
  },
  excalidraw: {
    target: 'packages/excalidraw/components/main-menu/MainMenu.tsx', route: '/',
    anchor: 'data-testid="main-menu-trigger"',
    edit(source, marker) { return source.replace(this.anchor, `data-testid="${marker}"`); },
    markerSelector(marker) { return `[data-testid="${marker}"]`; },
  },
};
const profile = profiles[workload] ?? profiles.synthetic;
const target = path.resolve(workspace, profile.target);
if (!target.startsWith(`${workspace}${path.sep}`) || !fs.statSync(target, { throwIfNoEntry: false })?.isFile()) throw new Error('HMR target is missing or outside the workspace');
const original = fs.readFileSync(target, 'utf8');
if (profile.anchor && original.split(profile.anchor).length !== 2) throw new Error(`Expected one reviewed edit anchor in ${profile.target}`);
if (profile.anchorPattern && [...original.matchAll(new RegExp(profile.anchorPattern.source, profile.anchorPattern.flags + (profile.anchorPattern.flags.includes('g') ? '' : 'g')))].length !== 1) throw new Error(`Expected one reviewed edit anchor in ${profile.target}`);
const originalHash = sha256(original);

const report = {
  schemaVersion: 1,
  kind: correctnessOnly ? 'confirmatory-m4-session-correctness-control' : 'confirmatory-m4-session',
  publicationEligible: false,
  newPrimaryMeasurements: correctnessOnly ? 0 : 1,
  metric: 'M4', workload, tool, node: process.version,
  target: profile.target, targetSha256Before: originalHash,
  lockSha256: sha256(fs.readFileSync(path.join(workspace, 'package-lock.json'))),
  correctnessOnly,
  untimedWarmupUpdates: 1,
  measuredUpdatesPlanned: 5,
  workspaceSealVerified: correctnessOnly ? null : true,
  checks: {}, edits: [], errors: [], consoleErrors: [], ignoredConsoleMessages: [], passed: false,
};

const reservePort = async () => {
  const server = http.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
};
const frontendPort = await reservePort();
const environment = { ...process.env, NODE_ENV: 'development', NO_COLOR: '1', FORCE_COLOR: '0' };
let backend;
let backendLog;
let dataDirectory;
let fixtureApi;

if (workload === 'memos') {
  const backendPort = await reservePort();
  dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'confirmatory-m4-memos-'));
  backendLog = fs.openSync(path.join(evidenceDir, 'backend.log'), 'wx');
  backend = spawn(fs.realpathSync(options['memos-backend']), ['--addr', '127.0.0.1', '--port', String(backendPort), '--data', dataDirectory, '--driver', 'sqlite'], { detached: true, stdio: ['ignore', backendLog, backendLog] });
  environment.MEMOS_BACKEND_ORIGIN = `http://127.0.0.1:${backendPort}`;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (backend.exitCode !== null) throw new Error('Memos backend exited before readiness');
    try { if ((await fetch(environment.MEMOS_BACKEND_ORIGIN, { signal: AbortSignal.timeout(1000) })).ok) break; } catch {}
    if (attempt === 239) throw new Error('Memos backend readiness timeout');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  report.checks.actualBackendReady = true;
}

if (workload === 'bulletproof-react') {
  const apiPort = await reservePort();
  fixtureApi = http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', `http://127.0.0.1:${frontendPort}`);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Content-Type', 'application/json');
    if (request.method === 'OPTIONS') { response.writeHead(204).end(); return; }
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/api/auth/me') { response.end(JSON.stringify({ data: null })); return; }
    report.errors.push(`Unexpected API request: ${request.method} ${pathname}`);
    response.writeHead(404).end('{}');
  });
  await new Promise(resolve => fixtureApi.listen(apiPort, '127.0.0.1', resolve));
  environment.VITE_APP_API_URL = `http://127.0.0.1:${apiPort}/api`;
  environment.VITE_APP_ENABLE_API_MOCKING = 'false';
  report.checks.fixtureApiReady = true;
}

const serverLogPath = path.join(evidenceDir, 'server.log');
const serverLog = fs.openSync(serverLogPath, 'wx');
const serverArgs = ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort), ...(tool === 'vite' ? ['--strictPort'] : [])];
report.command = ['npm', ...serverArgs];
const server = spawn('npm', serverArgs, { cwd: workspace, env: environment, detached: true, stdio: ['ignore', serverLog, serverLog] });
const origin = `http://127.0.0.1:${frontendPort}`;
const processGroupAlive = child => { try { process.kill(-child.pid, 0); return true; } catch { return false; } };
const stop = async child => {
  if (!child?.pid) return true;
  try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  for (let attempt = 0; attempt < 300 && processGroupAlive(child); attempt += 1) await new Promise(resolve => setTimeout(resolve, 100));
  if (processGroupAlive(child)) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
  for (let attempt = 0; attempt < 50 && processGroupAlive(child); attempt += 1) await new Promise(resolve => setTimeout(resolve, 100));
  return !processGroupAlive(child);
};

let browser;
let page;
let documentToken;
let initialState;
let navigations = 0;
const ignoredConsolePattern = /^Permissions policy violation: unload is not allowed in this document\.?$/;
const stateSnapshot = async () => {
  if (workload === 'memos') return page.evaluate(() => ({ username: document.querySelector('#signup-username')?.value, password: document.querySelector('#signup-password')?.value }));
  if (workload === 'excalidraw') return page.evaluate(id => JSON.parse(localStorage.getItem('excalidraw') || '[]').find(element => element.id === id), initialState?.id);
  return page.$eval(profile.stateSelector, element => element.value);
};
const stateMatches = observed => {
  if (workload === 'memos') return observed.username === initialState.username && observed.password === initialState.password;
  if (workload === 'excalidraw') return observed?.id === initialState.id && observed.x === initialState.x && observed.y === initialState.y;
  return observed === initialState;
};

try {
  const startupDeadline = Date.now() + startupTimeoutMs;
  let ready = false;
  while (Date.now() < startupDeadline && !ready) {
    if (server.exitCode !== null) throw new Error('Development server exited before readiness');
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok; } catch {}
    if (!ready) await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Development server readiness timeout');
  report.checks.developmentServerReady = true;

  browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined });
  report.browserVersion = await browser.version();
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  page.on('pageerror', error => report.consoleErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    if (workload === 'excalidraw' && ignoredConsolePattern.test(message.text())) report.ignoredConsoleMessages.push(message.text());
    else report.consoleErrors.push(`console: ${message.text()}`);
  });
  await page.goto(origin + profile.route, { waitUntil: 'networkidle0', timeout: startupTimeoutMs });

  if (workload === 'memos') {
    await page.waitForSelector('#signup-username', { visible: true, timeout: 60_000 });
    await page.type('#signup-username', 'hmr-state-sentinel');
    await page.type('#signup-password', 'Hmr-state-sentinel-7391');
  } else if (workload === 'excalidraw') {
    await page.waitForSelector('.excalidraw canvas.interactive', { timeout: 60_000 });
    await page.keyboard.press('r');
    await page.mouse.move(500, 400); await page.mouse.down(); await page.mouse.move(700, 540, { steps: 10 }); await page.mouse.up();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('excalidraw') || '[]').filter(element => !element.isDeleted && element.type === 'rectangle').length === 1);
  } else {
    await page.waitForSelector(profile.stateSelector, { visible: true, timeout: 60_000 });
    await page.type(profile.stateSelector, 'hmr-state-sentinel');
  }
  initialState = await stateSnapshot();
  if ((workload === 'memos' && (initialState.username !== 'hmr-state-sentinel' || initialState.password !== 'Hmr-state-sentinel-7391')) ||
      (workload === 'excalidraw' && !initialState?.id) ||
      (!['memos', 'excalidraw'].includes(workload) && initialState !== 'hmr-state-sentinel')) throw new Error('Application state was not established');
  if (report.consoleErrors.length) throw new Error(`Browser emitted ${report.consoleErrors.length} error(s) before the HMR cycles`);
  report.checks.applicationStateEstablished = true;
  documentToken = randomUUID();
  await page.evaluate(token => { window.__benchmarkDocumentToken = token; }, documentToken);
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations += 1; });

  for (let edit = 0; edit <= 5; edit += 1) {
    const phase = edit === 0 ? 'warmup' : 'measured';
    const marker = `confirmatory-m4-${phase}-${tool}-${edit}`;
    const selector = profile.markerSelector(marker);
    if (await page.$(selector)) throw new Error(`marker ${marker} existed before edit`);
    const errorsBefore = report.consoleErrors.length;
    const started = performance.now();
    fs.writeFileSync(target, profile.edit(original, marker));
    await page.waitForSelector(selector, { timeout: updateTimeoutMs });
    const durationMs = performance.now() - started;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const observation = {
      markerObserved: Boolean(await page.$(selector)),
      documentPreserved: await page.evaluate(token => window.__benchmarkDocumentToken === token, documentToken),
      statePreserved: stateMatches(await stateSnapshot()),
      navigations,
      settled: true,
      browserErrors: report.consoleErrors.length - errorsBefore,
      durationMs,
    };
    acceptHmrUpdate(observation);
    fs.writeFileSync(target, original);
    await page.waitForFunction(selectorValue => !document.querySelector(selectorValue), { timeout: updateTimeoutMs }, selector);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (await page.$(selector)) throw new Error(`marker ${marker} survived source restoration update`);
    if (report.consoleErrors.length !== errorsBefore) throw new Error(`Browser emitted an error during edit/revert cycle ${edit}`);
    const editReport = { edit, phase, marker, ...observation, sourceRestorationUpdated: true };
    if (correctnessOnly) editReport.diagnosticDurationMs = editReport.durationMs;
    if (correctnessOnly || edit === 0) delete editReport.durationMs;
    report.edits.push(editReport);
  }
  report.checks.oneWarmupAndFiveMeasuredCycles = report.edits.length === 6 && report.edits[0].phase === 'warmup' && report.edits.slice(1).every(edit => edit.phase === 'measured') && report.edits.every(edit => edit.markerObserved && edit.documentPreserved && edit.statePreserved && edit.navigations === 0 && edit.sourceRestorationUpdated);
  if (!correctnessOnly) {
    const measured = report.edits.slice(1).map(edit => edit.durationMs);
    const ordered = [...measured].sort((a, b) => a - b);
    report.outcomes = { measuredUpdateMs: measured, sessionMedianMs: ordered[Math.floor(ordered.length / 2)] };
  }
  const navigationsBeforeControl = navigations;
  await page.reload({ waitUntil: 'networkidle0', timeout: updateTimeoutMs });
  const reloadControl = {
    navigationObserved: navigations > navigationsBeforeControl,
    documentReplaced: await page.evaluate(token => window.__benchmarkDocumentToken !== token, documentToken),
  };
  acceptReloadDetector(reloadControl);
  if (report.consoleErrors.length) throw new Error(`Browser emitted ${report.consoleErrors.length} error(s) during the session`);
  report.reloadControl = reloadControl;
  report.checks.reloadControlDetected = true;
  report.passed = true;
} catch (error) {
  report.errors.push(error.message);
} finally {
  fs.writeFileSync(target, original);
  report.checks.sourceRestored = sha256(fs.readFileSync(target)) === originalHash;
  if (page && !report.passed) {
    fs.writeFileSync(path.join(evidenceDir, 'failure-page.html'), await page.content().catch(() => ''));
    await page.screenshot({ path: path.join(evidenceDir, 'failure-browser.png') }).catch(() => {});
  }
  if (browser) await browser.close();
  report.checks.developmentServerStopped = await stop(server);
  if (backend) report.checks.backendStopped = await stop(backend);
  if (fixtureApi) { await new Promise(resolve => fixtureApi.close(resolve)); report.checks.fixtureApiStopped = !fixtureApi.listening; }
  if (dataDirectory) fs.rmSync(dataDirectory, { recursive: true, force: true });
  fs.closeSync(serverLog);
  if (backendLog !== undefined) fs.closeSync(backendLog);
  report.targetSha256After = sha256(fs.readFileSync(target));
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
        files.push({ path: path.relative(evidenceDir, filename).split(path.sep).join('/'), bytes: bytes.length, sha256: sha256(bytes) });
      }
    }
  };
  walk(evidenceDir);
  report.files = files;
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
}

console.log(JSON.stringify({ tool, workload, correctnessOnly, passed: report.passed, checks: report.checks, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
