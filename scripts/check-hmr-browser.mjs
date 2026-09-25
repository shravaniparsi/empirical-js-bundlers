/** Real component HMR acceptance: browser state survives; full reloads fail. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import puppeteer from 'puppeteer';
const [tool, workspaceArg, reportArg] = process.argv.slice(2);
if (!['vite', 'rspack', 'webpack'].includes(tool) || !workspaceArg || !reportArg) throw new Error('Usage: node scripts/check-hmr-browser.mjs <vite|rspack|webpack> <workspace> <new-report.json>');
const workspace = fs.realpathSync(workspaceArg), reportPath = path.resolve(reportArg);
if (fs.existsSync(reportPath)) throw new Error('Refusing to overwrite an HMR report');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
const source = path.join(workspace, 'src/App.tsx'), original = fs.readFileSync(source, 'utf8');
const headings = [...original.matchAll(/<h1(?:\s[^>]*)?>([^<{]+)<\/h1>/g)];
if (headings.length !== 1) throw new Error('Expected exactly one literal application heading');
const headingMarkup = headings[0][0], heading = headings[0][1];
const hash = value => createHash('sha256').update(value).digest('hex');
const report = { kind: 'real-component-hmr-correctness-not-latency-data', tool, workspace, publicationEligible: false, heading, passed: false, edits: [], errors: [], originalSourceSha256: hash(original) };
const reserve = http.createServer();
await new Promise(resolve => reserve.listen(0, '127.0.0.1', resolve));
const port = reserve.address().port;
await new Promise(resolve => reserve.close(resolve));
const log = fs.openSync(reportPath.replace(/\.json$/, '') + '-server.log', 'wx');
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), ...(tool === 'vite' ? ['--strictPort'] : [])], {
  cwd: workspace, env: { ...process.env, NODE_ENV: 'development' }, detached: true, stdio: ['ignore', log, log],
});
server.on('error', error => report.errors.push(error.message));
let browser;
try {
  const origin = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 180000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    if (server.exitCode !== null) throw new Error('Development server exited before readiness');
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok; } catch {}
    if (!ready) await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Development server readiness timeout');
  browser = await puppeteer.launch({ headless: true });
  report.browserVersion = await browser.version();
  const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 180000 });
  await page.waitForFunction(heading => document.querySelector('h1')?.textContent === heading, { timeout: 60000 }, heading);
  // Large fixtures may place editable state only in lazy routes. Select the
  // first visible text control in home/nav order, before installing the detector.
  const selectStateControl = () => {
    const candidate = [...document.querySelectorAll('input:not([type]), input[type="text"], input[type="email"], input[type="search"], textarea')]
      .find(element => !element.disabled && !element.readOnly && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0);
    if (!candidate) return false;
    candidate.setAttribute('data-benchmark-state-input', 'true'); return true;
  };
  let selected = await page.evaluate(selectStateControl);
  const routes = await page.$$eval('.nav-links a', links => links.map(link => new URL(link.href).pathname));
  for (const route of routes) {
    if (selected) break;
    await page.click(`.nav-links a[href=${JSON.stringify(route)}]`);
    await page.waitForFunction(route => location.pathname === route && !document.querySelector('.loading'), { timeout: 60000 }, route);
    selected = await page.evaluate(selectStateControl);
  }
  if (!selected) throw new Error('No visible editable text state in declared application routes');
  report.stateRoute = new URL(page.url()).pathname;
  const input = '[data-benchmark-state-input="true"]';
  report.stateControl = await page.$eval(input, element => ({ tag: element.tagName, type: element.type, name: element.name }));
  await page.type(input, 'hmr-state-sentinel');
  const state = await page.$eval(input, element => element.value);
  const token = randomUUID();
  await page.evaluate(token => { window.__benchmarkDocumentToken = token; }, token);
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  for (let edit = 1; edit <= 3; edit++) {
    const text = `${heading} edit ${edit}`;
    fs.writeFileSync(source, original.replace(headingMarkup, headingMarkup.replace(heading, text)));
    await page.waitForFunction(text => document.querySelector('h1')?.textContent === text, { timeout: 60000 }, text);
    const observedToken = await page.evaluate(() => window.__benchmarkDocumentToken);
    const observedState = await page.$eval(input, element => element.value);
    const passed = observedToken === token && observedState === state && navigations === 0;
    report.edits.push({ edit, text, statePreserved: observedState === state, documentPreserved: observedToken === token, navigations, passed });
    if (!passed) throw new Error(`Edit ${edit} caused reload or lost application state`);
  }
  // Positive control for the detector: an intentional reload must be detected.
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  report.reloadControlDetected = navigations > 0 && await page.evaluate(() => window.__benchmarkDocumentToken) !== token;
  if (!report.reloadControlDetected) throw new Error('Reload detector failed its control');
  report.passed = report.errors.length === 0;
} catch (error) { report.errors.push(error.message); }
finally {
  fs.writeFileSync(source, original);
  report.sourceRestored = hash(fs.readFileSync(source)) === report.originalSourceSha256;
  if (browser) await browser.close();
  try { process.kill(-server.pid, 'SIGTERM'); } catch {}
  await new Promise(resolve => setTimeout(resolve, 500));
  try { process.kill(-server.pid, 'SIGKILL'); } catch {}
  try { process.kill(-server.pid, 0); report.serverStopped = false; } catch { report.serverStopped = true; }
  fs.closeSync(log);
  report.passed = report.passed && report.sourceRestored && report.serverStopped;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ tool, passed: report.passed, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
