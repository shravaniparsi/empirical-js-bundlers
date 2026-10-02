import { readFileSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
const repository = resolve(fileURLToPath(new URL('..', import.meta.url)));
export function candidate(id) {
  const registry = JSON.parse(readFileSync(resolve(repository, 'workloads/realworld-v1/registry.json')));
  const app = registry.applications.find(app => app.id === id);
  if (!app) throw new Error(`Unknown application: ${id}`);
  return app;
}
export function verifySource(id, directory) {
  const app = candidate(id);
  const inventoryBytes = readFileSync(resolve(repository, `workloads/realworld-v1/${id}/source-inventory.json`));
  if (sha256(inventoryBytes) !== app.inventorySha256) throw new Error('Inventory hash mismatch');
  const inventory = JSON.parse(inventoryBytes);
  const git = args => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  if (git(['rev-parse', 'HEAD']) !== app.commit) throw new Error('Upstream revision mismatch');
  const tracked = git(['ls-files', '-z']).split('\0').filter(Boolean).sort();
  if (JSON.stringify(tracked) !== JSON.stringify(inventory.map(file => file.path).sort())) throw new Error('Tracked file inventory mismatch');
  for (const file of inventory) {
    const path = resolve(directory, file.path);
    if (!lstatSync(path).isFile() || sha256(readFileSync(path)) !== file.sha256) throw new Error(`Source changed: ${file.path}`);
  }
  return { id, commit: app.commit, filesVerified: inventory.length, inventorySha256: app.inventorySha256, publicationEligible: false };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(verifySource(process.argv[2], resolve(process.argv[3])), null, 2));
}
