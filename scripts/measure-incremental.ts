/**
 * measure-incremental.ts — M3: Incremental rebuild timing
 *
 * Starts the tool's watch/dev mode, modifies a component file,
 * measures time until rebuild completes, then reverts.
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
        readyPattern: /watching/i,
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
  // Try synthetic layout first (src/features/<folder>/*.tsx)
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
  // Fallback: find any .tsx in src/ (excluding test files, main.tsx, index.tsx)
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

async function waitForPattern(proc: ChildProcess, pattern: RegExp, timeoutMs = 60000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      proc.stdout?.removeListener('data', handler);
      proc.stderr?.removeListener('data', handler);
      resolve(false);
    }, timeoutMs);
    const handler = (data: Buffer) => {
      if (pattern.test(data.toString())) {
        clearTimeout(timer);
        proc.stdout?.removeListener('data', handler);
        proc.stderr?.removeListener('data', handler);
        resolve(true);
      }
    };
    proc.stdout?.on('data', handler);
    proc.stderr?.on('data', handler);
  });
}

async function waitForNextPattern(proc: ChildProcess, pattern: RegExp, timeoutMs = 60000): Promise<number> {
  const start = Date.now();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      proc.stdout?.removeListener('data', handler);
      proc.stderr?.removeListener('data', handler);
      resolve(-1);
    }, timeoutMs);
    const handler = (data: Buffer) => {
      if (pattern.test(data.toString())) {
        clearTimeout(timer);
        proc.stdout?.removeListener('data', handler);
        proc.stderr?.removeListener('data', handler);
        resolve(Date.now() - start);
      }
    };
    proc.stdout?.on('data', handler);
    proc.stderr?.on('data', handler);
  });
}

async function main() {
  const args = parseArgs();
  const config = getWatchCmd(args.tool);
  const targetFile = findTargetFile(args.project);
  const originalContent = fs.readFileSync(targetFile, 'utf-8');
  const modifiedContent = originalContent + `\n// benchmark-modification-${Date.now()}\nconsole.log('benchmark-ping');\n`;

  console.log(`  Starting ${args.tool} watch mode...`);
  console.log(`  Target file: ${path.basename(targetFile)}`);

  const proc = spawn(config.cmd, config.args, {
    cwd: args.project,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' },
    shell: true,
  });

  const ready = await waitForPattern(proc, config.readyPattern);
  if (!ready) {
    console.error('  ❌ Watch mode failed to start (60s timeout)');
    proc.kill();
    process.exit(1);
  }
  console.log('  Watch mode ready. Starting measurements...');

  await sleep(1000);

  for (let run = 1; run <= args.runs; run++) {
    // Modify file
    const modContent = originalContent + `\n// benchmark-run-${run}-${Date.now()}\nconsole.log('ping-${run}');\n`;
    
    const rebuildPromise = waitForNextPattern(proc, config.rebuildPattern);
    fs.writeFileSync(targetFile, modContent);
    
    const elapsed = await rebuildPromise;

    if (elapsed >= 0) {
      fs.appendFileSync(args.csv, `${args.tool},${args.size},M3,${run},${elapsed},ms,${args.timestamp}\n`);
      console.log(`  Run ${run}/${args.runs}: ${elapsed}ms`);
    } else {
      fs.appendFileSync(args.csv, `${args.tool},${args.size},M3,${run},-1,ms,${args.timestamp}\n`);
      console.log(`  Run ${run}/${args.runs}: TIMEOUT`);
    }

    // Revert and wait for the revert-rebuild to finish before next run
    const revertPromise = waitForNextPattern(proc, config.rebuildPattern, 60000);
    fs.writeFileSync(targetFile, originalContent);
    await revertPromise;
    await sleep(300);
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
