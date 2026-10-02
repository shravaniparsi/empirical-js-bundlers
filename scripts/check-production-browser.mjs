/** Correctness gate for synthetic output; not a performance measurement. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';

if (!process.argv[2] || !process.argv[3]) throw new Error('Usage: node scripts/check-production-browser.mjs <dist> <new-report.json>');
const dist = fs.realpathSync(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(path.join(dist, '..', 'MANIFEST.json'), 'utf8'));
const expectedHeading = ['xs', 's'].includes(manifest.tier) ? 'TaskBoard' : manifest.tier === 'm' ? 'ShopDash' : 'MegaRepo';
const reportPath = path.resolve(process.argv[3]);
if (fs.existsSync(reportPath)) throw new Error('Refusing to overwrite a correctness report');
const report = { kind: 'synthetic-production-correctness', dist, passed: false, errors: [], requests: [], heading: null, stylesheetCount: 0, routes: [], fixture: { size: manifest.size, seed: manifest.seed, expectedRoutes: manifest.routeEntries } };
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!fs.existsSync(file) && req.headers.accept?.includes('text/html') && !path.extname(pathname)) file = path.join(dist, 'index.html');
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end(); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ headless: true });
  report.browserVersion = await browser.version();
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(origin + '/') || request.url().startsWith('data:')) request.continue();
    else { report.errors.push(`Unexpected external request: ${request.url()}`); request.abort(); }
  });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => {
    report.requests.push({ url: response.url().replace(origin, ''), status: response.status() });
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) report.errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  page.on('requestfailed', request => {
    if (!request.url().endsWith('/favicon.ico')) report.errors.push(`Request failed: ${request.url()}`);
  });
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('#root h1', { timeout: 10000 });
  Object.assign(report, await page.evaluate(() => ({
    heading: document.querySelector('#root h1')?.textContent?.trim(),
    stylesheetCount: document.styleSheets.length,
    rootChildren: document.querySelector('#root')?.childElementCount,
    navigationDisplay: document.querySelector('main nav') ? getComputedStyle(document.querySelector('main nav')).display : null,
  })));
  if (report.heading !== expectedHeading) report.errors.push(`Unexpected application heading: ${report.heading}`);
  if (report.navigationDisplay !== null && report.navigationDisplay !== 'flex') report.errors.push('Navigation CSS module is not applied');
  if (!report.stylesheetCount) report.errors.push('No stylesheets loaded');
  const routes = await page.$$eval('.nav-links a', links => links.map(link => new URL(link.href).pathname));
  if (routes.length !== manifest.routeEntries || new Set(routes).size !== routes.length) report.errors.push('Route links do not match the generated manifest');
  for (const route of routes) {
    await page.click(`.nav-links a[href=${JSON.stringify(route)}]`);
    await page.waitForFunction(route => location.pathname === route, { timeout: 10000 }, route);
    await page.waitForNetworkIdle({ idleTime: 250, timeout: 15000 });
    await page.waitForFunction(() => document.querySelector('main') && !document.querySelector('main .loading'), { timeout: 10000 });
    report.routes.push({ path: route, mainTextLength: await page.$eval('main', element => element.textContent.length) });
  }
  if (routes.length) {
    await page.goto(origin + routes[0], { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('#root h1', { timeout: 10000 });
    report.directRouteReload = new URL(page.url()).pathname === routes[0];
  }
  report.passed = report.errors.length === 0;

} catch (error) { report.errors.push(error.message); }
finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, report: reportPath, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
