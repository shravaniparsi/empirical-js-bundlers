#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'confirmatory-m3-session-'));
const workspace = path.join(fixture, 'workspace');
const evidenceDir = path.join(fixture, 'evidence');
try {
  fs.mkdirSync(path.join(workspace, 'src'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'configs/esbuild'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src/App.tsx'), 'export const App = () => null;\n');
  fs.writeFileSync(path.join(workspace, 'configs/esbuild/watch.mjs'), `
import fs from 'node:fs';
fs.mkdirSync('dist', { recursive: true });
let buildNumber = 0;
const build = (initial = false) => {
  buildNumber += 1;
  const entry = 'main-' + buildNumber + '.js';
  fs.writeFileSync('dist/' + entry, fs.readFileSync('src/App.tsx'));
  fs.writeFileSync('dist/.benchmark-current-files.json', JSON.stringify([entry]));
  fs.writeFileSync('dist/index.html', '<script type="module" src="/' + entry + '"></script>');
  console.log(initial ? 'esbuild: initial build finished (0 errors)' : 'esbuild: build finished (0 errors)');
};
build(true);
let timer;
fs.watch('src/App.tsx', () => { clearTimeout(timer); timer = setTimeout(() => build(false), 20); });
setInterval(() => {}, 1000);
`);
  const run = spawnSync(process.execPath, [
    path.join(root, 'scripts/confirmatory-incremental-session.mjs'),
    '--tool', 'esbuild',
    '--workspace', workspace,
    '--evidence-dir', evidenceDir,
    '--workload', 'xs-50',
    '--correctness-only',
  ], { cwd: root, encoding: 'utf8', timeout: 60_000 });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  const report = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'session.json'), 'utf8'));
  assert.equal(report.passed, true);
  assert.equal(report.correctnessOnly, true);
  assert.equal(report.publicationEligible, false);
  assert.equal(report.newPrimaryMeasurements, 0);
  assert.equal(report.edits.length, 6);
  assert.equal(report.edits[0].phase, 'warmup');
  assert(report.edits.every(edit => Number.isFinite(edit.diagnosticDurationMs)));
  assert.equal(Object.hasOwn(report, 'outcomes'), false);
  assert.equal(report.checks.oneWarmupAndFiveMeasuredCycles, true);
  assert.equal(report.checks.sourceRestored, true);
  assert.equal(report.checks.processTreeStopped, true);
  assert.equal(fs.readFileSync(path.join(workspace, 'src/App.tsx'), 'utf8'), 'export const App = () => null;\n');
  const lockedRun = spawnSync(process.execPath, [
    path.join(root, 'scripts/confirmatory-incremental-session.mjs'),
    '--tool', 'esbuild',
    '--workspace', workspace,
    '--evidence-dir', path.join(fixture, 'locked-primary-evidence'),
    '--workload', 'xs-50',
  ], { cwd: root, encoding: 'utf8', timeout: 10_000 });
  assert.notEqual(lockedRun.status, 0);
  assert.match(lockedRun.stderr, /locked until confirmatory-v2-cloud is frozen/);
  console.log('confirmatory M3 session correctness control passed');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
