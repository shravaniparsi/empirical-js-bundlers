import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const reports = path.resolve(process.argv[2] ?? 'review/realworld-correctness');
if (fs.existsSync(reports)) throw new Error('Choose a new report directory');
fs.mkdirSync(reports, { recursive: true });
const results = [];
for (const tool of ['rspack', 'esbuild', 'webpack', 'rollup']) {
  const workspace = path.resolve('.submission-pilot/bulletproof-corrected-v1', tool);
  const result = { tool, passed: false };
  const run = (command, args, stage, cwd = workspace) => {
    const log = fs.openSync(path.join(reports, `${tool}-${stage}.log`), 'wx');
    try { const r = spawnSync(command, args, { cwd, env: process.env, stdio: ['ignore', log, log], timeout: 240000 });return { code: r.status, error: r.error?.message }; }
    finally { fs.closeSync(log); }
  };
  const npmArgs = ['--no-audit', '--no-fund', '--registry=https://registry.npmjs.org', '--cache=/tmp/bundler-npm-cache'];
  console.log(`Checking real-world ${tool}`);
  result.install = run('npm', ['ci', ...npmArgs], 'install');
  if (result.install.code !== 0 && fs.readFileSync(path.join(reports, `${tool}-install.log`), 'utf8').includes('E404')) {
    fs.renameSync(path.join(workspace, 'package-lock.json'), path.join(workspace, 'recovered-package-lock.json'));
    result.relock = run('npm', ['install', '--package-lock-only', '--ignore-scripts', ...npmArgs], 'relock');
    result.install = run('npm', ['ci', ...npmArgs], 'new-install');
  }
  if (result.install.code === 0) {
    result.build = run('npm', ['run', 'build'], 'build');
    if (result.build.code === 0) {
      result.browser = run(process.execPath, ['scripts/check-realworld-browser.mjs', path.join(workspace, 'dist'), path.join(reports, `${tool}-browser.json`)], 'browser', process.cwd());
      result.passed = result.browser.code === 0;
    }
  }
  results.push(result);fs.writeFileSync(path.join(reports, 'summary.json'), JSON.stringify({ kind: 'correctness-only-local-fixture-api', results }, null, 2) + '\n');
  console.log(`${tool}: ${result.passed ? 'PASS' : 'FAIL'}`);
  if (result.passed) fs.rmSync(path.join(workspace, 'node_modules'), { recursive: true, force: true });
}
process.exitCode = results.every(result => result.passed) ? 0 : 1;
