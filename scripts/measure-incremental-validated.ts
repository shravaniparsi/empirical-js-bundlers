/**
 * M3: cache-warm incremental rebuild latency.
 *
 * Runs five independent watch sessions by default and retains one log plus
 * provenance metadata per campaign. All tools use unminified development mode.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';

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

interface WatchConfig {
  cmd: string;
  args: string[];
  readyPattern: RegExp;
  rebuildPattern: RegExp;
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

function watchConfig(tool: string): WatchConfig {
  switch (tool) {
    case 'vite':
      return {
        cmd: 'npx',
        args: ['vite', 'build', '--watch', '--mode', 'development', '--minify', 'false'],
        readyPattern: /built in/i,
        rebuildPattern: /built in/i,
      };
    case 'rspack':
      return {
        cmd: 'npx',
        args: ['rspack', 'build', '--watch', '--config', 'rspack.config.cjs'],
        readyPattern: /compiled successfully/i,
        rebuildPattern: /compiled successfully/i,
      };
    case 'webpack':
      return {
        cmd: 'npx',
        args: ['webpack', '--watch', '--config', 'webpack.config.cjs'],
        readyPattern: /compiled successfully/i,
        rebuildPattern: /compiled successfully/i,
      };
    case 'esbuild':
      return {
        cmd: 'node',
        args: ['configs/esbuild/watch.mjs'],
        readyPattern: /initial build finished \(0 errors\)/i,
        rebuildPattern: /build finished \(0 errors\)/i,
      };
    case 'rollup':
      return {
        cmd: 'node',
        args: ['--stack-size=65536', './node_modules/.bin/rollup', '-c', 'rollup.config.mjs', '-w'],
        readyPattern: /waiting for changes/i,
        rebuildPattern: /created dist/i,
      };
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

function findTarget(project: string): string {
  const appEntry = path.join(project, 'src', 'App.tsx');
  if (fs.existsSync(appEntry)) return appEntry;
  const synthetic = path.join(project, 'src', 'features');
  const root = fs.existsSync(synthetic) ? synthetic : path.join(project, 'src');
  const candidates: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '__tests__') walk(full);
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('test') &&
                 entry.name !== 'main.tsx' && entry.name !== 'index.tsx') {
        candidates.push(full);
      }
    }
  };
  walk(root);
  candidates.sort();
  if (!candidates.length) throw new Error(`No target .tsx file in ${root}`);
  return candidates[0];
}

function hash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function countMatches(file: string, pattern: RegExp): number {
  if (!fs.existsSync(file)) return 0;
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return fs.readFileSync(file, 'utf8').match(new RegExp(pattern.source, flags))?.length ?? 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForIncrease(
  file: string,
  pattern: RegExp,
  baseline: number,
  proc: ChildProcess,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (countMatches(file, pattern) > baseline) return true;
    if (proc.exitCode !== null) throw new Error(`Watch process exited with ${proc.exitCode}`);
    await sleep(10);
  }
  return false;
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
    if (active) throw new Error(`Active M3 lock owned by PID ${stalePid}`);
    fs.rmSync(file, { force: true });
    const descriptor = fs.openSync(file, 'wx');
    fs.writeFileSync(descriptor, `${process.pid}\n`);
    return descriptor;
  }
}

async function main() {
  const args = parseArgs();
  const config = watchConfig(args.tool);
  const target = findTarget(args.project);
  const original = fs.readFileSync(target, 'utf8');
  const originalHash = hash(original);
  const timeoutMs = args.size.startsWith('xl') ? 300_000 : 120_000;
  const cooldownMs = args.size.startsWith('xl') ? 5_000 : 2_000;
  const runsPerSession = args.runs / args.sessions;
  const logsDir = path.join(path.dirname(args.csv), 'logs');
  const lockFile = path.join(args.project, '.benchmark-m3.lock');
  const metadataFile = args.csv.replace(/\.csv$/, '.meta.json');
  fs.mkdirSync(logsDir, { recursive: true });

  const lock = acquireLock(lockFile);
  let activeProc: ChildProcess | undefined;
  let interrupted = false;
  const handleSignal = async (signal: 'SIGINT' | 'SIGTERM') => {
    if (interrupted) return;
    interrupted = true;
    try { fs.writeFileSync(target, original); } catch {}
    try { if (activeProc) await stopProcess(activeProc); } catch {}
    try { fs.closeSync(lock); } catch {}
    try { fs.rmSync(lockFile, { force: true }); } catch {}
    process.exit(signal === 'SIGINT' ? 130 : 143);
  };
  const onSigint = () => { void handleSignal('SIGINT'); };
  const onSigterm = () => { void handleSignal('SIGTERM'); };
  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigterm);
  const { replacedSessions, metadata } = (() => {
    try {
      const previousMetadata = args.append && fs.existsSync(metadataFile)
        ? JSON.parse(fs.readFileSync(metadataFile, 'utf8'))
        : undefined;
      const sessionsToReplace = new Set(
        Array.from({ length: args.sessions }, (_, index) => args.sessionOffset + index + 1),
      );
      if (args.append && fs.existsSync(args.csv)) {
        const [header, ...rows] = fs.readFileSync(args.csv, 'utf8').trim().split('\n');
        const retained = rows.filter(row => !sessionsToReplace.has(Number(row.split(',')[7])));
        fs.writeFileSync(args.csv, `${[header, ...retained].join('\n')}\n`);
      } else {
        fs.writeFileSync(args.csv, 'tool,size,metric,run,value,unit,timestamp,session\n');
      }
      return {
        replacedSessions: sessionsToReplace,
        metadata: {
          metric: 'M3',
          definition: 'file write to unminified development watch-build completion log',
          ...args,
          target,
          targetSha256: originalHash,
          targetSha256After: undefined as string | undefined,
          runsPerSession,
          cooldownMs,
          timeoutMs,
          command: [config.cmd, ...config.args],
          nodeEnv: 'development',
          runSessions: ((previousMetadata?.runSessions ?? []) as Array<{ run: number; session: number; value: number }>)
            .filter(run => !sessionsToReplace.has(run.session)),
        },
      };
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
    for (let session = 1; session <= args.sessions; session++) {
      const sessionNumber = args.sessionOffset + session;
      const logFile = path.join(logsDir, `${args.tool}_${args.size}_M3_${args.timestamp}_s${sessionNumber}.log`);
      const logFd = fs.openSync(logFile, 'w');
      const proc = spawn(config.cmd, config.args, {
        cwd: args.project,
        detached: true,
        env: { ...process.env, NODE_ENV: 'development' },
        stdio: ['ignore', logFd, logFd],
        shell: false,
      });
      activeProc = proc;
      try {
        const ready = await waitForIncrease(logFile, config.readyPattern, 0, proc, timeoutMs);
        if (!ready) throw new Error(`Session ${sessionNumber}: initial build timeout`);
        await sleep(cooldownMs);

        for (let localRun = 0; localRun < runsPerSession; localRun++, globalRun++) {
          const before = countMatches(logFile, config.rebuildPattern);
          const modified = `${original}\n// benchmark-m3-${args.timestamp}-s${sessionNumber}-r${globalRun}\nconsole.log('benchmark-m3-${globalRun}');\n`;
          const started = performance.now();
          fs.writeFileSync(target, modified);
          const completed = await waitForIncrease(logFile, config.rebuildPattern, before, proc, timeoutMs);
          const value = completed ? Math.round(performance.now() - started) : -1;
          fs.appendFileSync(
            args.csv,
            `${args.tool},${args.size},M3,${globalRun},${value},ms,${args.timestamp},${sessionNumber}\n`,
          );
          metadata.runSessions.push({ run: globalRun, session: sessionNumber, value });
          console.log(`Session ${sessionNumber}, run ${globalRun}: ${value < 0 ? 'TIMEOUT' : `${value}ms`}`);

          const revertBefore = countMatches(logFile, config.rebuildPattern);
          fs.writeFileSync(target, original);
          const reverted = await waitForIncrease(logFile, config.rebuildPattern, revertBefore, proc, timeoutMs);
          if (!reverted) throw new Error(`Session ${sessionNumber}, run ${globalRun}: revert timeout`);
          await sleep(cooldownMs);
        }
      } finally {
        let cleanupError: unknown;
        try { fs.writeFileSync(target, original); } catch (error) { cleanupError = error; }
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
    try { fs.writeFileSync(target, original); } catch (error) { cleanupError = error; }
    try { fs.closeSync(lock); } catch (error) { cleanupError ??= error; }
    try { fs.rmSync(lockFile, { force: true }); } catch (error) { cleanupError ??= error; }
    try {
      metadata['targetSha256After'] = hash(fs.readFileSync(target, 'utf8'));
      fs.writeFileSync(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`);
    } catch (error) {
      cleanupError ??= error;
    }
    if (cleanupError) throw cleanupError;
  }

  if (metadata.targetSha256 !== metadata['targetSha256After']) {
    throw new Error('Target source was not restored');
  }
  const currentRuns = metadata.runSessions.filter(run => replacedSessions.has(run.session));
  if (currentRuns.length !== args.runs || currentRuns.some(run => run.value < 0)) {
    throw new Error('Session batch failed validation: missing or timed-out runs');
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
