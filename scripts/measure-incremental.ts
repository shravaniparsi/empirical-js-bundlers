/**
 * measure-incremental.ts — M3: Incremental rebuild timing
 *
 * Starts the tool's watch/dev mode, modifies a component file,
 * measures time until rebuild completes, then reverts.
 *
 * Uses a persistent stdout listener to avoid pipe buffer issues
 * that cause timeouts at large project scales (xl-5000).
 *
 * Usage: npx tsx measure-incremental.ts --tool vite --project <dir> --runs 20 --csv <file> --size xs-50 --timestamp <ts>
 */

import { spawn, ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Args {
  tool: string;
  project: string;
  runs: number;
  csv: string;
  size: string;
  timestamp: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Partial<Args> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '') as keyof Args;
    result[key] = key === 'runs' ? parseInt(args[i + 1], 10) as any : args[i + 1];
  }
  return result as Args;
}

function getWatchCmd(tool: string): { cmd: string; args: string[]; readyPattern: RegExp; rebuildPattern: RegExp } {
  switch (tool) {
    case 'vite':
      return {
        cmd: 'npx', args: ['vite', 'build', '--watch'],
        readyPattern: /watching for file changes/i,
        rebuildPattern: /built in/i,
      };
    case 'rspack':
      return {
        cmd: 'npx', args: ['rspack', 'build', '--watch', '--config', 'rspack.config.cjs'],
        readyPattern: /compiled/i,
        rebuildPattern: /compiled/i,
      };
    case 'webpack':
      return {
        cmd: 'npx', args: ['webpack', '--watch', '--config', 'webpack.config.cjs'],
        readyPattern: /compiled successfully/i,
        rebuildPattern: /compiled successfully/i,
      };
    case 'esbuild':
      return {
        cmd: 'node', args: ['configs/esbuild/watch.mjs'],
        readyPattern: /initial build finished/i,
        rebuildPattern: /build finished/i,
      };
    case 'rollup':
      return {
        cmd: 'node', args: ['--stack-size=65536', './node_modules/.bin/rollup', '-c', 'rollup.config.mjs', '-w'],
        readyPattern: /waiting for changes/i,
        rebuildPattern: /created dist/i,
      };
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

function findTargetFile(projectDir: string): string {
  const featuresDir = path.join(projectDir, 'src', 'features');
  if (fs.existsSync(featuresDir)) {
    const folders = fs.readdirSync(featuresDir);
    for (const folder of folders) {
      const folderPath = path.join(featuresDir, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.tsx'));
      if (files.length > 0) {
        return path.join(folderPath, files[0]);
      }
    }
  }
  const srcDir = path.join(projectDir, 'src');
  function walk(dir: string): string | null {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = walk(full);
        if (found) return found;
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('test') &&
                 entry.name !== 'main.tsx' && entry.name !== 'index.tsx') {
        return full;
      }
    }
    return null;
  }
  const found = walk(srcDir);
  if (found) return found;
  throw new Error('No suitable .tsx file found in src/');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * PatternWatcher — persistent stdout/stderr listener that queues pattern matches.
 *
 * Unlike the old attach/remove approach, this keeps a single listener active
 * at all times, preventing pipe buffer stalls that caused timeouts at xl-5000.
 */
class PatternWatcher {
  private matchQueue: number[] = [];  // timestamps of pattern matches
  private waiters: Array<{ resolve: (ts: number) => void; timer: NodeJS.Timeout }> = [];
  private readyResolve: ((value: boolean) => void) | null = null;
  private readyTimer: NodeJS.Timeout | null = null;

  constructor(
    private proc: ChildProcess,
    private readyPattern: RegExp,
    private rebuildPattern: RegExp,
  ) {
    const handler = (data: Buffer) => {
      const text = data.toString();
      if (this.readyResolve && this.readyPattern.test(text)) {
        if (this.readyTimer) clearTimeout(this.readyTimer);
        const resolve = this.readyResolve;
        this.readyResolve = null;
        this.readyTimer = null;
        resolve(true);
      }
      if (this.rebuildPattern.test(text)) {
        const now = Date.now();
        if (this.waiters.length > 0) {
          const waiter = this.waiters.shift()!;
          clearTimeout(waiter.timer);
          waiter.resolve(now);
        } else {
          this.matchQueue.push(now);
        }
      }
    };
    proc.stdout?.on('data', handler);
    proc.stderr?.on('data', handler);
  }

  waitForReady(timeoutMs = 300000): Promise<boolean> {
    return new Promise((resolve) => {
      this.readyTimer = setTimeout(() => {
        this.readyResolve = null;
        resolve(false);
      }, timeoutMs);
      this.readyResolve = resolve;
    });
  }

  waitForRebuild(timeoutMs = 300000): Promise<number> {
    // If there's already a queued match, return it immediately
    if (this.matchQueue.length > 0) {
      return Promise.resolve(this.matchQueue.shift()!);
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.findIndex(w => w.timer === timer);
        if (idx >= 0) this.waiters.splice(idx, 1);
        resolve(-1);
      }, timeoutMs);
      this.waiters.push({ resolve, timer });
    });
  }

  // Drain any queued matches (e.g. from a revert rebuild we don't need to time)
  drain() {
    this.matchQueue.length = 0;
  }
}

async function main() {
  const args = parseArgs();
  const config = getWatchCmd(args.tool);
  const targetFile = findTargetFile(args.project);
  const originalContent = fs.readFileSync(targetFile, 'utf-8');

  // Scale-appropriate timeouts and cooldowns
  const isXL = args.size.startsWith('xl');
  const isL = args.size.startsWith('l');
  const rebuildTimeoutMs = isXL ? 300000 : isL ? 120000 : 60000;
  const cooldownMs = isXL ? 10000 : isL ? 5000 : 1000;

  console.log(`  Starting ${args.tool} watch mode...`);
  console.log(`  Target file: ${path.basename(targetFile)}`);
  console.log(`  Timeout: ${rebuildTimeoutMs/1000}s, Cooldown: ${cooldownMs/1000}s`);

  const proc = spawn(config.cmd, config.args, {
    cwd: args.project,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' },
    shell: true,
  });

  const watcher = new PatternWatcher(proc, config.readyPattern, config.rebuildPattern);

  const ready = await watcher.waitForReady();
  if (!ready) {
    console.error('  ❌ Watch mode failed to start (timeout)');
    proc.kill();
    process.exit(1);
  }
  console.log('  Watch mode ready. Starting measurements...');

  // Wait for any initial build to complete, then drain stale matches
  await sleep(3000);
  watcher.drain();

  for (let run = 1; run <= args.runs; run++) {
    const modContent = originalContent + `\n// benchmark-run-${run}-${Date.now()}\nconsole.log('ping-${run}');\n`;

    const startTime = Date.now();
    fs.writeFileSync(targetFile, modContent);

    const matchTime = await watcher.waitForRebuild(rebuildTimeoutMs);
    const elapsed = matchTime >= 0 ? matchTime - startTime : -1;

    if (elapsed >= 0) {
      fs.appendFileSync(args.csv, `${args.tool},${args.size},M3,${run},${elapsed},ms,${args.timestamp}\n`);
      console.log(`  Run ${run}/${args.runs}: ${elapsed}ms`);
    } else {
      fs.appendFileSync(args.csv, `${args.tool},${args.size},M3,${run},-1,ms,${args.timestamp}\n`);
      console.log(`  Run ${run}/${args.runs}: TIMEOUT`);
    }

    // Revert and wait for the revert-rebuild to finish before next run
    fs.writeFileSync(targetFile, originalContent);
    await watcher.waitForRebuild(rebuildTimeoutMs);

    // Cooldown: let the filesystem watcher re-stabilize
    await sleep(cooldownMs);

    // Drain any extra matches from the revert cycle
    watcher.drain();
  }

  // Cleanup
  fs.writeFileSync(targetFile, originalContent);
  proc.kill('SIGTERM');
  await sleep(500);
  proc.kill('SIGKILL');

  console.log('  Watch mode stopped.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
