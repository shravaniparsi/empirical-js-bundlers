#!/usr/bin/env node
/** Per-cell ephemeral workspace seal for confirmatory-v2-cloud-m1. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { hashTree } from './confirmatory-cell-acceptance.mjs';

const ignoredNames = ['dist', 'node_modules', '.vite', '.rspack', '.cache'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function requiredFile(filename, label) {
  if (!fs.statSync(filename, { throwIfNoEntry: false })?.isFile()) throw new Error(`${label} is missing: ${filename}`);
  return fs.readFileSync(filename);
}

function gitCommit(cwd) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function sealCloudCellWorkspace({ workspace: workspaceArg, output: outputArg, blockId, attempt, family, workload, tool, repository = process.cwd() }) {
  if (process.version !== 'v24.14.0') throw new Error(`expected Node v24.14.0, received ${process.version}`);
  if (![blockId, family, workload, tool].every(value => typeof value === 'string' && value.length > 0)) throw new Error('blockId, family, workload, and tool are required');
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error('attempt must be a positive integer');
  const workspace = fs.realpathSync(workspaceArg);
  const output = path.resolve(outputArg);
  if (fs.existsSync(output)) throw new Error(`refusing to overwrite workspace seal: ${output}`);
  if (output === workspace || output.startsWith(`${workspace}${path.sep}`)) throw new Error('workspace seal must be stored outside the mutable workspace');
  const packageJson = requiredFile(path.join(workspace, 'package.json'), 'package manifest');
  const packageLock = requiredFile(path.join(workspace, 'package-lock.json'), 'dependency lock');
  const installedLock = requiredFile(path.join(workspace, 'node_modules', '.package-lock.json'), 'installed dependency lock');
  const seal = {
    schemaVersion: 1,
    kind: 'confirmatory-v2-cloud-cell-workspace-seal',
    protocol: 'confirmatory-v2-cloud-m1',
    publicationEligible: false,
    newPrimaryMeasurements: 0,
    createdAt: new Date().toISOString(),
    blockId,
    attempt,
    family,
    workload,
    tool,
    runtime: process.version,
    repositoryCommit: gitCommit(repository),
    workspace,
    ignoredNames,
    packageJsonSha256: sha256(packageJson),
    packageLockSha256: sha256(packageLock),
    installedDependencyLockSha256: sha256(installedLock),
    sourceAndConfigurationSha256: hashTree(workspace, new Set(ignoredNames)),
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(seal, null, 2)}\n`, { flag: 'wx' });
  return seal;
}

export function verifyCloudCellWorkspace({ workspace: workspaceArg, seal: sealArg, repository = process.cwd() }) {
  const workspace = fs.realpathSync(workspaceArg);
  const seal = JSON.parse(fs.readFileSync(sealArg, 'utf8'));
  const errors = [];
  const compare = (label, actual, expected) => { if (actual !== expected) errors.push(`${label} drift: expected ${expected}, received ${actual}`); };
  compare('kind', seal.kind, 'confirmatory-v2-cloud-cell-workspace-seal');
  compare('protocol', seal.protocol, 'confirmatory-v2-cloud-m1');
  compare('workspace', workspace, seal.workspace);
  compare('runtime', process.version, seal.runtime);
  compare('repository commit', gitCommit(repository), seal.repositoryCommit);
  try { compare('package manifest', sha256(requiredFile(path.join(workspace, 'package.json'), 'package manifest')), seal.packageJsonSha256); } catch (error) { errors.push(error.message); }
  try { compare('dependency lock', sha256(requiredFile(path.join(workspace, 'package-lock.json'), 'dependency lock')), seal.packageLockSha256); } catch (error) { errors.push(error.message); }
  try { compare('installed dependency lock', sha256(requiredFile(path.join(workspace, 'node_modules', '.package-lock.json'), 'installed dependency lock')), seal.installedDependencyLockSha256); } catch (error) { errors.push(error.message); }
  try { compare('source or configuration', hashTree(workspace, new Set(seal.ignoredNames)), seal.sourceAndConfigurationSha256); } catch (error) { errors.push(error.message); }
  return {
    schemaVersion: 1,
    kind: 'confirmatory-v2-cloud-cell-workspace-verification',
    protocol: seal.protocol,
    blockId: seal.blockId,
    attempt: seal.attempt,
    family: seal.family,
    workload: seal.workload,
    tool: seal.tool,
    publicationEligible: false,
    newPrimaryMeasurements: 0,
    errors,
    passed: errors.length === 0,
  };
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith('--') || argv[index + 1] === undefined) throw new Error('arguments must be --name value pairs');
    options[argv[index].slice(2)] = argv[index + 1];
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [action, ...rest] = process.argv.slice(2);
    const options = parseOptions(rest);
    if (!['seal', 'verify'].includes(action) || !options.workspace || !options.seal) throw new Error('usage: cloud-cell-workspace-seal.mjs seal|verify --workspace DIR --seal FILE [--block-id ID --attempt N --family NAME --workload NAME --tool NAME]');
    const result = action === 'seal'
      ? sealCloudCellWorkspace({ workspace: options.workspace, output: options.seal, blockId: options['block-id'], attempt: Number(options.attempt), family: options.family, workload: options.workload, tool: options.tool })
      : verifyCloudCellWorkspace({ workspace: options.workspace, seal: options.seal });
    console.log(JSON.stringify(result, null, 2));
    if (action === 'verify') process.exitCode = result.passed ? 0 : 1;
  } catch (error) { console.error(`ERROR: ${error.message}`); process.exitCode = 1; }
}
