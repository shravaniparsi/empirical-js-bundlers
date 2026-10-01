import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policyPath = path.join(root, 'profiles/runtime-v1/policy.json');
const versionPath = path.join(root, 'profiles/runtime-v1/.node-version');
const outputPath = process.argv[2];

if (!outputPath || fs.existsSync(outputPath)) {
  throw new Error('Usage: audit-runtime-policy.mjs <new-report-path>');
}

const policyBytes = fs.readFileSync(policyPath);
const policy = JSON.parse(policyBytes);
const versionFile = fs.readFileSync(versionPath, 'utf8').trim();
const expected = policy.runtime.version;
const errors = [];

if (policy.id !== 'runtime-v1') errors.push(`Unexpected policy id: ${policy.id}`);
if (policy.publicationEligible !== false) errors.push('Runtime correctness policy must not be publication eligible');
if (versionFile !== expected) errors.push(`.node-version is ${versionFile}; expected ${expected}`);
if (process.version !== `v${expected}`) errors.push(`Active runtime is ${process.version}; expected v${expected}`);
if (!/^\d+\.\d+\.\d+$/.test(expected)) errors.push(`Runtime version is not an exact semantic version: ${expected}`);

const report = {
  kind: 'runtime-v1-audit',
  passed: errors.length === 0,
  publicationEligible: false,
  expectedNode: expected,
  actualNode: process.version.slice(1),
  v8: process.versions.v8,
  platform: process.platform,
  architecture: process.arch,
  policySha256: createHash('sha256').update(policyBytes).digest('hex'),
  errors,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, expectedNode: expected, actualNode: report.actualNode, errors }));
process.exitCode = report.passed ? 0 : 1;
