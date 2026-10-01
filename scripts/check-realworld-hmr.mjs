/** Real-world HMR correctness acceptance. Deliberately records no latency values. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import puppeteer from 'puppeteer';

const [application, tool, workspaceArg, reportArg, binaryArg] = process.argv.slice(2);
if (!['memos', 'excalidraw'].includes(application) || !['vite', 'rspack', 'webpack'].includes(tool) || !workspaceArg || !reportArg) {
  throw new Error('Usage: check-realworld-hmr.mjs <memos|excalidraw> <vite|rspack|webpack> <workspace> <NEW-report.json> [memos-backend]');
}
if (application === 'memos' && !binaryArg) throw new Error('Memos HMR requires its compiled backend');
const workspace = fs.realpathSync(workspaceArg);
const reportPath = path.resolve(reportArg);
if (fs.existsSync(reportPath)) throw new Error('Refusing to overwrite an HMR report');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
const hash = (value) => createHash('sha256').update(value).digest('hex');
const targetRelative = application === 'memos' ? 'src/pages/SignUp.tsx' : 'packages/excalidraw/components/main-menu/MainMenu.tsx';
const target = path.join(workspace, targetRelative);
const original = fs.readFileSync(target, 'utf8');
const anchor = application === 'memos'
  ? 'className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-accent/50 px-3 py-2 text-[13px] leading-relaxed text-muted-foreground"'
  : 'data-testid="main-menu-trigger"';
if (original.split(anchor).length !== 2) throw new Error(`Expected one reviewed edit anchor in ${targetRelative}`);
const report = {
  kind: 'real-world-hmr-correctness-not-latency-data',
  application,
  tool,
  publicationEligible: false,
  node: process.version,
  target: targetRelative,
  originalSourceSha256: hash(original),
  lockSha256: hash(fs.readFileSync(path.join(workspace, 'package-lock.json'))),
  checks: {},
  edits: [],
  errors: [],
  console: [],
  passed: false,
};
const reservePort = async () => {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
};
const frontendPort = await reservePort();
let backend;
let backendLog;
let dataDirectory;
const environment = { ...process.env, NODE_ENV: 'development' };
if (application === 'memos') {
  const backendPort = await reservePort();
  dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'memos-hmr-'));
  backendLog = fs.openSync(reportPath.replace(/\.json$/, '') + '-backend.log', 'wx');
  backend = spawn(fs.realpathSync(binaryArg), ['--addr', '127.0.0.1', '--port', String(backendPort), '--data', dataDirectory, '--driver', 'sqlite'], { detached: true, stdio: ['ignore', backendLog, backendLog] });
  environment.MEMOS_BACKEND_ORIGIN = `http://127.0.0.1:${backendPort}`;
  for (let attempt = 0; attempt < 240; attempt++) {
    if (backend.exitCode !== null) throw new Error('Memos backend exited before readiness');
    try { if ((await fetch(environment.MEMOS_BACKEND_ORIGIN, { signal: AbortSignal.timeout(1000) })).ok) break; } catch {}
    if (attempt === 239) throw new Error('Memos backend readiness timeout');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  report.checks.actualBackendReady = true;
}
const serverLog = fs.openSync(reportPath.replace(/\.json$/, '') + '-server.log', 'wx');
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort)], { cwd: workspace, env: environment, detached: true, stdio: ['ignore', serverLog, serverLog] });
let browser;
let page;
let navigations = 0;
const origin = `http://127.0.0.1:${frontendPort}`;
const groupAlive = (child) => { try { process.kill(-child.pid, 0); return true; } catch { return false; } };
const stop = async (child) => {
  if (!child) return true;
  try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  for (let attempt = 0; attempt < 50 && groupAlive(child); attempt++) await new Promise((resolve) => setTimeout(resolve, 100));
  if (groupAlive(child)) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
  for (let attempt = 0; attempt < 50 && groupAlive(child); attempt++) await new Promise((resolve) => setTimeout(resolve, 100));
  return !groupAlive(child);
};
try {
  for (let attempt = 0; attempt < 720; attempt++) {
    if (server.exitCode !== null) throw new Error('Development server exited before readiness');
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) break; } catch {}
    if (attempt === 719) throw new Error('Development server readiness timeout');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  report.checks.developmentServerReady = true;
  browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined });
  report.browserVersion = await browser.version();
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  page.on('console', (message) => { if (message.type() === 'error') report.console.push(message.text()); });
  page.on('pageerror', (error) => report.errors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 180000 });
  const token = randomUUID();
  await page.evaluate((token) => { window.__benchmarkDocumentToken = token; }, token);
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) navigations++; });
  let state;
  if (application === 'memos') {
    await page.waitForSelector('#signup-username', { visible: true, timeout: 60000 });
    await page.type('#signup-username', 'hmr-state-sentinel');
    await page.type('#signup-password', 'Hmr-state-sentinel-7391');
    state = await page.evaluate(() => ({ username: document.querySelector('#signup-username')?.value, password: document.querySelector('#signup-password')?.value }));
    if (state.username !== 'hmr-state-sentinel' || state.password !== 'Hmr-state-sentinel-7391') throw new Error('Memos form state was not established');
  } else {
    await page.waitForSelector('.excalidraw canvas.interactive', { timeout: 60000 });
    await page.keyboard.press('r');
    await page.mouse.move(500, 400); await page.mouse.down(); await page.mouse.move(700, 540, { steps: 10 }); await page.mouse.up();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('excalidraw') || '[]').filter((element) => !element.isDeleted && element.type === 'rectangle').length === 1);
    state = await page.evaluate(() => JSON.parse(localStorage.getItem('excalidraw') || '[]').find((element) => !element.isDeleted && element.type === 'rectangle'));
    if (!state?.id) throw new Error('Excalidraw scene state was not established');
  }
  report.checks.applicationStateEstablished = true;
  for (let edit = 1; edit <= 3; edit++) {
    const marker = `benchmark-hmr-edit-${edit}`;
    const replacement = application === 'memos'
      ? anchor.replace('mt-4 ', `mt-4 ${marker} `)
      : `data-testid="${marker}"`;
    fs.writeFileSync(target, original.replace(anchor, replacement));
    const selector = `.${marker}`;
    if (application === 'memos') await page.waitForSelector(selector, { timeout: 120000 });
    else await page.waitForSelector(`[data-testid="${marker}"]`, { timeout: 120000 });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const observedToken = await page.evaluate(() => window.__benchmarkDocumentToken);
    const observedState = application === 'memos'
      ? await page.evaluate(() => ({ username: document.querySelector('#signup-username')?.value, password: document.querySelector('#signup-password')?.value }))
      : await page.evaluate((id) => JSON.parse(localStorage.getItem('excalidraw') || '[]').find((element) => element.id === id), state.id);
    const statePreserved = application === 'memos'
      ? observedState.username === state.username && observedState.password === state.password
      : observedState?.id === state.id && observedState.x === state.x && observedState.y === state.y;
    const passed = observedToken === token && navigations === 0 && statePreserved;
    report.edits.push({ edit, marker, documentPreserved: observedToken === token, statePreserved, navigations, settled: true, passed });
    if (!passed) throw new Error(`Edit ${edit} caused navigation, document replacement, or state loss`);
  }
  report.checks.threeSettledEdits = report.edits.length === 3 && report.edits.every((edit) => edit.passed);
  await page.reload({ waitUntil: 'networkidle0', timeout: 120000 });
  report.checks.reloadControlDetected = navigations > 0 && await page.evaluate(() => window.__benchmarkDocumentToken) !== token;
  if (!report.checks.reloadControlDetected) throw new Error('Reload detector failed its positive control');
  report.passed = report.errors.length === 0;
} catch (error) {
  report.errors.push(error.message);
} finally {
  fs.writeFileSync(target, original);
  report.checks.sourceRestored = hash(fs.readFileSync(target)) === report.originalSourceSha256;
  if (page && !report.passed) {
    fs.writeFileSync(reportPath.replace(/\.json$/, '') + '-page.html', await page.content().catch(() => ''));
    await page.screenshot({ path: reportPath.replace(/\.json$/, '') + '-browser.png' }).catch(() => {});
  }
  if (browser) await browser.close();
  report.checks.developmentServerStopped = await stop(server);
  if (backend) report.checks.backendStopped = await stop(backend);
  if (dataDirectory) fs.rmSync(dataDirectory, { recursive: true, force: true });
  fs.closeSync(serverLog);
  if (backendLog !== undefined) fs.closeSync(backendLog);
  report.passed = report.passed && Object.values(report.checks).every(Boolean);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ application, tool, passed: report.passed, checks: report.checks, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
