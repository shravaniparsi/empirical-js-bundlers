#!/usr/bin/env node
/** Finalize and validate one immutable confirmatory-v2-cloud block artifact. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filename, label = filename) {
  try { return JSON.parse(fs.readFileSync(filename, 'utf8')); }
  catch (error) { throw new Error(`${label} is missing or invalid: ${error.message}`); }
}

function gitCommit(repository) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function walkFiles(root, excluded = new Set()) {
  const files = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(current, entry.name);
      const relative = path.relative(root, filename).split(path.sep).join('/');
      if (excluded.has(relative)) continue;
      if (entry.isSymbolicLink()) throw new Error(`artifact contains symlink: ${relative}`);
      if (entry.isDirectory()) walk(filename);
      else if (entry.isFile()) {
        const bytes = fs.readFileSync(filename);
        files.push({ path: relative, bytes: bytes.length, sha256: sha256(bytes) });
      } else throw new Error(`artifact contains unsupported entry: ${relative}`);
    }
  };
  walk(root);
  return files;
}

function matchingCellReports(toolDir, block, tool) {
  if (!fs.statSync(toolDir, { throwIfNoEntry: false })?.isDirectory()) return [];
  return walkFiles(toolDir).filter(file => file.path.endsWith('.json')).flatMap(file => {
    const filename = path.join(toolDir, file.path);
    let report;
    try { report = readJson(filename); } catch { return []; }
    const metricMatches = report.metric === block.metric || (block.metric === 'M2-M10-M11' && report.metricFamily === block.metric);
    return report.tool === tool && report.workload === block.workload && metricMatches ? [{ filename, report }] : [];
  });
}

function verifyFreeze(repository, freeze) {
  if (freeze.protocol !== 'confirmatory-v2-cloud-m1' || typeof freeze.files !== 'object') throw new Error('invalid confirmatory-v2-cloud freeze manifest');
  for (const [relative, expected] of Object.entries(freeze.files)) {
    const filename = path.resolve(repository, relative);
    if (!filename.startsWith(`${repository}${path.sep}`) || !fs.statSync(filename, { throwIfNoEntry: false })?.isFile()) throw new Error(`frozen file is missing: ${relative}`);
    if (sha256(fs.readFileSync(filename)) !== expected) throw new Error(`frozen file drift: ${relative}`);
  }
}

export function finalizeCloudBlockArtifact({
  attemptDir: attemptDirArg,
  blockId,
  attempt,
  status = 'passed',
  failureReason,
  correctnessOnly = false,
  repository: repositoryArg = scriptRoot,
}) {
  if (process.version !== 'v24.14.0') throw new Error(`expected Node v24.14.0, received ${process.version}`);
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error('attempt must be a positive integer');
  if (!['passed', 'failed'].includes(status)) throw new Error('status must be passed or failed');
  if (status === 'failed' && (!failureReason || !failureReason.trim())) throw new Error('failed attempts require a failure reason');
  const repository = fs.realpathSync(repositoryArg);
  const attemptDir = fs.realpathSync(attemptDirArg);
  const manifestPath = path.join(attemptDir, 'block-manifest.json');
  if (fs.existsSync(manifestPath)) throw new Error('refusing to overwrite block manifest');
  const protocolPath = path.join(repository, 'protocols/confirmatory-v2-cloud/protocol.json');
  const schedulePath = path.join(repository, 'protocols/confirmatory-v2-cloud/schedule.json');
  const protocolBytes = fs.readFileSync(protocolPath);
  const scheduleBytes = fs.readFileSync(schedulePath);
  const protocol = JSON.parse(protocolBytes);
  const schedule = JSON.parse(scheduleBytes);
  const block = schedule.blocks.find(candidate => candidate.blockId === blockId);
  if (protocol.id !== 'confirmatory-v2-cloud-m1' || schedule.protocol !== protocol.id || !block) throw new Error('block does not belong to the active cloud protocol');
  let freezeSha256 = null;
  if (!correctnessOnly) {
    const freezePath = path.join(repository, 'protocols/confirmatory-v2-cloud/FREEZE.json');
    const freezeBytes = fs.readFileSync(freezePath);
    verifyFreeze(repository, JSON.parse(freezeBytes));
    freezeSha256 = sha256(freezeBytes);
  }
  const preBlockPath = path.join(attemptDir, 'pre-block-host.json');
  const preBlock = readJson(preBlockPath, 'pre-block environment report');
  if (preBlock.pass !== true && preBlock.passed !== true) throw new Error('pre-block environment gate did not pass');
  if (preBlock.identity?.imageOS !== 'macos15' || !preBlock.identity?.imageVersion) throw new Error('pre-block runner identity does not match macos-15');
  const postBlockPath = path.join(attemptDir, 'post-block-host.json');
  if (!correctnessOnly && !fs.statSync(postBlockPath, { throwIfNoEntry: false })?.isFile()) throw new Error('primary block artifact requires post-block-host.json');
  if (!correctnessOnly) {
    const postBlock = readJson(postBlockPath, 'post-block environment report');
    if (postBlock.phase !== 'post' || postBlock.fingerprintSha256 !== preBlock.fingerprintSha256) throw new Error('post-block report does not describe the same runner');
  }

  const cells = [];
  let stopped = false;
  for (const tool of block.toolOrder) {
    const matches = matchingCellReports(path.join(attemptDir, tool), block, tool);
    if (matches.length === 0) {
      if (status === 'failed') { stopped = true; break; }
      throw new Error(`missing cell report for ${tool}`);
    }
    if (matches.length !== 1) throw new Error(`ambiguous cell reports for ${tool}`);
    if (stopped) throw new Error(`cell ${tool} appears after the failed prefix`);
    const { filename, report } = matches[0];
    const accepted = report.accepted === true || report.passed === true;
    if (report.publicationEligible !== false) throw new Error(`${tool} cell has invalid publication eligibility`);
    if (correctnessOnly) {
      if (report.newPrimaryMeasurements !== 0 || Object.hasOwn(report, 'outcomes')) throw new Error(`${tool} correctness cell contains a primary outcome`);
    } else if (!Object.hasOwn(report, 'outcomes')) throw new Error(`${tool} primary cell is missing outcomes`);
    const bytes = fs.readFileSync(filename);
    cells.push({
      tool,
      accepted,
      report: path.relative(attemptDir, filename).split(path.sep).join('/'),
      reportBytes: bytes.length,
      reportSha256: sha256(bytes),
    });
    if (!accepted) stopped = true;
  }
  if (status === 'passed' && (cells.length !== block.toolOrder.length || cells.some(cell => !cell.accepted))) throw new Error('passed block is incomplete or contains a failed cell');
  if (status === 'failed' && cells.every(cell => cell.accepted) && cells.length === block.toolOrder.length) throw new Error('failed block contains no failed or missing cell');

  const manifest = {
    schemaVersion: 1,
    kind: correctnessOnly ? 'confirmatory-v2-cloud-block-correctness-artifact' : 'confirmatory-v2-cloud-block-artifact',
    protocol: protocol.id,
    publicationEligible: false,
    newPrimaryMeasurements: correctnessOnly ? 0 : cells.filter(cell => cell.accepted).length,
    createdAt: new Date().toISOString(),
    blockId,
    metric: block.metric,
    workload: block.workload,
    block: block.block,
    attempt,
    status,
    failureReason: status === 'failed' ? failureReason : null,
    toolOrder: block.toolOrder,
    repositoryCommit: gitCommit(repository),
    protocolSha256: sha256(protocolBytes),
    scheduleSha256: sha256(scheduleBytes),
    freezeSha256,
    runner: {
      imageOS: preBlock.identity.imageOS,
      imageVersion: preBlock.identity.imageVersion,
      architecture: preBlock.identity.architecture,
      cpuModel: preBlock.identity.cpuModel,
      logicalCores: preBlock.identity.logicalCores,
      memoryBytes: preBlock.identity.memoryBytes,
      macos: preBlock.diagnostics?.swvers ?? null,
      chrome: preBlock.diagnostics?.chromeVersion ?? null,
      node: preBlock.checks?.node?.actual ?? null,
    },
    cells,
    files: walkFiles(attemptDir, new Set(['block-manifest.json'])),
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  return manifest;
}

export function validateCloudBlockArtifact({ attemptDir: attemptDirArg, repository: repositoryArg = scriptRoot }) {
  const attemptDir = fs.realpathSync(attemptDirArg);
  const repository = fs.realpathSync(repositoryArg);
  const manifest = readJson(path.join(attemptDir, 'block-manifest.json'), 'block manifest');
  const errors = [];
  const schedule = readJson(path.join(repository, 'protocols/confirmatory-v2-cloud/schedule.json'), 'cloud schedule');
  const block = schedule.blocks?.find(candidate => candidate.blockId === manifest.blockId);
  if (!block || manifest.protocol !== 'confirmatory-v2-cloud-m1') errors.push('manifest block or protocol identity invalid');
  if (manifest.publicationEligible !== false) errors.push('block artifact has invalid publication eligibility');
  if (block && JSON.stringify(manifest.toolOrder) !== JSON.stringify(block.toolOrder)) errors.push('manifest tool order differs from schedule');
  const manifestCells = manifest.cells ?? [];
  const cellTools = manifestCells.map(cell => cell.tool);
  if (block && JSON.stringify(cellTools) !== JSON.stringify(block.toolOrder.slice(0, cellTools.length))) errors.push('cell order is not a scheduled prefix');
  if (manifest.status === 'passed' && (cellTools.length !== block?.toolOrder.length || manifestCells.some(cell => !cell.accepted))) errors.push('passed manifest is incomplete');
  if (manifest.status === 'failed' && (!manifest.failureReason || (cellTools.length === block?.toolOrder.length && manifestCells.every(cell => cell.accepted)))) errors.push('failed manifest has no authenticated failure');
  if (!['passed', 'failed'].includes(manifest.status)) errors.push('invalid manifest status');
  const actualPaths = walkFiles(attemptDir, new Set(['block-manifest.json'])).map(file => file.path);
  const declaredPaths = (manifest.files ?? []).map(file => file.path);
  if (JSON.stringify(actualPaths) !== JSON.stringify(declaredPaths)) errors.push('artifact file inventory mismatch');
  for (const file of manifest.files ?? []) {
    const filename = path.resolve(attemptDir, file.path);
    if (!filename.startsWith(`${attemptDir}${path.sep}`) || !fs.statSync(filename, { throwIfNoEntry: false })?.isFile()) { errors.push(`missing or unsafe file: ${file.path}`); continue; }
    const bytes = fs.readFileSync(filename);
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) errors.push(`file hash mismatch: ${file.path}`);
  }
  for (const cell of manifestCells) {
    const filename = path.resolve(attemptDir, cell.report);
    if (!filename.startsWith(`${attemptDir}${path.sep}`) || !fs.statSync(filename, { throwIfNoEntry: false })?.isFile()) { errors.push(`missing cell report: ${cell.tool}`); continue; }
    const bytes = fs.readFileSync(filename);
    if (bytes.length !== cell.reportBytes || sha256(bytes) !== cell.reportSha256) errors.push(`cell report hash mismatch: ${cell.tool}`);
    else {
      const report = readJson(filename);
      const metricMatches = report.metric === manifest.metric || (manifest.metric === 'M2-M10-M11' && report.metricFamily === manifest.metric);
      if (report.tool !== cell.tool || report.workload !== manifest.workload || !metricMatches || report.publicationEligible !== false) errors.push(`cell report identity invalid: ${cell.tool}`);
      if (manifest.kind.endsWith('correctness-artifact') && (report.newPrimaryMeasurements !== 0 || Object.hasOwn(report, 'outcomes'))) errors.push(`correctness report contains primary outcomes: ${cell.tool}`);
      if (!manifest.kind.endsWith('correctness-artifact') && !Object.hasOwn(report, 'outcomes')) errors.push(`primary report is missing outcomes: ${cell.tool}`);
    }
  }
  if (new Set((manifest.files ?? []).map(file => file.path)).size !== manifest.files?.length) errors.push('duplicate artifact file path');
  if (new Set((manifest.cells ?? []).map(cell => cell.tool)).size !== manifest.cells?.length) errors.push('duplicate cell identity');
  return { valid: errors.length === 0, errors, manifest };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index]?.startsWith('--')) throw new Error(`unexpected argument ${argv[index]}`);
    const name = argv[index].slice(2);
    if (name === 'correctness-only') options[name] = true;
    else if (argv[index + 1] === undefined || argv[index + 1].startsWith('--')) throw new Error(`missing value for --${name}`);
    else options[name] = argv[++index];
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [action, ...rest] = process.argv.slice(2);
    const options = parseArgs(rest);
    if (!options['attempt-dir']) throw new Error('usage: cloud-block-artifact.mjs finalize|validate --attempt-dir DIR [--block-id ID --attempt N --status passed|failed --failure-reason TEXT --correctness-only]');
    const result = action === 'finalize'
      ? finalizeCloudBlockArtifact({ attemptDir: options['attempt-dir'], blockId: options['block-id'], attempt: Number(options.attempt), status: options.status, failureReason: options['failure-reason'], correctnessOnly: Boolean(options['correctness-only']) })
      : action === 'validate' ? validateCloudBlockArtifact({ attemptDir: options['attempt-dir'] }) : (() => { throw new Error(`unknown action ${action}`); })();
    console.log(JSON.stringify(result, null, 2));
    if (action === 'validate' && !result.valid) process.exitCode = 1;
  } catch (error) { console.error(`ERROR: ${error.message}`); process.exitCode = 1; }
}
