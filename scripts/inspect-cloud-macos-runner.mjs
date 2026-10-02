#!/usr/bin/env node
/** Pre-block environment gate for confirmatory-v2-cloud-m1. Records no outcomes. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';

const [outputArg] = process.argv.slice(2);
if (!outputArg) throw new Error('Usage: inspect-cloud-macos-runner.mjs <NEW-report.json>');
const output = path.resolve(outputArg);
if (fs.existsSync(output)) throw new Error(`Refusing to overwrite ${output}`);
fs.mkdirSync(path.dirname(output), { recursive: true });

function command(file, args = []) {
  try { return { ok: true, output: execFileSync(file, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() }; }
  catch (error) { return { ok: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}`.trim(), exitCode: error.status ?? null }; }
}

function freeDiskGiB(location) {
  const result = command('df', ['-k', location]);
  if (!result.ok) return null;
  const columns = result.output.split('\n').at(-1).trim().split(/\s+/);
  const availableKiB = Number(columns[3]);
  return Number.isFinite(availableKiB) ? availableKiB / 1024 / 1024 : null;
}

const swvers = command('sw_vers');
const hardware = command('system_profiler', ['SPHardwareDataType', '-json']);
const memoryPressure = command('memory_pressure', ['-Q']);
const processInventory = command('ps', ['-axo', 'pid,ppid,command']);
const chromePath = puppeteer.executablePath();
const chrome = command(chromePath, ['--version']);
const freeDisk = freeDiskGiB(path.dirname(output));
const freeMemoryMatch = memoryPressure.output.match(/System-wide memory free percentage:\s*(\d+)%/);
const freeMemoryPercent = freeMemoryMatch ? Number(freeMemoryMatch[1]) : null;
const identity = {
  architecture: os.arch(),
  logicalCores: os.cpus().length,
  cpuModel: os.cpus()[0]?.model ?? null,
  memoryBytes: os.totalmem(),
  platform: os.platform(),
  release: os.release(),
  runnerName: process.env.RUNNER_NAME ?? null,
  runnerEnvironment: process.env.RUNNER_ENVIRONMENT ?? null,
  runnerArch: process.env.RUNNER_ARCH ?? null,
  runnerOS: process.env.RUNNER_OS ?? null,
  imageOS: process.env.ImageOS ?? null,
  imageVersion: process.env.ImageVersion ?? null,
  githubRunId: process.env.GITHUB_RUN_ID ?? null,
  githubRunAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  githubJob: process.env.GITHUB_JOB ?? null,
};
const sha256 = value => createHash('sha256').update(value).digest('hex');
const checks = {
  githubHosted: { expected: true, actual: process.env.GITHUB_ACTIONS === 'true' && process.env.RUNNER_ENVIRONMENT === 'github-hosted' },
  runnerOS: { expected: 'macOS', actual: process.env.RUNNER_OS ?? null },
  runnerLabelFamily: { expected: 'macos-14', actual: process.env.ImageOS ?? null, acceptedImageOS: /^macos14(?:$|\.)/.test(process.env.ImageOS ?? '') },
  architecture: { expected: 'arm64', actual: os.arch() },
  runnerArch: { expected: 'ARM64', actual: process.env.RUNNER_ARCH ?? null },
  logicalCores: { minimum: 3, actual: os.cpus().length },
  memoryGiB: { minimum: 7, actual: os.totalmem() / 1024 ** 3 },
  freeDiskGiB: { minimum: 20, actual: freeDisk },
  freeMemoryPercent: { minimum: 50, actual: freeMemoryPercent },
  node: { expected: 'v24.14.0', actual: process.version },
  chromeAvailable: { expected: true, actual: chrome.ok, version: chrome.output || null },
};
checks.githubHosted.pass = checks.githubHosted.actual === checks.githubHosted.expected;
checks.runnerOS.pass = checks.runnerOS.actual === checks.runnerOS.expected;
checks.runnerLabelFamily.pass = checks.runnerLabelFamily.acceptedImageOS;
checks.architecture.pass = checks.architecture.actual === checks.architecture.expected;
checks.runnerArch.pass = checks.runnerArch.actual === checks.runnerArch.expected;
checks.logicalCores.pass = checks.logicalCores.actual >= checks.logicalCores.minimum;
checks.memoryGiB.pass = checks.memoryGiB.actual >= checks.memoryGiB.minimum;
checks.freeDiskGiB.pass = freeDisk !== null && freeDisk >= checks.freeDiskGiB.minimum;
checks.freeMemoryPercent.pass = freeMemoryPercent !== null && freeMemoryPercent >= checks.freeMemoryPercent.minimum;
checks.node.pass = checks.node.actual === checks.node.expected;
checks.chromeAvailable.pass = chrome.ok;

const report = {
  schemaVersion: 1,
  kind: 'confirmatory-v2-cloud-pre-block-environment',
  protocol: 'confirmatory-v2-cloud-m1',
  publicationEligible: false,
  newPrimaryMeasurements: 0,
  capturedAt: new Date().toISOString(),
  identity,
  fingerprintSha256: sha256(JSON.stringify(identity)),
  diagnostics: {
    loadAverage: os.loadavg(),
    freeDiskGiB: freeDisk,
    freeMemoryPercent,
    swvers: swvers.output || null,
    hardware: hardware.output || null,
    memoryPressure: memoryPressure.output || null,
    processInventory: processInventory.output || null,
    chromeVersion: chrome.output || null,
  },
  checks,
  passed: Object.values(checks).every(check => check.pass),
};
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ passed: report.passed, identity, checks }, null, 2));
process.exitCode = report.passed ? 0 : 1;
