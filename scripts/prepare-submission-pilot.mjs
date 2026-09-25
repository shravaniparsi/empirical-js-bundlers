/** Prepare fresh synthetic workspaces; never modify recovered experiment workspaces. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const size = process.argv[2] ?? 'xs-50';
const sourceRoot = path.resolve(process.argv[3] ?? root);
if (!['xs-50', 's-200', 'm-500', 'l-2000', 'xl-5000'].includes(size)) throw new Error('Unknown size');
const mode = process.argv[4] ?? 'corrected';
if (!['corrected', 'recovered'].includes(mode)) throw new Error('Mode must be corrected or recovered');
const destination = path.join(root, '.submission-pilot', `${size}-${mode}${process.env.PILOT_REVISION ? '-' + process.env.PILOT_REVISION : ''}`);
if (fs.existsSync(destination)) throw new Error('Pilot already exists; choose a fresh campaign instead of overwriting it');
const fixture = mode === 'corrected' ? path.join(destination, 'fixture') : path.join(sourceRoot, 'tier1-synthetic/projects', size);
if (mode === 'corrected') {
  const generated = spawnSync(process.execPath, ['--import', 'tsx', path.join(root, 'tier1-synthetic/generate-project.ts'), '--size', size.split('-')[1], '--seed', '42', '--output', fixture], { cwd: root, stdio: 'inherit' });
  if (generated.error) throw generated.error;
  if (generated.status !== 0) throw new Error('Fixture generation failed');
}
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const receipt = { kind: 'configuration-correctness-pilot-not-publication-data', size, mode, sourceRoot, createdAt: new Date().toISOString(), tools: {} };
for (const tool of ['vite', 'rspack', 'esbuild', 'webpack', 'rollup']) {
  const canonical = fixture;
  const recovered = path.join(sourceRoot, 'tier1-synthetic/workspaces', tool, size);
  const target = path.join(destination, tool);
  fs.cpSync(canonical, target, { recursive: true });
  for (const file of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(recovered, file), path.join(target, file));
  const config = path.join(root, 'configs', tool);
  if (tool === 'esbuild') fs.cpSync(config, path.join(target, 'configs/esbuild'), { recursive: true });
  else {
    const name = { vite: 'vite.config.ts', rspack: 'rspack.config.cjs', webpack: 'webpack.config.cjs', rollup: 'rollup.config.mjs' }[tool];
    fs.copyFileSync(path.join(config, name), path.join(target, name));
  }
  const configFiles = fs.readdirSync(config).filter(name => /\.(mjs|cjs|ts)$/.test(name));
  receipt.tools[tool] = { configHashes: Object.fromEntries(configFiles.map(name => [name, hash(path.join(config, name))])), packageSha256: hash(path.join(target, 'package.json')), lockSha256: hash(path.join(target, 'package-lock.json')), source: path.relative(root, canonical), configuration: path.relative(root, config) };
}
receipt.generatorSha256 = hash(path.join(root, 'tier1-synthetic/generate-project.ts'));
fs.writeFileSync(path.join(destination, 'preparation.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(destination);
