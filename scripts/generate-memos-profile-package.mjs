import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profile = path.join(root, 'profiles/realworld-v2/memos');
const target = path.join(profile, 'common/package.json');
const application = JSON.parse(fs.readFileSync(path.join(profile, 'application-dependencies.json')));
const tools = JSON.parse(fs.readFileSync(path.join(profile, 'tool-dependencies.json')));
const packageJson = {
  name: 'benchmark-realworld-v2-memos',
  version: '1.0.0',
  private: true,
  type: 'module',
  packageManager: 'npm@11.9.0',
  engines: { node: '24.14.0' },
  scripts: {
    build: 'node adapter-build.mjs',
    postinstall: 'node apply-protobuf-patch.mjs',
    verify: 'node verify-profile.mjs',
  },
  dependencies: Object.fromEntries(Object.entries(application).sort()),
  devDependencies: Object.fromEntries(Object.entries(tools).sort()),
};
fs.writeFileSync(target, JSON.stringify(packageJson, null, 2) + '\n');
