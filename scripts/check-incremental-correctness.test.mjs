#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = mkdtempSync(path.join(os.tmpdir(), 'incremental-correctness-fixture-'));
try {
  mkdirSync(path.join(workspace, 'src'), { recursive: true });
  mkdirSync(path.join(workspace, 'configs/esbuild'), { recursive: true });
  writeFileSync(path.join(workspace, 'src/App.tsx'), 'export const App = () => null;\n');
  writeFileSync(path.join(workspace, 'configs/esbuild/watch.mjs'), `
import fs from 'node:fs';
fs.mkdirSync('dist', { recursive: true });
const build = (initial = false) => {
  fs.writeFileSync('dist/main.js', fs.readFileSync('src/App.tsx'));
  console.log(initial ? 'esbuild: initial build finished (0 errors)' : 'esbuild: build finished (0 errors)');
};
build(true);
let timer;
fs.watch('src/App.tsx', () => {
  clearTimeout(timer);
  timer = setTimeout(() => build(false), 20);
});
setInterval(() => {}, 1000);
`);
  const reportPath = path.join(workspace, 'evidence', 'acceptance.json');
  const run = spawnSync(process.execPath, [path.join(root, 'scripts/check-incremental-correctness.mjs'), 'esbuild', workspace, reportPath], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  const reportText = readFileSync(reportPath, 'utf8');
  const report = JSON.parse(reportText);
  assert.equal(report.passed, true);
  assert.equal(report.publicationEligible, false);
  assert.equal(report.edits.length, 3);
  assert.equal(report.checks.sourceRestored, true);
  assert.equal(report.checks.processTreeStopped, true);
  assert.doesNotMatch(reportText, /durationMs|completedNs|startedNs|completionLine/);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

console.log('incremental correctness harness integration test passed');
