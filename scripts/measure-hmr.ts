/**
 * measure-hmr.ts — M4: HMR latency measurement via Puppeteer + CDP
 *
 * Starts the tool's dev server, launches Chrome, modifies a component,
 * and measures the time from file write to HMR completion.
 *
 * Detection: intercepts console messages from the HMR client:
 *   - Vite: "[vite] hot updated: ..."
 *   - Rspack/Webpack: "[webpack-dev-server] App updated"
 *
 * Only for tools with native HMR: Vite, Rspack, Webpack.
 *
 * Usage: npx tsx measure-hmr.ts --tool vite --project <dir> --runs 20 --csv <file> --size xs-50 --timestamp <ts>
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

function getDevConfig(tool: string) {
  switch (tool) {
    case 'vite':
      return {
        cmd: 'npx', args: ['vite'],
        readyPattern: /Local:\s+http:\/\/localhost:(\d+)/,
        defaultPort: 5173,
        hmrPattern: /\[vite\] hot updated/,
      };
    case 'rspack':
      return {
        cmd: 'npx', args: ['rspack', 'serve', '--config', 'rspack.config.cjs'],
        readyPattern: /compiled|Loopback:\s+http:\/\/localhost:(\d+)/,
        defaultPort: 3000,
        hmrPattern: /App updated|hot module replacement/i,
      };
    case 'webpack':
      return {
        cmd: 'npx', args: ['webpack', 'serve', '--mode', 'development', '--config', 'webpack.config.cjs'],
        readyPattern: /compiled|Loopback:\s+http:\/\/localhost:(\d+)/,
        defaultPort: 3000,
        hmrPattern: /App updated|hot module replacement/i,
      };
    default:
      throw new Error(`${tool} does not support HMR`);
  }
}

function findTargetComponent(projectDir: string): { filePath: string; componentName: string } {
  const featuresDir = path.join(projectDir, 'src', 'features');
  const folders = fs.readdirSync(featuresDir);
  for (const folder of folders) {
    const folderPath = path.join(featuresDir, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.tsx'));
    if (files.length > 0) {
      return {
        filePath: path.join(folderPath, files[0]),
        componentName: files[0].replace('.tsx', ''),
      };
    }
  }
  throw new Error('No .tsx file found');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForOutput(proc: ChildProcess, pattern: RegExp, timeoutMs = 60000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for dev server')), timeoutMs);
    let output = '';
    const handler = (data: Buffer) => {
      output += data.toString();
      const match = pattern.exec(output);
      if (match) {
        clearTimeout(timer);
        resolve(match[1] || '');
      }
    };
    proc.stdout?.on('data', handler);
    proc.stderr?.on('data', handler);
  });
}

async function main() {
  const args = parseArgs();
  const config = getDevConfig(args.tool);
  const target = findTargetComponent(args.project);
  const originalContent = fs.readFileSync(target.filePath, 'utf-8');

  // Write CSV header if file doesn't exist or is empty
  if (!fs.existsSync(args.csv) || fs.statSync(args.csv).size === 0) {
    fs.writeFileSync(args.csv, 'tool,size,metric,run,value,unit,timestamp\n');
  }

  console.log(`  Starting ${args.tool} dev server...`);

  const proc = spawn(config.cmd, config.args, {
    cwd: args.project,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' },
    shell: true,
  });

  // Wait for dev server to be ready
  let port = config.defaultPort;
  try {
    const portStr = await waitForOutput(proc, config.readyPattern);
    if (portStr && /^\d+$/.test(portStr)) {
      port = parseInt(portStr, 10);
    }
  } catch {
    console.error('  ❌ Dev server failed to start');
    proc.kill();
    process.exit(1);
  }

  console.log(`  Dev server ready on port ${port}`);
  await sleep(2000);

  // Launch Puppeteer with system Chrome
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.error('  ❌ Puppeteer not installed. Run: npm install -D puppeteer');
    proc.kill();
    process.exit(1);
  }

  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle0' });
  console.log(`  Page loaded. Starting HMR measurements...`);
  await sleep(1000);

  for (let run = 1; run <= args.runs; run++) {
    // Set up console message listener for HMR completion
    let hmrDetected = false;
    let hmrResolve: (() => void) | null = null;
    const hmrPromise = new Promise<void>(resolve => { hmrResolve = resolve; });

    const consoleHandler = (msg: any) => {
      const text = msg.text();
      if (config.hmrPattern.test(text)) {
        hmrDetected = true;
        hmrResolve?.();
      }
    };
    page.on('console', consoleHandler);

    const writeStart = Date.now();

    // Modify the component — append a unique comment + console.log
    const modifiedContent = originalContent +
      `\n// HMR-benchmark-run-${run}-${Date.now()}\n` +
      `if (import.meta.hot) { console.log('hmr-ping-${run}'); }\n`;
    fs.writeFileSync(target.filePath, modifiedContent);

    // Wait for HMR detection (max 15s)
    const timeout = setTimeout(() => hmrResolve?.(), 15000);
    await hmrPromise;
    clearTimeout(timeout);

    page.off('console', consoleHandler);

    const hmrTime = Date.now() - writeStart;

    if (hmrDetected) {
      fs.appendFileSync(args.csv, `${args.tool},${args.size},M4,${run},${hmrTime},ms,${args.timestamp}\n`);
      console.log(`  Run ${run}/${args.runs}: ${hmrTime}ms`);
    } else {
      fs.appendFileSync(args.csv, `${args.tool},${args.size},M4,${run},-1,ms,${args.timestamp}\n`);
      console.log(`  Run ${run}/${args.runs}: TIMEOUT (no HMR update detected)`);
    }

    // Revert file and wait for HMR to process revert
    fs.writeFileSync(target.filePath, originalContent);
    await sleep(2000);
  }

  // Cleanup
  fs.writeFileSync(target.filePath, originalContent);
  await browser.close();
  proc.kill('SIGTERM');
  await sleep(500);
  proc.kill('SIGKILL');
  console.log('  Dev server stopped.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
