import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const output = process.argv[2];
if (!output || fs.existsSync(output)) throw new Error('Usage: audit-memos-adapter-profile.mjs <NEW-report-path>');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profile = path.join(root, 'profiles/realworld-v2/memos');
const application = JSON.parse(fs.readFileSync(path.join(profile, 'application-dependencies.json')));
const tools = JSON.parse(fs.readFileSync(path.join(profile, 'tool-dependencies.json')));
const manifest = JSON.parse(fs.readFileSync(path.join(profile, 'common/package.json')));
const lockBytes = fs.readFileSync(path.join(profile, 'common/package-lock.json'));
const lock = JSON.parse(lockBytes);
const errors = [];
const exact = (value) => typeof value === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);

if (manifest.engines?.node !== '24.14.0') errors.push('Node engine must be exactly 24.14.0');
for (const [section, expected] of [['dependencies', application], ['devDependencies', tools]]) {
  if (JSON.stringify(manifest[section]) !== JSON.stringify(Object.fromEntries(Object.entries(expected).sort()))) {
    errors.push(`${section} does not match its generated source registry`);
  }
  for (const [name, version] of Object.entries(expected)) {
    if (!exact(version)) errors.push(`${name} is not exact: ${version}`);
    const installed = lock.packages?.[`node_modules/${name}`];
    if (!installed) errors.push(`${name} is absent from the lockfile`);
    else {
      if (installed.version !== version) errors.push(`${name}: lock has ${installed.version}, expected ${version}`);
      if (!installed.resolved || !installed.integrity) errors.push(`${name}: lock entry lacks resolved URL or integrity`);
    }
  }
}
const lockRoot = lock.packages?.[''];
if (JSON.stringify(lockRoot?.dependencies) !== JSON.stringify(manifest.dependencies)) errors.push('Lockfile root application dependencies differ from package.json');
if (JSON.stringify(lockRoot?.devDependencies) !== JSON.stringify(manifest.devDependencies)) errors.push('Lockfile root tool dependencies differ from package.json');
for (const tool of ['vite', 'rspack', 'esbuild', 'webpack', 'rollup']) {
  const metadata = JSON.parse(fs.readFileSync(path.join(profile, tool, 'profile.json')));
  if (metadata.publicationEligible !== false) errors.push(`${tool} profile is not quarantined from publication claims`);
  if (!fs.existsSync(path.join(profile, tool, 'adapter-build.mjs'))) errors.push(`${tool} adapter-build.mjs is absent`);
}
const report = {
  kind: 'memos-five-tool-adapter-profile-audit',
  passed: errors.length === 0,
  publicationEligible: false,
  applicationDependencies: Object.keys(application).length,
  toolDependencies: Object.keys(tools).length,
  lockfileVersion: lock.lockfileVersion,
  lockfileSha256: crypto.createHash('sha256').update(lockBytes).digest('hex'),
  errors,
};
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
process.exitCode = report.passed ? 0 : 1;
