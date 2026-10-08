#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sealCloudCellWorkspace, verifyCloudCellWorkspace } from './cloud-cell-workspace-seal.mjs';

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'cloud-workspace-seal-'));
const workspace = path.join(fixture, 'workspace');
const evidence = path.join(fixture, 'evidence');
fs.mkdirSync(path.join(workspace, 'node_modules'), { recursive: true });
fs.mkdirSync(evidence);
fs.writeFileSync(path.join(workspace, 'package.json'), '{"name":"fixture"}\n');
fs.writeFileSync(path.join(workspace, 'package-lock.json'), '{"lockfileVersion":3}\n');
fs.writeFileSync(path.join(workspace, 'node_modules', '.package-lock.json'), '{"lockfileVersion":3,"packages":{}}\n');
fs.writeFileSync(path.join(workspace, 'source.js'), 'export const value = 1;\n');
const sealPath = path.join(evidence, 'workspace-seal.json');

try {
  sealCloudCellWorkspace({ workspace, output: sealPath, blockId: 'M3|xs-50|b01', attempt: 1, family: 'M3', workload: 'xs-50', tool: 'vite', repository: path.resolve('.') });
  assert.equal(verifyCloudCellWorkspace({ workspace, seal: sealPath }).passed, true);
  fs.writeFileSync(path.join(workspace, 'dist'), 'ignored output');
  assert.equal(verifyCloudCellWorkspace({ workspace, seal: sealPath }).passed, true);
  fs.writeFileSync(path.join(workspace, 'source.js'), 'export const value = 2;\n');
  const sourceDrift = verifyCloudCellWorkspace({ workspace, seal: sealPath });
  assert.equal(sourceDrift.passed, false);
  assert(sourceDrift.errors.some(error => error.startsWith('source or configuration drift')));
  fs.writeFileSync(path.join(workspace, 'source.js'), 'export const value = 1;\n');
  fs.writeFileSync(path.join(workspace, 'node_modules', '.package-lock.json'), '{"drift":true}\n');
  const dependencyDrift = verifyCloudCellWorkspace({ workspace, seal: sealPath });
  assert.equal(dependencyDrift.passed, false);
  assert(dependencyDrift.errors.some(error => error.startsWith('installed dependency lock drift')));
  console.log('cloud cell workspace seal controls passed');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
