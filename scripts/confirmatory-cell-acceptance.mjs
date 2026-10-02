import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const hash = (value) => createHash('sha256').update(value).digest('hex');

export function hashTree(root, ignoredNames = new Set(['dist', 'node_modules'])) {
  const resolved = fs.realpathSync(root);
  const rows = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (ignoredNames.has(entry.name)) continue;
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) walk(filename);
      else if (entry.isFile()) rows.push(`${path.relative(resolved, filename).split(path.sep).join('/')}\0${hash(fs.readFileSync(filename))}`);
      else throw new Error(`unsupported source entry: ${filename}`);
    }
  };
  walk(resolved);
  return hash(`${rows.join('\n')}\n`);
}

export function parseMacOSTimeOutput(text) {
  if (typeof text !== 'string') throw new Error('timing output must be text');
  const cpu = [...text.matchAll(/^\s*(\d+(?:\.\d+)?)\s+real\s+(\d+(?:\.\d+)?)\s+user\s+(\d+(?:\.\d+)?)\s+sys\s*$/gm)];
  const rss = [...text.matchAll(/^\s*(\d+)\s+maximum resident set size\s*$/gm)];
  if (cpu.length !== 1 || rss.length !== 1) throw new Error('malformed or ambiguous macOS time output');
  const [realSeconds, userSeconds, systemSeconds] = cpu[0].slice(1).map(Number);
  const rssBytes = Number(rss[0][1]);
  if (![realSeconds, userSeconds, systemSeconds, rssBytes].every(Number.isFinite) || realSeconds <= 0 || userSeconds < 0 || systemSeconds < 0 || rssBytes <= 0) {
    throw new Error('invalid macOS time values');
  }
  return { realSeconds, userSeconds, systemSeconds, rssBytes };
}

export function processGroupAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('invalid process-group pid');
  try { process.kill(-pid, 0); return true; } catch { return false; }
}

export function acceptConfirmatoryCell(input) {
  const required = ['sourcePath', 'sourceBeforeSha256', 'processGroupPid', 'actionStartedNs', 'completionObservedNs'];
  for (const name of required) if (input[name] === undefined || input[name] === null) throw new Error(`missing ${name}`);
  const sourceAfterSha256 = hash(fs.readFileSync(input.sourcePath));
  if (sourceAfterSha256 !== input.sourceBeforeSha256) throw new Error('source drift detected');
  if (processGroupAlive(input.processGroupPid)) throw new Error('orphan process group detected');
  const actionStartedNs = BigInt(input.actionStartedNs);
  const completionObservedNs = BigInt(input.completionObservedNs);
  if (completionObservedNs <= actionStartedNs) throw new Error('stale completion detected');
  if (!input.marker || !Array.isArray(input.outputPaths) || input.outputPaths.length === 0) throw new Error('missing output identity evidence');
  const markerMatches = input.outputPaths.filter(file => fs.existsSync(file) && fs.readFileSync(file).includes(input.marker));
  if (markerMatches.length === 0) throw new Error('output marker not found');
  if (input.timingText !== undefined) parseMacOSTimeOutput(input.timingText);
  if (input.hmr) {
    if (!input.hmr.documentPreserved) throw new Error('full-page reload detected');
    if (!input.hmr.statePreserved) throw new Error('application state loss detected');
    if (!input.hmr.reloadControlDetected) throw new Error('reload detector control failed');
  }
  return {
    accepted: true,
    sourceAfterSha256,
    completionFresh: true,
    outputIdentityVerified: true,
    processTreeStopped: true,
    hmrValidated: input.hmr !== undefined,
  };
}

export function acceptProductionBuildCell(input) {
  const required = [
    'sourceRoot', 'sourceBeforeSha256', 'processGroupPid', 'processStartedNs',
    'processCompletedNs', 'buildExitCode', 'timingText', 'contractReportPath',
    'browserReportPath', 'processCleanupRequired'
  ];
  for (const name of required) if (input[name] === undefined || input[name] === null) throw new Error(`missing ${name}`);
  const sourceAfterSha256 = hashTree(input.sourceRoot, new Set(input.ignoredSourceNames ?? ['dist', 'node_modules']));
  if (sourceAfterSha256 !== input.sourceBeforeSha256) throw new Error('source drift detected');
  if (processGroupAlive(input.processGroupPid)) throw new Error('orphan process group detected');
  if (input.processCleanupRequired !== false) throw new Error('production build left a descendant process');
  if (BigInt(input.processCompletedNs) <= BigInt(input.processStartedNs)) throw new Error('stale process completion detected');
  if (input.buildExitCode !== 0) throw new Error(`production build exited ${input.buildExitCode}`);
  const timing = parseMacOSTimeOutput(input.timingText);
  const readPassingReport = (filename, label) => {
    let report;
    try { report = JSON.parse(fs.readFileSync(filename, 'utf8')); }
    catch { throw new Error(`${label} report is missing or invalid`); }
    if (report.passed !== true) throw new Error(`${label} validation failed`);
    return report;
  };
  readPassingReport(input.contractReportPath, 'output contract');
  readPassingReport(input.browserReportPath, 'browser');
  return {
    accepted: true,
    sourceAfterSha256,
    processTreeStopped: true,
    outputContractValidated: true,
    browserValidated: true,
    outcomes: {
      M2Milliseconds: timing.realSeconds * 1000,
      M10PeakRssBytes: timing.rssBytes,
      M11CpuSeconds: timing.userSeconds + timing.systemSeconds,
      userSeconds: timing.userSeconds,
      systemSeconds: timing.systemSeconds,
    },
  };
}
