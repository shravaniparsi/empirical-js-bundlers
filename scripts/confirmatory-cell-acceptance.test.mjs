#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { acceptConfirmatoryCell, acceptProductionBuildCell, hashTree, parseMacOSTimeOutput, processGroupAlive } from './confirmatory-cell-acceptance.mjs';

if (process.platform === 'win32') throw new Error('process-group controls require POSIX');
const reportPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'confirmatory-cell-controls-'));
const source = path.join(root, 'source.tsx');
const output = path.join(root, 'output.js');
const marker = 'confirmatory-cell-marker';
const original = 'export const fixture = true;\n';
const sha = value => createHash('sha256').update(value).digest('hex');
const timeText = '        1.25 real         0.80 user         0.20 sys\n  104857600  maximum resident set size\n';
const controls = {};

async function stoppedProcessPid() {
  const child = spawn(process.execPath, ['-e', 'process.exit(0)'], { detached: true, stdio: 'ignore' });
  await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
  return child.pid;
}

function expectRejection(name, pattern, input) {
  assert.throws(() => acceptConfirmatoryCell(input), pattern);
  controls[name] = true;
}

let lingering;
try {
  fs.writeFileSync(source, original);
  fs.writeFileSync(output, `globalThis.marker = ${JSON.stringify(marker)};\n`);
  const pid = await stoppedProcessPid();
  const baseline = {
    sourcePath: source,
    sourceBeforeSha256: sha(original),
    processGroupPid: pid,
    actionStartedNs: '100',
    completionObservedNs: '200',
    outputPaths: [output],
    marker,
    timingText: timeText,
    hmr: { documentPreserved: true, statePreserved: true, reloadControlDetected: true },
  };
  assert.equal(processGroupAlive(pid), false);
  assert.deepEqual(parseMacOSTimeOutput(timeText), { realSeconds: 1.25, userSeconds: 0.8, systemSeconds: 0.2, rssBytes: 104857600 });
  assert.equal(acceptConfirmatoryCell(baseline).accepted, true);

  const contractReport = path.join(root, 'contract.json');
  const browserReport = path.join(root, 'browser.json');
  fs.writeFileSync(contractReport, '{"passed":true}\n');
  fs.writeFileSync(browserReport, '{"passed":true}\n');
  const production = {
    sourceRoot: root,
    sourceBeforeSha256: hashTree(root, new Set(['contract.json', 'browser.json', 'output.js'])),
    ignoredSourceNames: ['contract.json', 'browser.json', 'output.js'],
    processGroupPid: pid,
    processStartedNs: '100',
    processCompletedNs: '200',
    buildExitCode: 0,
    timingText: timeText,
    contractReportPath: contractReport,
    browserReportPath: browserReport,
    processCleanupRequired: false,
  };
  assert.deepEqual(acceptProductionBuildCell(production).outcomes, {
    M2Milliseconds: 1250,
    M10PeakRssBytes: 104857600,
    M11CpuSeconds: 1,
    userSeconds: 0.8,
    systemSeconds: 0.2,
  });
  fs.writeFileSync(contractReport, '{"passed":false}\n');
  assert.throws(() => acceptProductionBuildCell(production), /output contract validation failed/);
  fs.writeFileSync(contractReport, '{"passed":true}\n');
  fs.writeFileSync(browserReport, 'not json');
  assert.throws(() => acceptProductionBuildCell(production), /browser report is missing or invalid/);
  fs.writeFileSync(browserReport, '{"passed":true}\n');
  assert.throws(() => acceptProductionBuildCell({ ...production, buildExitCode: 1 }), /production build exited 1/);
  assert.throws(() => acceptProductionBuildCell({ ...production, processCompletedNs: '99' }), /stale process completion/);
  assert.throws(() => acceptProductionBuildCell({ ...production, processCleanupRequired: true }), /left a descendant process/);

  expectRejection('staleCompletion', /stale completion/, { ...baseline, completionObservedNs: '99' });
  fs.writeFileSync(output, 'globalThis.marker = "wrong";\n');
  expectRejection('wrongOutput', /output marker not found/, baseline);
  fs.writeFileSync(output, marker);
  fs.writeFileSync(source, `${original}// drift\n`);
  expectRejection('sourceDrift', /source drift/, baseline);
  fs.writeFileSync(source, original);

  lingering = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
  for (let attempt = 0; attempt < 50 && !processGroupAlive(lingering.pid); attempt++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(processGroupAlive(lingering.pid), true);
  expectRejection('orphanProcess', /orphan process group/, { ...baseline, processGroupPid: lingering.pid });

  expectRejection('malformedTiming', /malformed or ambiguous/, { ...baseline, timingText: '1.25 real 0.80 user\n' });
  expectRejection('fullReload', /full-page reload/, { ...baseline, hmr: { ...baseline.hmr, documentPreserved: false } });
  expectRejection('stateLoss', /state loss/, { ...baseline, hmr: { ...baseline.hmr, statePreserved: false } });
  expectRejection('reloadControlFailure', /reload detector control failed/, { ...baseline, hmr: { ...baseline.hmr, reloadControlDetected: false } });

  const report = {
    schemaVersion: 1,
    kind: 'confirmatory-cell-full-process-negative-controls',
    publicationEligible: false,
    newPrimaryMeasurements: 0,
    realProcessBaselineAccepted: true,
    controls,
    productionBuildAcceptance: true,
    passed: Object.values(controls).every(Boolean),
  };
  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  }
  console.log(JSON.stringify(report));
} finally {
  if (lingering?.pid) {
    try { process.kill(-lingering.pid, 'SIGKILL'); } catch {}
    for (let attempt = 0; attempt < 50 && processGroupAlive(lingering.pid); attempt++) await new Promise(resolve => setTimeout(resolve, 10));
  }
  fs.rmSync(root, { recursive: true, force: true });
}
