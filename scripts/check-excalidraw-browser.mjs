/** Full upstream application: local canvas interaction; no collaboration/AI/backend claim. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
const [distArg, reportArg] = process.argv.slice(2);
if (!distArg || !reportArg) throw new Error('Usage: check-excalidraw-browser.mjs <dist> <NEW-report-dir>');
const dist = fs.realpathSync(distArg), reportDir = path.resolve(reportArg);
fs.mkdirSync(reportDir, { recursive: false });
const report = { publicationEligible: false, purpose: 'Upstream offline functional acceptance', passed: false, checks: {}, errors: [], externalRequests: [], responses: [] };
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(400).end(); }
});
let browser, page;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ headless: true });
  report.browserVersion = await browser.version();
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(origin + '/') || /^(data:|blob:)/.test(request.url())) request.continue();
    else { report.externalRequests.push(request.url()); request.abort(); }
  });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`HTTP ${response.status()}: ${response.url().replace(origin, '')}`); });
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('.excalidraw canvas', { timeout: 30000 });
  report.checks.canvasVisible = await page.$eval('.excalidraw canvas', canvas => canvas.width > 500 && canvas.height > 500);
  await page.keyboard.press('r');
  await page.mouse.move(500, 400); await page.mouse.down(); await page.mouse.move(700, 540, { steps: 10 }); await page.mouse.up();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('excalidraw') || '[]').filter(e => !e.isDeleted && e.type === 'rectangle').length === 1);
  const initial = await page.evaluate(() => JSON.parse(localStorage.getItem('excalidraw'))[0]);
  assert(initial.width > 100 && initial.height > 80);
  report.checks.drawRectangle = true;
  await page.keyboard.press('Escape'); await page.keyboard.press('v');
  await page.mouse.move(600, 400); await page.mouse.down(); await page.mouse.move(650, 460, { steps: 10 }); await page.mouse.up();
  await page.waitForFunction(({ id, x }) => JSON.parse(localStorage.getItem('excalidraw') || '[]').some(e => e.id === id && Math.abs(e.x - x) > 20), {}, { id: initial.id, x: initial.x });
  const moved = await page.evaluate(() => JSON.parse(localStorage.getItem('excalidraw'))[0]);
  report.checks.moveRectangle = true;
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.excalidraw canvas');
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('excalidraw'))[0]);
  assert.equal(restored.id, moved.id); assert.equal(restored.x, moved.x); assert.equal(restored.y, moved.y);
  report.checks.reloadPersistence = true;
  await page.click('.main-menu-trigger');
  await page.waitForSelector('[aria-label="Export image..."]');
  await page.click('[aria-label="Export image..."]');
  await page.waitForSelector('[aria-label="Export to SVG"]');
  const downloads = path.join(reportDir, 'downloads'); fs.mkdirSync(downloads);
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: true });
  const completion = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SVG download timed out')), 30000);
    client.on('Browser.downloadProgress', event => { if (event.state === 'completed') { clearTimeout(timer); resolve(); } });
  });
  await page.click('[aria-label="Export to SVG"]'); await completion;
  const file = fs.readdirSync(downloads).find(file => file.endsWith('.svg'));
  assert(file, 'SVG export missing');
  const svg = fs.readFileSync(path.join(downloads, file), 'utf8');
  assert(svg.includes('<svg') && svg.includes('<path'), 'SVG export has no drawing geometry');
  report.checks.svgExport = true;
  report.scene = { initial, moved, restored };
  for (const [name, passed] of Object.entries(report.checks)) assert(passed, name);
  assert.equal(report.externalRequests.length, 0, 'Unexpected external requests');
  assert.equal(report.errors.length, 0, 'Browser errors');
  report.passed = true;
} catch (error) { report.errors.push(error.message); }
finally {
  if (page) { await page.screenshot({ path: path.join(reportDir, 'browser.png') }).catch(() => {}); fs.writeFileSync(path.join(reportDir, 'page.html'), await page.content().catch(() => '')); }
  if (browser) await browser.close();
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  fs.writeFileSync(path.join(reportDir, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report)); process.exitCode = report.passed ? 0 : 1;
