#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { hashTree } from './confirmatory-cell-acceptance.mjs';

const workloads = ['xs-50', 's-200', 'm-500', 'l-2000', 'xl-5000', 'bulletproof-react', 'memos', 'excalidraw'];
const tools = ['vite', 'rspack', 'esbuild', 'webpack', 'rollup'];
const developmentWorkloads = ['xs-50', 'm-500', 'xl-5000', 'bulletproof-react', 'memos', 'excalidraw'];
const developmentTools = ['vite', 'rspack', 'webpack'];
const manifestName = 'confirmatory-workspaces.json';
const ignoredNames = ['dist', 'node_modules', '.vite', '.rspack', '.cache'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function inspectConfirmatoryWorkspace(rootArg) {
  const root = fs.realpathSync(rootArg);
  const cells = [];
  for (const workload of workloads) {
    for (const tool of tools) {
      const workspace = path.join(root, 'production', workload, tool);
      const required = ['package.json', 'package-lock.json'];
      const missing = required.filter(name => !fs.existsSync(path.join(workspace, name)));
      const hasDependencies = fs.existsSync(path.join(workspace, 'node_modules'));
      cells.push({ family: 'production', workload, tool, workspace, missing, hasDependencies, ready: missing.length === 0 && hasDependencies });
    }
  }
  for (const workload of developmentWorkloads) for (const tool of developmentTools) {
    const workspace = path.join(root, 'development', workload, tool);
    const required = ['package.json', 'package-lock.json'];
    const missing = required.filter(name => !fs.existsSync(path.join(workspace, name)));
    const hasDependencies = fs.existsSync(path.join(workspace, 'node_modules'));
    cells.push({ family: 'development', workload, tool, workspace, missing, hasDependencies, ready: missing.length === 0 && hasDependencies });
  }
  const support = {
    memosSource: fs.statSync(path.join(root, '_sources', 'memos'), { throwIfNoEntry: false })?.isDirectory() === true,
    memosBackend: fs.statSync(path.join(root, '_support', 'memos-server'), { throwIfNoEntry: false })?.isFile() === true,
    excalidrawSource: fs.statSync(path.join(root, '_sources', 'excalidraw'), { throwIfNoEntry: false })?.isDirectory() === true,
  };
  const missingCells = cells.filter(cell => !cell.ready).map(cell => `${cell.family}/${cell.workload}/${cell.tool}`);
  const passed = missingCells.length === 0 && Object.values(support).every(Boolean);
  return {
    schemaVersion: 1,
    kind: 'confirmatory-primary-workspace-contract',
    root,
    expectedCells: cells.length,
    readyCells: cells.length - missingCells.length,
    missingCells,
    support,
    publicationEligible: false,
    passed,
  };
}

export function sealConfirmatoryWorkspace(rootArg) {
  const inspection = inspectConfirmatoryWorkspace(rootArg);
  if (!inspection.passed) throw new Error(`workspace is incomplete: ${inspection.missingCells.join(', ')}`);
  const cells = {};
  const planned = [
    ...workloads.flatMap(workload => tools.map(tool => ['production', workload, tool])),
    ...developmentWorkloads.flatMap(workload => developmentTools.map(tool => ['development', workload, tool])),
  ];
  for (const [family, workload, tool] of planned) {
    const key = `${family}/${workload}/${tool}`;
    const workspace = path.join(inspection.root, family, workload, tool);
    const dependencyLock = path.join(workspace, 'node_modules', '.package-lock.json');
    if (!fs.existsSync(dependencyLock)) throw new Error(`${key} has no installed dependency lock`);
    cells[key] = {
      sourceAndConfigurationSha256: hashTree(workspace, new Set(ignoredNames)),
      installedDependencyLockSha256: sha256(fs.readFileSync(dependencyLock)),
    };
  }
  const manifest = {
    schemaVersion: 1,
    kind: 'confirmatory-primary-workspace-seal',
    root: inspection.root,
    runtime: process.version,
    createdAt: new Date().toISOString(),
    ignoredNames,
    cells,
    support: inspection.support,
    publicationEligible: false,
  };
  fs.writeFileSync(path.join(inspection.root, manifestName), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  return manifest;
}

export function verifyConfirmatoryWorkspace(rootArg, selectedKey = null) {
  const root = fs.realpathSync(rootArg);
  const manifestPath = path.join(root, manifestName);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.kind !== 'confirmatory-primary-workspace-seal' || manifest.root !== root) throw new Error('invalid workspace seal');
  if (manifest.runtime !== process.version) throw new Error(`workspace sealed with ${manifest.runtime}; running ${process.version}`);
  const keys = selectedKey ? [selectedKey] : Object.keys(manifest.cells).sort();
  const errors = [];
  for (const key of keys) {
    const expected = manifest.cells[key];
    if (!expected) { errors.push(`${key}: absent from workspace seal`); continue; }
    const workspace = path.join(root, key);
    try {
      const actualTree = hashTree(workspace, new Set(manifest.ignoredNames));
      if (actualTree !== expected.sourceAndConfigurationSha256) errors.push(`${key}: source or configuration drift`);
      const dependencyLock = fs.readFileSync(path.join(workspace, 'node_modules', '.package-lock.json'));
      if (sha256(dependencyLock) !== expected.installedDependencyLockSha256) errors.push(`${key}: installed dependency closure drift`);
    } catch (error) { errors.push(`${key}: ${error.message}`); }
  }
  return { schemaVersion: 1, kind: 'confirmatory-primary-workspace-verification', root, checkedCells: keys.length, errors, publicationEligible: false, passed: errors.length === 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [action, root, key] = process.argv.slice(2);
  if (!['inspect', 'seal', 'verify'].includes(action) || !root) throw new Error('usage: confirmatory-workspace-contract.mjs inspect|seal|verify <workspace-root> [workload/tool]');
  const report = action === 'inspect' ? inspectConfirmatoryWorkspace(root) : action === 'seal' ? sealConfirmatoryWorkspace(root) : verifyConfirmatoryWorkspace(root, key);
  console.log(JSON.stringify(report, null, 2));
  if (action !== 'seal') process.exitCode = report.passed ? 0 : 1;
}
