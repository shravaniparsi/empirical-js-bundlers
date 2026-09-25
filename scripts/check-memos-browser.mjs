/** Actual pinned Memos server + fresh SQLite; no fabricated API responses. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { verifySource, sha256 } from './verify-realworld-source.mjs';
const [sourceArg, binaryArg, reportArg] = process.argv.slice(2);
if (!reportArg) throw new Error('Usage: check-memos-browser.mjs <pinned-source> <backend-binary> <NEW-report-dir>');
const source = fs.realpathSync(sourceArg), binary = fs.realpathSync(binaryArg), reportDir = path.resolve(reportArg);
fs.mkdirSync(reportDir, { recursive: false });
const report = { publicationEligible: false, purpose: 'Memos actual-backend functional acceptance', passed: false, checks: {}, errors: [], console: [], cancellations: [], responses: [], source: verifySource('memos', source), binarySha256: sha256(fs.readFileSync(binary)) };
const dist = path.join(source, 'web/dist');
const data = path.join(reportDir, 'database'); fs.mkdirSync(data);
const reservation = http.createServer(); await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
const backendPort = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
const log = fs.openSync(path.join(reportDir, 'backend.log'), 'wx');
const backend = spawn(binary, ['--addr', '127.0.0.1', '--port', String(backendPort), '--data', data, '--driver', 'sqlite'], { stdio: ['ignore', log, log] });
const backendExit = once(backend, 'exit');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (/^\/(api\/|memos\.api\.|file\/)/.test(url.pathname)) {
    const proxy = http.request({ host: '127.0.0.1', port: backendPort, path: req.url, method: req.method, headers: req.headers }, upstream => { res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res); });
    proxy.on('error', error => { if (res.destroyed && error.code === 'ECONNRESET') { report.cancellations.push({ url: req.url, reason: 'client closed upstream read' }); return; } report.errors.push(error.message); if (!res.destroyed) res.writeHead(502).end(); });
    res.on('close', () => proxy.destroy()); req.pipe(proxy); return;
  }
  try {
    let file = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
    if (url.pathname === '/' || (!fs.existsSync(file) && req.headers.accept?.includes('text/html'))) file = path.join(dist, 'index.html');
    if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(400).end(); }
});
let browser, page, phase = 'bootstrap';
try {
  for (let attempt = 0; ; attempt++) {
    if (backend.exitCode !== null) throw new Error('Backend exited before readiness');
    try { await fetch(`http://127.0.0.1:${backendPort}/`); break; }
    catch { if (attempt >= 119) throw new Error('Backend readiness timeout'); await new Promise(resolve => setTimeout(resolve, 500)); }
  }
  report.checks.actualBackendReady = true;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ headless: true }); report.browserVersion = await browser.version();
  page = await browser.newPage(); await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on('request', request => { if (request.url().startsWith(origin + '/') || /^(data:|blob:)/.test(request.url())) request.continue(); else { report.errors.push('External request: ' + request.url()); request.abort(); } });
  page.on('console', message => { if (['error', 'warn'].includes(message.type())) report.console.push({ type: message.type(), text: message.text() }); });
  page.on('requestfailed', request => { const url = new URL(request.url()); const reason = request.failure()?.errorText; if (reason === 'net::ERR_ABORTED' && (url.pathname === '/memos.api.v1.MemoService/ListMemos' || (phase === 'reload' && url.pathname === '/api/v1/sse'))) report.cancellations.push({ url: url.pathname, reason }); else report.errors.push('Request failed: ' + url.pathname + ' ' + reason); });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { const url = response.url().replace(origin, ''); const expectedAnonymousRefresh = phase === 'bootstrap' && response.status() === 401 && url === '/memos.api.v1.AuthService/RefreshToken'; report.responses.push({ url, status: response.status(), expectedAnonymousRefresh }); if (response.status() >= 400 && !expectedAnonymousRefresh) report.errors.push(`HTTP ${response.status()}: ${url}`); });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#signup-username', { timeout: 30000 });
  phase = 'signup';
  await page.type('#signup-username', 'benchmark'); await page.type('#signup-password', 'Local-benchmark-only-7391'); await page.evaluate(async () => { await document.fonts.ready; window.__benchmarkSubmitCount = 0; document.querySelector('form').addEventListener('submit', () => window.__benchmarkSubmitCount++); });
  await page.locator('button[type="submit"]').click();
  await page.waitForSelector('[data-new-memo-trigger]', { timeout: 30000 }); report.checks.signupAndLogin = true;
  await page.click('[data-new-memo-trigger]');
  await page.waitForSelector('.cm-content[contenteditable="true"]', { visible: true });
  await page.locator('.cm-content[contenteditable="true"]').click();
  await page.keyboard.insertText('**Benchmark original note**\n\nActual local SQLite acceptance.');
  await page.waitForFunction(() => document.querySelector('.cm-content[contenteditable="true"]')?.textContent.includes('**Benchmark original note**'));
  await page.keyboard.down('Control'); await page.keyboard.press('Enter'); await page.keyboard.up('Control');
  await page.waitForFunction(() => [...document.querySelectorAll('[data-slot="memo-body"] strong')].some(node => node.textContent === 'Benchmark original note'));
  report.checks.createAndRenderMarkdown = true;
  await page.click('[data-slot="memo-header-actions"] button[aria-label="More"]');
  await page.waitForSelector('[role="menuitem"]');
  await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].find(node => node.textContent.trim() === 'Edit').click());
  await page.waitForFunction(() => {
    const editor = [...document.querySelectorAll('.cm-content[contenteditable="true"]')].find(node => node.textContent.includes('Benchmark original note'));
    if (!editor) return false; editor.setAttribute('data-benchmark-edit-target', 'true'); return true;
  });
  await page.locator('[data-benchmark-edit-target="true"]').click();
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.insertText('**Benchmark edited note**\n\nPersist this exact revision.');
  await page.waitForFunction(() => document.querySelector('[data-benchmark-edit-target="true"]')?.textContent.includes('**Benchmark edited note**'));
  await page.keyboard.down('Control'); await page.keyboard.press('Enter'); await page.keyboard.up('Control');
  await page.waitForFunction(() => [...document.querySelectorAll('[data-slot="memo-body"] strong')].some(node => node.textContent === 'Benchmark edited note'));
  report.checks.editNote = true;
  phase = 'reload';
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-slot="memo-body"] strong')].some(node => node.textContent === 'Benchmark edited note'));
  report.checks.reloadPersistence = true;
  assert(report.responses.some(response => response.url.includes('CreateMemo') && response.status === 200));
  assert(report.responses.some(response => response.url.includes('UpdateMemo') && response.status === 200));
  report.checks.actualWriteResponses = true;
  assert.equal(report.errors.length, 0, 'Browser/network errors');
  report.sourceAfter = verifySource('memos', source); report.passed = true;
} catch (error) { report.errors.push(error.message); }
finally {
  if (page) { report.formSubmissions = await page.evaluate(() => window.__benchmarkSubmitCount).catch(() => null); await page.screenshot({ path: path.join(reportDir, 'browser.png') }).catch(() => {}); fs.writeFileSync(path.join(reportDir, 'page.html'), await page.content().catch(() => '')); }
  if (browser) await browser.close();
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  backend.kill('SIGTERM');
  const force = setTimeout(() => backend.kill('SIGKILL'), 10000); await backendExit; clearTimeout(force); fs.closeSync(log);
  report.backendExitCode = backend.exitCode; report.backendSignal = backend.signalCode;
  // Database contains disposable authentication material: retain hashes, never publish the database.
  report.databaseFiles = fs.readdirSync(data).filter(name => fs.statSync(path.join(data, name)).isFile()).map(name => ({ name, sha256: sha256(fs.readFileSync(path.join(data, name))) }));
  fs.rmSync(data, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, checks: report.checks, errors: report.errors })); process.exitCode = report.passed ? 0 : 1;
