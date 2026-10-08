/** Bulletproof React HMR correctness acceptance. Deliberately records no latency values. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import puppeteer from 'puppeteer';

const [tool, workspaceArg, reportArg] = process.argv.slice(2);
if (!['vite', 'rspack', 'webpack'].includes(tool) || !workspaceArg || !reportArg) {
  throw new Error('Usage: check-bulletproof-hmr.mjs <vite|rspack|webpack> <workspace> <NEW-report.json>');
}
const workspace = fs.realpathSync(workspaceArg);
const reportPath = path.resolve(reportArg);
if (fs.existsSync(reportPath)) throw new Error('Refusing to overwrite an HMR report');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
const hash = (value) => createHash('sha256').update(value).digest('hex');
const targetRelative = 'src/features/auth/components/register-form.tsx';
const target = path.join(workspace, targetRelative);
const original = fs.readFileSync(target, 'utf8');
const anchor = '<div className="mt-2 flex items-center justify-end">';
if (original.split(anchor).length !== 2) throw new Error(`Expected one reviewed edit anchor in ${targetRelative}`);
const report = {
  kind: 'bulletproof-react-hmr-correctness-not-latency-data',
  application: 'bulletproof-react', tool, publicationEligible: false, node: process.version,
  target: targetRelative, originalSourceSha256: hash(original),
  lockSha256: hash(fs.readFileSync(path.join(workspace, 'package-lock.json'))),
  developmentProfile: JSON.parse(fs.readFileSync(path.join(workspace, 'DEVELOPMENT_PROFILE.json'))),
  checks: {}, edits: [], errors: [], console: [], passed: false,
};
const reservePort = async () => {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
};
const frontendPort = await reservePort();
const apiPort = await reservePort();
const api = http.createServer((request, response) => {
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
await new Promise((resolve) => api.listen(apiPort, '127.0.0.1', resolve));
report.checks.fixtureApiReady = true;
const serverLog = fs.openSync(reportPath.replace(/\.json$/, '') + '-server.log', 'wx');
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort), ...(tool === 'vite' ? ['--strictPort'] : [])], {
  cwd: workspace,
  env: { ...process.env, NODE_ENV: 'development', VITE_APP_API_URL: `http://127.0.0.1:${apiPort}/api`, VITE_APP_ENABLE_API_MOCKING: 'false' },
  detached: true,
  stdio: ['ignore', serverLog, serverLog],
});
let browser;
let page;
let navigations = 0;
const origin = `http://127.0.0.1:${frontendPort}`;
const groupAlive = (child) => { try { process.kill(-child.pid, 0); return true; } catch { return false; } };
const stop = async (child) => {
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
  page.on('console', (message) => { if (message.type() === 'error') report.console.push(message.text()); });
  page.on('pageerror', (error) => report.errors.push(error.message));
  await page.goto(origin + '/auth/register', { waitUntil: 'networkidle0', timeout: 180000 });
  await page.waitForSelector('input[name="firstName"]', { visible: true, timeout: 60000 });
  await page.type('input[name="firstName"]', 'hmr-state-sentinel');
  const state = await page.$eval('input[name="firstName"]', (element) => element.value);
  if (state !== 'hmr-state-sentinel') throw new Error('Registration form state was not established');
  report.checks.applicationStateEstablished = true;
  const token = randomUUID();
  await page.evaluate((value) => { window.__benchmarkDocumentToken = value; }, token);
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) navigations++; });
  for (let edit = 1; edit <= 3; edit++) {
    const marker = `benchmark-hmr-edit-${edit}`;
    fs.writeFileSync(target, original.replace(anchor, `<div data-testid="${marker}" className="mt-2 flex items-center justify-end">`));
    await page.waitForSelector(`[data-testid="${marker}"]`, { timeout: 120000 });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const observedToken = await page.evaluate(() => window.__benchmarkDocumentToken);
    const observedState = await page.$eval('input[name="firstName"]', (element) => element.value);
    const passed = observedToken === token && observedState === state && navigations === 0;
    report.edits.push({ edit, marker, documentPreserved: observedToken === token, statePreserved: observedState === state, navigations, settled: true, passed });
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
  await new Promise((resolve) => api.close(resolve));
  report.checks.fixtureApiStopped = !api.listening;
  fs.closeSync(serverLog);
  report.passed = report.passed && Object.values(report.checks).every(Boolean);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ tool, passed: report.passed, checks: report.checks, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
