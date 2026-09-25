/** Sequential production correctness sweep. Build durations are not research observations. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportDir = path.resolve(process.argv[2] ?? 'review/larger-correctness');
if (fs.existsSync(reportDir)) throw new Error('Choose a new report directory');
fs.mkdirSync(reportDir, { recursive: true });
const results = [];
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function run(command, args, cwd, log) {
  const fd = fs.openSync(path.join(reportDir, log), 'wx');
  try {
    const result = spawnSync(command, args, { cwd, env: process.env, stdio: ['ignore', fd, fd], timeout: 240000, killSignal: 'SIGTERM' });
    return { exitCode: result.status, signal: result.signal, error: result.error?.message };
  } finally { fs.closeSync(fd); }
}
for (const size of ['s-200', 'm-500', 'l-2000', 'xl-5000']) {
  for (const tool of ['vite', 'rspack', 'esbuild', 'webpack', 'rollup']) {
    const cell = `${tool}-${size}`, cwd = path.join(root, '.submission-pilot', `${size}-corrected${process.env.PILOT_REVISION ? '-' + process.env.PILOT_REVISION : ''}`, tool);
    const result = { tool, size, passed: false, historicalLockSha256: hash(path.join(cwd, 'package-lock.json')) };
    console.log(`Checking ${cell}`);
    const npmOptions = ['--no-audit', '--no-fund', '--registry=https://registry.npmjs.org', '--cache=/tmp/bundler-npm-cache'];
    result.install = run('npm', ['ci', ...npmOptions], cwd, `${cell}-install.log`);
    if (result.install.exitCode !== 0 && fs.readFileSync(path.join(reportDir, `${cell}-install.log`), 'utf8').includes('E404')) {
      // Preserve unavailable recovered locks; the replacement is pilot-only, never historical evidence.
      fs.renameSync(path.join(cwd, 'package-lock.json'), path.join(cwd, 'recovered-package-lock.json'));
      result.relock = run('npm', ['install', '--package-lock-only', '--ignore-scripts', ...npmOptions], cwd, `${cell}-relock.log`);
      result.install = run('npm', ['ci', ...npmOptions], cwd, `${cell}-new-install.log`);
      result.newlyResolvedLock = true;
    }
    result.lockSha256 = hash(path.join(cwd, 'package-lock.json'));
    if (result.install.exitCode === 0) {
      result.build = run('npm', ['run', 'build'], cwd, `${cell}-build.log`);
      if (result.build.exitCode === 0) {
        result.browser = run(process.execPath, [path.join(root, 'scripts/check-production-browser.mjs'), path.join(cwd, 'dist'), path.join(reportDir, `${cell}-browser.json`)], root, `${cell}-browser.log`);
        result.passed = result.browser.exitCode === 0;
      }
    }
    results.push(result);
    fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify({ kind: 'correctness-only-not-performance-data', results }, null, 2) + '\n');
    console.log(`${cell}: ${result.passed ? 'PASS' : 'FAIL'}`);
    if (process.env.PILOT_RELEASE_DEPENDENCIES === '1') fs.rmSync(path.join(cwd, 'node_modules'), { recursive: true, force: true });
  }
}
process.exitCode = results.every(result => result.passed) ? 0 : 1;
