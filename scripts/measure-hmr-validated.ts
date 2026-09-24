/**
 * M4: end-to-end browser-applied HMR latency.
 *
 * A unique DOM marker is written by an actively loaded module. Timing ends
 * only when the browser observes that exact marker. Full-page reloads fail.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import puppeteer, { type Browser, type Page } from 'puppeteer';

interface Args {
  tool: string;
  project: string;
  runs: number;
  sessions: number;
  sessionOffset: number;
  runOffset: number;
  append: boolean;
  csv: string;
  size: string;
  timestamp: string;
}

interface DevConfig {
  cmd: string;
  args: string[];
  port: number;
  readyPattern: RegExp;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const values: Record<string, string> = {};
  for (let i = 0; i < raw.length; i += 2) values[raw[i].replace(/^--/, '')] = raw[i + 1];
  const args: Args = {
    tool: values.tool,
    project: path.resolve(values.project),
    runs: Number(values.runs ?? 20),
    sessions: Number(values.sessions ?? 5),
    sessionOffset: Number(values.sessionOffset ?? 0),
    runOffset: Number(values.runOffset ?? 0),
    append: values.append === 'true',
    csv: path.resolve(values.csv),
    size: values.size,
    timestamp: values.timestamp,
  };
  if (!args.tool || !args.project || !args.csv || !args.size || !args.timestamp) {
    throw new Error('Missing required arguments');
  }
  if (!Number.isInteger(args.runs) || !Number.isInteger(args.sessions) ||
      args.runs < 1 || args.sessions < 1 || args.runs % args.sessions !== 0) {
    throw new Error('--runs must be evenly divisible by --sessions');
  }
  return args;
}

function devConfig(tool: string): DevConfig {
  switch (tool) {
    case 'vite':
      return {
        cmd: 'npx',
        args: ['vite', '--port', '5199', '--strictPort'],
        port: 5199,
        readyPattern: /Local:\s+http:\/\/localhost:5199/i,
      };
    case 'rspack':
      return {
        cmd: 'npx',
        args: ['rspack', 'serve', '--config', 'rspack.config.cjs', '--port', '5299'],
        port: 5299,
        readyPattern: /Local:\s+http:\/\/localhost:5299|Loopback:\s+http:\/\/localhost:5299/i,
      };
    case 'webpack':
      return {
        cmd: 'npx',
        args: ['webpack', 'serve', '--mode', 'development', '--config', 'webpack.config.cjs', '--port', '5399'],
        port: 5399,
        readyPattern: /Loopback:\s+http:\/\/localhost:5399|Local:\s+http:\/\/localhost:5399/i,
      };
    default:
      throw new Error(`${tool} does not provide native HMR`);
  }
}

function probeSource(tool: string, value: string): string {
  const accept = tool === 'vite'
    ? `if (import.meta.hot) import.meta.hot.accept();`
    : `if (import.meta.webpackHot) import.meta.webpackHot.accept();`;
  return `
if (typeof document !== 'undefined') {
  const id = '__hmr_benchmark_marker';
  const marker = document.getElementById(id) ?? document.body.appendChild(Object.assign(document.createElement('span'), { id }));
  marker.textContent = '${value}';
}
${accept}
`;
}

function hash(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHmrClient(promise: Promise<void>, timeoutMs: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Browser HMR client readiness timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function waitForCondition(predicate: () => boolean, timeoutMs: number, message: string): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (predicate()) return;
    await sleep(25);
  }
  throw new Error(message);
}

async function waitForLog(file: string, pattern: RegExp, proc: ChildProcess, timeoutMs: number): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (fs.existsSync(file) && pattern.test(fs.readFileSync(file, 'utf8'))) return;
    if (proc.exitCode !== null) throw new Error(`Dev server exited with ${proc.exitCode}`);
    await sleep(25);
  }
  throw new Error('Dev server readiness timeout');
}

async function waitForMarker(page: Page, value: string, timeoutMs: number): Promise<void> {
  await page.waitForFunction(
    expected => document.getElementById('__hmr_benchmark_marker')?.textContent === expected,
    { timeout: timeoutMs, polling: 10 },
    value,
  );
}

function assertPortFree(port: number): void {
  const result = spawnSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' });
  if (result.stdout.trim()) throw new Error(`Port ${port} is already owned by PID(s): ${result.stdout.trim()}`);
}

async function stopProcess(proc: ChildProcess): Promise<void> {
  if (!proc.pid) return;
  const pid = proc.pid;
  const waitForExit = (timeoutMs: number) => new Promise<boolean>(resolve => {
    if (proc.exitCode !== null || proc.signalCode !== null) return resolve(true);
    const timer = setTimeout(() => resolve(false), timeoutMs);
    proc.once('exit', () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
  const groupExists = () => {
    try {
      process.kill(-pid, 0);
      return true;
    } catch {
      return false;
    }
  };
  if (groupExists()) process.kill(-pid, 'SIGTERM');
  await waitForExit(2_000);
  if (groupExists()) {
    process.kill(-pid, 'SIGKILL');
    await waitForExit(2_000);
  }
  if (groupExists()) throw new Error(`Process group ${pid} did not terminate`);
}

function acquireLock(file: string): number {
  try {
    const descriptor = fs.openSync(file, 'wx');
    fs.writeFileSync(descriptor, `${process.pid}\n`);
    return descriptor;
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error;
    const stalePid = Number(fs.readFileSync(file, 'utf8').trim());
    let active = false;
    if (Number.isInteger(stalePid) && stalePid > 0) {
      try {
        process.kill(stalePid, 0);
        active = true;
      } catch {
        active = false;
      }
    }
    if (active) throw new Error(`Active M4 lock owned by PID ${stalePid}`);
    fs.rmSync(file, { force: true });
    const descriptor = fs.openSync(file, 'wx');
    fs.writeFileSync(descriptor, `${process.pid}\n`);
    return descriptor;
  }
}

async function main() {
  const args = parseArgs();
  const config = devConfig(args.tool);
  const entry = path.join(args.project, 'src', 'main.tsx');
  const target = path.join(args.project, 'src', '__benchmark_hmr_probe__.ts');
  const originalEntry = fs.readFileSync(entry, 'utf8');
  const originalEntryMode = fs.statSync(entry).mode;
  const targetExisted = fs.existsSync(target);
  const originalTarget = targetExisted ? fs.readFileSync(target) : undefined;
  const originalTargetMode = targetExisted ? fs.statSync(target).mode : undefined;
  const originalHash = hash(originalEntry);
  const timeoutMs = args.size.startsWith('xl') ? 180_000 : 60_000;
  const cooldownMs = 1_000;
  const runsPerSession = args.runs / args.sessions;
  const logsDir = path.join(path.dirname(args.csv), 'logs');
  const metadataFile = args.csv.replace(/\.csv$/, '.meta.json');
  const lockFile = path.join(args.project, '.benchmark-m4.lock');
  fs.mkdirSync(logsDir, { recursive: true });
  const lock = acquireLock(lockFile);
  let activeProc: ChildProcess | undefined;
  let activeBrowser: Browser | undefined;
  let interrupted = false;
  const restoreSources = () => {
    fs.writeFileSync(entry, originalEntry);
    fs.chmodSync(entry, originalEntryMode);
    if (targetExisted && originalTarget && originalTargetMode !== undefined) {
      fs.writeFileSync(target, originalTarget);
      fs.chmodSync(target, originalTargetMode);
    } else {
      fs.rmSync(target, { force: true });
    }
  };
  const handleSignal = async (signal: 'SIGINT' | 'SIGTERM') => {
    if (interrupted) return;
    interrupted = true;
    try { restoreSources(); } catch {}
    try { if (activeBrowser) await activeBrowser.close(); } catch {}
    try { if (activeProc) await stopProcess(activeProc); } catch {}
    try { fs.closeSync(lock); } catch {}
    try { fs.rmSync(lockFile, { force: true }); } catch {}
    process.exit(signal === 'SIGINT' ? 130 : 143);
  };
  const onSigint = () => { void handleSignal('SIGINT'); };
  const onSigterm = () => { void handleSignal('SIGTERM'); };
  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigterm);
  const { replacedSessions, runSessions, warmups } = (() => {
    try {
      const previousMetadata = args.append && fs.existsSync(metadataFile)
        ? JSON.parse(fs.readFileSync(metadataFile, 'utf8'))
        : undefined;
      const sessionsToReplace = new Set(
        Array.from({ length: args.sessions }, (_, index) => args.sessionOffset + index + 1),
      );
      const existingRuns: Array<{ run: number; session: number; value: number; failure?: string }> =
        ((previousMetadata?.runSessions ?? []) as Array<{ run: number; session: number; value: number; failure?: string }>)
          .filter(run => !sessionsToReplace.has(run.session));
      const existingWarmups: Array<{ session: number; reloaded: boolean }> =
        ((previousMetadata?.warmups ?? []) as Array<{ session: number; reloaded: boolean }>)
          .filter(warmup => !sessionsToReplace.has(warmup.session));
      if (args.append && fs.existsSync(args.csv)) {
        const [header, ...rows] = fs.readFileSync(args.csv, 'utf8').trim().split('\n');
        const retained = rows.filter(row => !sessionsToReplace.has(Number(row.split(',')[7])));
        fs.writeFileSync(args.csv, `${[header, ...retained].join('\n')}\n`);
      } else {
        fs.writeFileSync(args.csv, 'tool,size,metric,run,value,unit,timestamp,session\n');
      }
      return { replacedSessions: sessionsToReplace, runSessions: existingRuns, warmups: existingWarmups };
    } catch (error) {
      process.removeListener('SIGINT', onSigint);
      process.removeListener('SIGTERM', onSigterm);
      try { fs.closeSync(lock); } catch {}
      try { fs.rmSync(lockFile, { force: true }); } catch {}
      throw error;
    }
  })();
  let globalRun = args.runOffset + 1;
  try {
    fs.writeFileSync(entry, `import './__benchmark_hmr_probe__';\n${originalEntry}`);
    for (let session = 1; session <= args.sessions; session++) {
      const sessionNumber = args.sessionOffset + session;
      const baseline = `baseline-${args.timestamp}-${sessionNumber}`;
      fs.writeFileSync(target, probeSource(args.tool, baseline));
      assertPortFree(config.port);
      const logFile = path.join(logsDir, `${args.tool}_${args.size}_M4_${args.timestamp}_s${sessionNumber}.log`);
      const logFd = fs.openSync(logFile, 'w');
      const proc = spawn(config.cmd, config.args, {
        cwd: args.project,
        detached: true,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          VITE_APP_API_URL: 'http://localhost:8080/api',
          VITE_APP_ENABLE_API_MOCKING: 'true',
        },
        stdio: ['ignore', logFd, logFd],
        shell: false,
      });
      activeProc = proc;
      let browser: Browser | undefined;
      try {
        await waitForLog(logFile, config.readyPattern, proc, timeoutMs);
        browser = await puppeteer.launch({
          headless: true,
          executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        });
        activeBrowser = browser;
        const page = await browser.newPage();
        let hmrClientReadyCount = 0;
        let resolveHmrClient: (() => void) | undefined;
        const hmrClientReady = new Promise<void>(resolve => { resolveHmrClient = resolve; });
        page.on('console', message => {
          const text = message.text();
          fs.appendFileSync(logFile, `[browser:${message.type()}] ${text}\n`);
          if (/\[HMR\] Waiting for update signal from WDS/i.test(text)) {
            hmrClientReadyCount++;
            resolveHmrClient?.();
          }
        });
        page.on('pageerror', error => fs.appendFileSync(
          logFile,
          `[browser:error] ${error instanceof Error ? error.message : String(error)}\n`,
        ));
        await page.goto(`http://localhost:${config.port}`, { waitUntil: 'load', timeout: timeoutMs });
        await waitForMarker(page, baseline, timeoutMs);
        if (args.tool !== 'vite') await waitForHmrClient(hmrClientReady, timeoutMs);

        // Synchronize the browser with the server's latest compilation
        // generation before timing. Some dev servers emit an extra generation
        // while the initial page is loading, so their first update can only
        // recover by reloading. Reloads remain forbidden for measured runs.
        const warmupToken = randomUUID();
        const readyCountBeforeWarmup = hmrClientReadyCount;
        await page.evaluate(token => { (globalThis as { __hmrPageToken?: string }).__hmrPageToken = token; }, warmupToken);
        const warmupMarker = `warmup-${args.timestamp}-${sessionNumber}`;
        fs.writeFileSync(target, probeSource(args.tool, warmupMarker));
        await waitForMarker(page, warmupMarker, timeoutMs);
        const warmupSamePage = await page.evaluate(
          token => (globalThis as { __hmrPageToken?: string }).__hmrPageToken === token,
          warmupToken,
        );
        if (!warmupSamePage && args.tool !== 'vite') {
          await waitForCondition(
            () => hmrClientReadyCount > readyCountBeforeWarmup,
            timeoutMs,
            'Browser HMR client did not reconnect after synchronization reload',
          );
        }
        warmups.push({ session: sessionNumber, reloaded: !warmupSamePage });
        await sleep(500);

        for (let localRun = 0; localRun < runsPerSession; localRun++, globalRun++) {
          const pageToken = randomUUID();
          await page.evaluate(token => { (globalThis as { __hmrPageToken?: string }).__hmrPageToken = token; }, pageToken);
          const marker = `run-${args.timestamp}-${globalRun}`;
          const started = performance.now();
          fs.writeFileSync(target, probeSource(args.tool, marker));

          let value = -1;
          let failure: string | undefined;
          try {
            await waitForMarker(page, marker, timeoutMs);
            const samePage = await page.evaluate(
              token => (globalThis as { __hmrPageToken?: string }).__hmrPageToken === token,
              pageToken,
            );
            if (!samePage) {
              failure = 'full-page reload';
            } else {
              value = Math.round(performance.now() - started);
            }
          } catch {
            failure = 'DOM marker timeout';
          }

          fs.appendFileSync(
            args.csv,
          `${args.tool},${args.size},M4,${globalRun},${value},ms,${args.timestamp},${sessionNumber}\n`,
          );
          runSessions.push({ run: globalRun, session: sessionNumber, value, ...(failure ? { failure } : {}) });
          console.log(`Session ${sessionNumber}, run ${globalRun}: ${failure ?? `${value}ms`}`);
          await sleep(cooldownMs);
        }
      } finally {
        let cleanupError: unknown;
        if (browser) {
          try { await browser.close(); } catch (error) { cleanupError = error; }
          activeBrowser = undefined;
        }
        try { await stopProcess(proc); } catch (error) { cleanupError ??= error; }
        activeProc = undefined;
        try { fs.closeSync(logFd); } catch (error) { cleanupError ??= error; }
        if (cleanupError) throw cleanupError;
      }
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
    let cleanupError: unknown;
    try { restoreSources(); } catch (error) { cleanupError = error; }
    try { fs.closeSync(lock); } catch (error) { cleanupError ??= error; }
    try { fs.rmSync(lockFile, { force: true }); } catch (error) { cleanupError ??= error; }
    if (cleanupError) throw cleanupError;
  }

  const targetSha256After = hash(fs.readFileSync(entry, 'utf8'));
  const probeRestored = targetExisted
    ? fs.existsSync(target) && originalTarget !== undefined && hash(fs.readFileSync(target)) === hash(originalTarget)
    : !fs.existsSync(target);
  fs.writeFileSync(metadataFile, `${JSON.stringify({
    metric: 'M4',
    definition: 'self-accepted probe file write to exact browser-observed DOM marker without page reload',
    ...args,
    target,
    entry,
    targetSha256: originalHash,
    targetSha256After,
    probeExistedBefore: targetExisted,
    probeRestored,
    runsPerSession,
    timeoutMs,
    cooldownMs,
    command: [config.cmd, ...config.args],
    port: config.port,
    warmups,
    runSessions,
  }, null, 2)}\n`);

  if (originalHash !== targetSha256After) throw new Error('Target source was not restored');
  if (!probeRestored) throw new Error('HMR probe path was not restored');
  const currentRuns = runSessions.filter(run => replacedSessions.has(run.session));
  if (currentRuns.length !== args.runs || currentRuns.some(run => run.value < 0)) {
    throw new Error('Session batch failed validation: missing, timed-out, or full-reload runs');
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
