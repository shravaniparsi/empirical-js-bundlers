#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [rootArg] = process.argv.slice(2);
if (!rootArg) throw new Error('Usage: validate-m3-session-controls.mjs <downloaded-artifact-root>');
const root = fs.realpathSync(rootArg);
const tools = ['vite', 'rspack', 'esbuild', 'webpack', 'rollup'];
const errors = [];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => errors.push(message);

for (const tool of tools) {
  const artifact = path.join(root, `m3-session-control-synthetic-${tool}-xs-50`);
  if (!fs.statSync(artifact, { throwIfNoEntry: false })?.isDirectory()) { fail(`${tool}: artifact missing`); continue; }
  const gate = JSON.parse(fs.readFileSync(path.join(artifact, 'pre-block.json'), 'utf8'));
  if (gate.passed !== true || !Object.values(gate.checks).every(check => check.pass === true)) fail(`${tool}: exact environment gate failed`);
  if (gate.identity.imageOS !== 'macos14' || gate.identity.imageVersion !== '20260831.0302.1') fail(`${tool}: runner image drift`);
  const sessionDir = path.join(artifact, 'session');
  const session = JSON.parse(fs.readFileSync(path.join(sessionDir, 'session.json'), 'utf8'));
  if (session.passed !== true || session.correctnessOnly !== true || session.publicationEligible !== false || session.newPrimaryMeasurements !== 0) fail(`${tool}: eligibility or result metadata invalid`);
  if (session.metric !== 'M3' || session.workload !== 'xs-50' || session.tool !== tool) fail(`${tool}: cell identity mismatch`);
  if (session.edits?.length !== 6 || session.edits[0]?.phase !== 'warmup' || !session.edits.slice(1).every(edit => edit.phase === 'measured')) fail(`${tool}: expected one warmup and five measured-code-path controls`);
  if (!session.edits?.every(edit => edit.postEditSuccess && edit.markerObserved && edit.sourceRestorationRebuilt && Number.isFinite(edit.diagnosticDurationMs))) fail(`${tool}: an edit/revert control failed`);
  if (Object.hasOwn(session, 'outcomes')) fail(`${tool}: correctness control contains primary outcomes`);
  if (!Object.values(session.checks ?? {}).every(Boolean)) fail(`${tool}: session finalization check failed`);
  for (const file of session.files ?? []) {
    const filename = path.resolve(sessionDir, file.path);
    if (!filename.startsWith(`${sessionDir}${path.sep}`) || !fs.statSync(filename, { throwIfNoEntry: false })?.isFile()) { fail(`${tool}: evidence path invalid: ${file.path}`); continue; }
    const bytes = fs.readFileSync(filename);
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) fail(`${tool}: evidence hash mismatch: ${file.path}`);
  }
}

const report = {
  schemaVersion: 1,
  kind: 'confirmatory-m3-session-smoke-validation',
  publicationEligible: false,
  newPrimaryMeasurements: 0,
  expectedCells: tools.length,
  valid: errors.length === 0,
  errors,
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.valid ? 0 : 1;
