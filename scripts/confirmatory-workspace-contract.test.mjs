#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectConfirmatoryWorkspace, sealConfirmatoryWorkspace, verifyConfirmatoryWorkspace } from './confirmatory-workspace-contract.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'confirmatory-workspaces-'));
const workloads = ['xs-50', 's-200', 'm-500', 'l-2000', 'xl-5000', 'bulletproof-react', 'memos', 'excalidraw'];
const tools = ['vite', 'rspack', 'esbuild', 'webpack', 'rollup'];
try {
  for (const workload of workloads) for (const tool of tools) {
    const workspace = path.join(root, workload, tool);
    fs.mkdirSync(path.join(workspace, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({ name: `${workload}-${tool}` }));
    fs.writeFileSync(path.join(workspace, 'package-lock.json'), '{"lockfileVersion":3}\n');
    fs.writeFileSync(path.join(workspace, 'node_modules', '.package-lock.json'), '{"packages":{}}\n');
    fs.writeFileSync(path.join(workspace, 'source.js'), 'export const unchanged = true;\n');
  }
  fs.mkdirSync(path.join(root, '_sources', 'memos'), { recursive: true });
  fs.mkdirSync(path.join(root, '_sources', 'excalidraw'), { recursive: true });
  fs.mkdirSync(path.join(root, '_support'), { recursive: true });
  fs.writeFileSync(path.join(root, '_support', 'memos-server'), 'fixture');
  assert.equal(inspectConfirmatoryWorkspace(root).passed, true);
  assert.equal(Object.keys(sealConfirmatoryWorkspace(root).cells).length, 40);
  assert.equal(verifyConfirmatoryWorkspace(root).passed, true);
  fs.mkdirSync(path.join(root, 'xs-50', 'vite', 'dist'));
  fs.writeFileSync(path.join(root, 'xs-50', 'vite', 'dist', 'ignored.js'), 'generated', { flag: 'w' });
  assert.equal(verifyConfirmatoryWorkspace(root, 'xs-50/vite').passed, true);
  fs.writeFileSync(path.join(root, 'xs-50', 'vite', 'source.js'), 'drift\n');
  assert.match(verifyConfirmatoryWorkspace(root, 'xs-50/vite').errors[0], /source or configuration drift/);
  fs.writeFileSync(path.join(root, 'xs-50', 'vite', 'source.js'), 'export const unchanged = true;\n');
  fs.writeFileSync(path.join(root, 'xs-50', 'vite', 'node_modules', '.package-lock.json'), 'drift\n');
  assert.match(verifyConfirmatoryWorkspace(root, 'xs-50/vite').errors[0], /installed dependency closure drift/);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
console.log('confirmatory workspace contract tests passed');
