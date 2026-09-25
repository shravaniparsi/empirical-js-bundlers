import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generate = output => spawnSync(process.execPath, ['--import', 'tsx', 'tier1-synthetic/generate-project.ts', '--size', '50', '--seed', '42', '--output', output], { cwd: root, encoding: 'utf8' });
function files(dir, prefix = '') {
  return Object.fromEntries(fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(prefix, entry.name), full = path.join(dir, entry.name);
    return entry.isDirectory() ? Object.entries(files(full, name)) : [[name, fs.readFileSync(full, 'utf8')]];
  }));
}
test('same seed reproduces all fixture sources and never overwrites an existing fixture', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundler-generator-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const a = path.join(dir, 'a'), b = path.join(dir, 'b');
  for (const output of [a, b]) {
    const result = generate(output);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.deepEqual(files(path.join(a, 'src')), files(path.join(b, 'src')));
  const before = files(a), rejected = generate(a);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /Refusing to overwrite/);
  assert.deepEqual(files(a), before);
});

test('large fixtures are reachable DAGs with a bounded render expansion and isolated lazy roots', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundler-graph-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [size, seed] of [[200, 42], [500, 43], [500, 44], [5000, 42]]) {
    const output = path.join(dir, `${size}-${seed}`);
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'tier1-synthetic/generate-project.ts', '--size', String(size), '--seed', String(seed), '--output', output], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const graph = JSON.parse(fs.readFileSync(path.join(output, 'GRAPH.json')));
    const visiting = new Set(), seen = new Set(), counts = new Map();
    const lazy = new Set(graph.roots.filter(root => root.lazy).map(root => root.id));
    function expand(id) {
      assert.equal(visiting.has(id), false, 'cycle');
      seen.add(id);
      if (counts.has(id)) return counts.get(id);
      visiting.add(id);
      const node = graph.nodes[id];assert.equal(node.dead, false);
      let count = 1;
      for (const child of node.imports) { assert.equal(lazy.has(child), false, 'lazy entry statically imported');count += expand(child); }
      visiting.delete(id);counts.set(id, count);return count;
    }
    const expansion = graph.roots.reduce((sum, root) => sum + expand(root.id), 0);
    assert.equal(seen.size, graph.nodes.filter(node => !node.dead).length);
    assert.ok(expansion <= size * 8, `Unbounded expansion: ${expansion}`);
    assert.equal(expansion, graph.expandedRenderUpperBound);
  }
});
