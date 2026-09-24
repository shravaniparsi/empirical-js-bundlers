/**
 * Fails if tool workspaces do not share identical application source.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = ['vite', 'rspack', 'esbuild', 'webpack', 'rollup'];
const sizes = ['xs-50', 's-200', 'm-500', 'l-2000', 'xl-5000'];

function differences(expected: string, actual: string, ignoredSuffixes: string[] = []): string[] {
  const result = spawnSync('diff', ['-rq', expected, actual], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`diff failed with status ${result.status}: ${result.stderr}`);
  }
  return result.stdout
    .split('\n')
    .filter(Boolean)
    .filter(line => !ignoredSuffixes.some(suffix => line.includes(suffix)));
}

const failures: string[] = [];
for (const size of sizes) {
  const canonicalDir = path.join(root, 'tier1-synthetic', 'projects', size, 'src');
  for (const tool of tools) {
    const workspaceDir = path.join(root, 'tier1-synthetic', 'workspaces', tool, size, 'src');
    const found = differences(canonicalDir, workspaceDir);
    if (found.length) failures.push(`tier1 ${tool}/${size}: ${found.join('; ')}`);
  }
}

const tier2Canonical = path.join(root, 'tier2-realworld', 'bulletproof-react', 'src');
for (const tool of tools) {
  const workspaceDir = path.join(root, 'tier2-realworld', 'workspaces', tool, 'bulletproof-react', 'src');
  const found = differences(tier2Canonical, workspaceDir, ['/testing/mocks/index.ts']);
  if (found.length) failures.push(`tier2 ${tool}/bulletproof-react: ${found.join('; ')}`);
}

if (failures.length) {
  console.error(`Workspace source verification failed:\n${failures.map(failure => `- ${failure}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Workspace sources match canonical projects (documented Tier 2 mock stub excluded).');
}
