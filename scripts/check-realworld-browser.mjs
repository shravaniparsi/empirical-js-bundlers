/** Scoped Bulletproof React production acceptance against an in-process fixture API. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';
const [distArg, reportArg] = process.argv.slice(2);
if (!distArg || !reportArg) throw new Error('Usage: node scripts/check-realworld-browser.mjs <dist> <new-report.json>');
const dist = fs.realpathSync(distArg), reportPath = path.resolve(reportArg);
if (fs.existsSync(reportPath)) throw new Error('Refusing to overwrite report');
const report = { kind: 'scoped-bulletproof-react-correctness-with-fixture-api', passed: false, errors: [], requests: [], checks: {} };
const user = { id: 'benchmark-user', firstName: 'Benchmark', lastName: 'User', email: 'benchmark@example.invalid', role: 'ADMIN', teamId: 'benchmark-team', bio: 'Test fixture', createdAt: 0 };
const discussion = { id: 'benchmark-discussion', title: 'Benchmark discussion', body: 'Deterministic local fixture.', teamId: user.teamId, author: user, createdAt: 0 };
let authenticated = false;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    let body;
    if (url.pathname === '/api/auth/me') body = { data: authenticated ? user : null };
    else if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      let input = '';for await (const chunk of req) input += chunk;
      const credentials = JSON.parse(input);
      if (credentials.email !== user.email || credentials.password !== 'benchmark-test-password') { res.writeHead(400).end(JSON.stringify({ message: 'Invalid fixture credentials' }));return; }
      authenticated = true;body = { jwt: 'local-test-token', user };
    } else if (url.pathname === '/api/discussions') body = { data: [discussion], meta: { page: 1, total: 1, totalPages: 1 } };
    else if (url.pathname === '/api/discussions/benchmark-discussion') body = { data: discussion };
    else if (url.pathname === '/api/comments') body = { data: [], meta: { page: 1, total: 0, totalPages: 1 } };
    else { report.errors.push(`Unexpected API request: ${req.method} ${url.pathname}`);res.writeHead(404).end('{}');return; }
    res.end(JSON.stringify(body));return;
  }
  const pathname = decodeURIComponent(url.pathname);
  let file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!fs.existsSync(file) && req.headers.accept?.includes('text/html') && !path.extname(pathname)) file = path.join(dist, 'index.html');
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end();return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream' });fs.createReadStream(file).pipe(res);
});
let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ headless: true });report.browserVersion = await browser.version();
  const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(origin + '/') || /^(data:|blob:)/.test(request.url())) request.continue();
    else { report.errors.push(`External request blocked: ${request.url()}`);request.abort(); }
  });
  page.on('response', response => {
    report.requests.push({ url: response.url().replace(origin, ''), status: response.status() });
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) report.errors.push(`HTTP ${response.status()}: ${response.url().replace(origin, '')}`);
  });
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('h2')?.textContent.includes('Bulletproof React'), { timeout: 15000 });
  report.checks.landing = true;
  const styles = await page.$eval('h2', element => ({ fontSize: parseFloat(getComputedStyle(element).fontSize), weight: getComputedStyle(element).fontWeight }));
  report.checks.tailwindStyles = styles.fontSize >= 30 && Number(styles.weight) >= 700;
  report.checks.logoLoaded = await page.$eval('img[alt="react"]', element => element.complete && element.naturalWidth > 0);
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Get started')).click());
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.type('input[name="email"]', user.email);
  await page.type('input[name="password"]', 'benchmark-test-password');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname === '/app' && document.body.textContent.includes('Welcome Benchmark User'), { timeout: 15000 });
  report.checks.loginAndDashboard = true;
  await page.click('a[href="/app/discussions"]');
  await page.waitForFunction(() => document.body.textContent.includes('Benchmark discussion'), { timeout: 15000 });
  report.checks.discussions = true;
  await page.goto(origin + '/app/discussions', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => document.body.textContent.includes('Benchmark discussion'), { timeout: 15000 });
  report.checks.directRouteReload = true;
  for (const [name, passed] of Object.entries(report.checks)) if (!passed) report.errors.push(`Failed check: ${name}`);
  report.passed = report.errors.length === 0;
} catch (error) { report.errors.push(error.message); }
finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, checks: report.checks, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
