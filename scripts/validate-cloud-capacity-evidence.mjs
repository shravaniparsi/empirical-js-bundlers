#!/usr/bin/env node
/** Validates the diagnostic capacity pilot. It accepts no primary timing data. */
import fs from 'node:fs';
import path from 'node:path';

const [rootArg] = process.argv.slice(2);
if (!rootArg) throw new Error('Usage: validate-cloud-capacity-evidence.mjs <extracted-run-directory>');
const root = fs.realpathSync(rootArg);
const errors = [];
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const requireTrue = (condition, message) => { if (!condition) errors.push(message); };

function diskAvailableGiB(relative) {
  const lines = fs.readFileSync(path.join(root, relative), 'utf8').trim().split('\n');
  const data = lines.find(line => line.startsWith('/dev/disk3s1s1')) ?? lines.find(line => line.startsWith('/dev/'));
  if (!data) return null;
  const match = data.match(/\s(\d+(?:\.\d+)?)([GMTK]i)\s+\d+%/);
  if (!match) return null;
  const factors = { Ki: 1 / 1024 / 1024, Mi: 1 / 1024, Gi: 1, Ti: 1024 };
  return Number(match[1]) * factors[match[2]];
}

function memoryFreePercent(relative) {
  const match = fs.readFileSync(path.join(root, relative), 'utf8').match(/System-wide memory free percentage:\s*(\d+)%/);
  return match ? Number(match[1]) : null;
}

for (const workload of ['synthetic-xl', 'memos', 'excalidraw']) {
  const runner = readJson(`${workload}/runner.json`);
  requireTrue(runner.publicationEligible === false && runner.newPrimaryMeasurements === 0, `${workload}: pilot eligibility metadata drift`);
  requireTrue(runner.node === 'v24.14.0', `${workload}: Node drift`);
  requireTrue(runner.architecture === 'arm64' && runner.runnerImage === 'macos14', `${workload}: runner family drift`);
  requireTrue(typeof runner.runnerImageVersion === 'string' && runner.runnerImageVersion.length > 0, `${workload}: runner image version missing`);
  const hardware = fs.readFileSync(path.join(root, workload, 'hardware.txt'), 'utf8');
  requireTrue(hardware.includes('Chip: Apple M1 (Virtual)'), `${workload}: Apple M1 virtual chip not verified`);
  requireTrue(hardware.includes('Total Number of Cores: 3'), `${workload}: three-core runner not verified`);
  requireTrue(hardware.includes('Memory: 7 GB'), `${workload}: 7 GB runner memory not verified`);
  const diskBefore = diskAvailableGiB(`${workload}/disk-before.txt`);
  const diskAfter = diskAvailableGiB(`${workload}/disk-after.txt`);
  const memoryBefore = memoryFreePercent(`${workload}/memory-before.txt`);
  const memoryAfter = memoryFreePercent(`${workload}/memory-after.txt`);
  requireTrue(diskBefore !== null && diskBefore >= 20, `${workload}: pre-run free disk below 20 GiB or unreadable`);
  requireTrue(diskAfter !== null && diskAfter >= 20, `${workload}: final free disk below 20 GiB or unreadable`);
  requireTrue(memoryBefore !== null && memoryBefore >= 50, `${workload}: pre-run free memory below 50 percent or unreadable`);
  requireTrue(memoryAfter !== null && memoryAfter >= 20, `${workload}: final free memory below 20 percent or unreadable`);
}

const synthetic = readJson('synthetic-xl/profile/summary.json');
requireTrue(synthetic.length === 1 && synthetic[0].tool === 'rollup' && synthetic[0].kind === 'synthetic' && synthetic[0].size === 'xl-5000', 'synthetic-xl: unexpected exercised profile');
requireTrue(synthetic[0]?.passed === true && ['install', 'build', 'contract', 'browser'].every(step => synthetic[0]?.[step]?.exitCode === 0), 'synthetic-xl: largest Rollup profile did not pass every step');
requireTrue(readJson('synthetic-xl/profile/rollup-contract.json').passed === true, 'synthetic-xl: output contract failed');
requireTrue(readJson('synthetic-xl/profile/rollup-browser.json').passed === true, 'synthetic-xl: browser acceptance failed');

for (const workload of ['memos', 'excalidraw']) {
  const source = readJson(`${workload}/source.json`);
  const output = readJson(`${workload}/output-contract.json`);
  const browser = readJson(`${workload}/browser/browser.json`);
  requireTrue(source.publicationEligible === false && source.id === workload && source.filesVerified > 0, `${workload}: pinned source verification failed`);
  requireTrue(output.passed === true && output.errors.length === 0, `${workload}: output contract failed`);
  requireTrue(browser.passed === true && browser.errors.length === 0, `${workload}: browser acceptance failed`);
  requireTrue(Object.values(browser.checks).every(Boolean), `${workload}: incomplete browser checks`);
}

const report = {
  schemaVersion: 1,
  kind: 'confirmatory-v2-cloud-capacity-pilot-validation',
  publicationEligible: false,
  newPrimaryMeasurements: 0,
  valid: errors.length === 0,
  workloads: ['synthetic-xl', 'memos', 'excalidraw'],
  errors,
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.valid ? 0 : 1;
