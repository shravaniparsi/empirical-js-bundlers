#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { finalizeCloudBlockArtifact, validateCloudBlockArtifact } from './cloud-block-artifact.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'cloud-block-artifact-'));
try {
  const sourceGate = path.join(repository, 'review/confirmatory-cloud-v2/environment-control/run-37726841673/pre-block.json');
  fs.copyFileSync(sourceGate, path.join(fixture, 'pre-block-host.json'));
  for (const tool of ['vite', 'rspack', 'webpack']) {
    const cellDir = path.join(fixture, tool);
    fs.mkdirSync(cellDir);
    fs.writeFileSync(path.join(cellDir, 'cell.json'), `${JSON.stringify({
      schemaVersion: 1,
      kind: 'confirmatory-m1-executor-correctness',
      publicationEligible: false,
      newPrimaryMeasurements: 0,
      metric: 'M1',
      workload: 'xs-50',
      tool,
      accepted: true,
      correctnessOnly: true,
    }, null, 2)}\n`);
  }
  const manifest = finalizeCloudBlockArtifact({ attemptDir: fixture, blockId: 'M1|xs-50|b01', attempt: 1, correctnessOnly: true, repository });
  assert.equal(manifest.status, 'passed');
  assert.equal(manifest.cells.length, 3);
  assert.equal(manifest.newPrimaryMeasurements, 0);
  assert.equal(validateCloudBlockArtifact({ attemptDir: fixture }).valid, true);
  fs.appendFileSync(path.join(fixture, 'vite/cell.json'), 'drift');
  const drifted = validateCloudBlockArtifact({ attemptDir: fixture });
  assert.equal(drifted.valid, false);
  assert(drifted.errors.some(error => /hash mismatch/.test(error)));
  console.log('cloud block artifact controls passed');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
