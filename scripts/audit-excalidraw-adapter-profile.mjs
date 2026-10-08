import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const output = process.argv[2];
if (!output || fs.existsSync(output)) throw new Error('Usage: audit-excalidraw-adapter-profile.mjs <NEW-report-path>');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profile = path.join(root, 'profiles/realworld-v2/excalidraw');
const manifest = JSON.parse(fs.readFileSync(path.join(profile, 'common/package.json')));
const lockBytes = fs.readFileSync(path.join(profile, 'common/package-lock.json'));
const lock = JSON.parse(lockBytes);
const lockSha256 = crypto.createHash('sha256').update(lockBytes).digest('hex');
const sourceRegistry = JSON.parse(fs.readFileSync(path.join(root, 'workloads/realworld-v1/registry.json'))).applications.find((row) => row.id === 'excalidraw');
const errors = [];
const sorted = (value) => Object.fromEntries(Object.entries(value || {}).sort());
if (!sourceRegistry) errors.push('Excalidraw is absent from the pinned workload registry');
if (manifest.packageManager !== 'npm@11.9.0') errors.push('Adapter package manager must be npm@11.9.0');
if (manifest.engines?.node !== '24.14.0') errors.push('Adapter Node engine must be 24.14.0');
if (manifest.scripts?.dev !== 'node adapter-dev.mjs') errors.push('Development adapter command is not pinned');
if (lock.lockfileVersion !== 3) errors.push('Expected npm lockfileVersion 3');
if (lock.packages?.['']?.name !== manifest.name) errors.push('Lockfile root does not match package manifest');
if (JSON.stringify(sorted(lock.packages?.['']?.devDependencies)) !== JSON.stringify(sorted(manifest.devDependencies))) errors.push('Lockfile root tool dependencies differ from package manifest');
if (Object.values(lock.packages || {}).filter((entry) => entry?.link).length !== 10) errors.push('Lockfile does not contain all ten pinned upstream workspace links');
for (const name of ['vite', '@rspack/core', 'esbuild', 'webpack', 'rollup']) {
  const version = manifest.devDependencies?.[name];
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version || '')) errors.push(`${name} is not exactly pinned`);
  if (!lock.packages?.[`node_modules/${name}`]) errors.push(`${name} is absent from the lockfile`);
}
for (const tool of ['vite', 'rspack', 'esbuild', 'webpack', 'rollup']) {
  const metadata = JSON.parse(fs.readFileSync(path.join(profile, tool, 'profile.json')));
  if (metadata.publicationEligible !== false) errors.push(`${tool} profile is not quarantined from publication claims`);
  if (metadata.lockfileSha256 !== lockSha256) errors.push(`${tool} profile lock hash differs from the canonical lockfile`);
  if (!fs.existsSync(path.join(profile, tool, 'adapter-build.mjs'))) errors.push(`${tool} adapter build is absent`);
}
for (const tool of ['vite', 'rspack', 'webpack']) {
  if (!fs.existsSync(path.join(profile, tool, 'adapter-dev.mjs'))) errors.push(`${tool} development adapter is absent`);
}
const report = {
  kind: 'excalidraw-five-tool-adapter-profile-audit',
  passed: errors.length === 0,
  publicationEligible: false,
  applicationCommit: sourceRegistry?.commit,
  lockfileVersion: lock.lockfileVersion,
  lockfileSha256: lockSha256,
  workspacePackages: Object.keys(lock.packages || {}).filter((name) => lock.packages[name]?.link).length,
  errors,
};
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
process.exitCode = report.passed ? 0 : 1;
