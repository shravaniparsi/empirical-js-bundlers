#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const protocolBytes = await readFile(path.join(root, 'protocols/confirmatory-v2-cloud/protocol.json'));
const scheduleBytes = await readFile(path.join(root, 'protocols/confirmatory-v2-cloud/schedule.json'));
const protocol = JSON.parse(protocolBytes);
const schedule = JSON.parse(scheduleBytes);
const errors = [];
const fail = message => errors.push(message);

if (protocol.id !== 'confirmatory-v2-cloud-m1') fail('unexpected protocol id');
if (protocol.status !== 'draft-premeasurement') fail('draft must remain draft-premeasurement until controls and freeze pass');
if (protocol.publicationEligible !== false) fail('draft must remain publicationEligible=false');
if (protocol.runtime.node !== '24.14.0' || protocol.runtime.runnerLabel !== 'macos-14' || protocol.runtime.architecture !== 'arm64') fail('target runtime drift');
if (protocol.hostPolicy.allocationUnit?.includes('every tool in a block runs serially') !== true) fail('VM blocking rule missing');
if (protocol.randomization.parallelBlocks !== false || protocol.randomization.maximumConcurrentBlocks !== 1 || protocol.randomization.parallelToolsWithinBlock !== false) fail('parallelism contract drift');
if (protocol.tools.reference !== 'webpack') fail('reference tool drift');
if (protocol.analysis.alpha !== 0.05 || !protocol.analysis.interval.includes('10000')) fail('analysis contract drift');
if (protocol.stopping.interimInference !== false || protocol.stopping.earlyStopping !== false) fail('data-dependent stopping enabled');
if (schedule.protocol !== protocol.id || schedule.seed !== protocol.randomization.seed) fail('schedule/protocol mismatch');

const expected = new Map();
const positionCounts = new Map();
for (const family of protocol.primaryFamilies) {
  const tools = protocol.tools[family.tools];
  if (!tools) { fail(`unknown tool set ${family.tools}`); continue; }
  for (const workload of family.workloads) {
    for (let block = 1; block <= family.blocks; block += 1) {
      expected.set(`${family.metric}|${workload}|b${String(block).padStart(2, '0')}`, new Set(tools));
    }
  }
}

if (schedule.blocks.length !== expected.size) fail(`expected ${expected.size} blocks, found ${schedule.blocks.length}`);
let units = 0;
for (const block of schedule.blocks) {
  const toolSet = expected.get(block.blockId);
  if (!toolSet) { fail(`unexpected block ${block.blockId}`); continue; }
  if (new Set(block.toolOrder).size !== block.toolOrder.length) fail(`duplicate tool in ${block.blockId}`);
  if (block.toolOrder.length !== toolSet.size || block.toolOrder.some(tool => !toolSet.has(tool))) fail(`incomplete tool order in ${block.blockId}`);
  const group = `${block.metric}|${block.workload}`;
  if (!positionCounts.has(group)) positionCounts.set(group, new Map());
  for (const [position, tool] of block.toolOrder.entries()) {
    const counts = positionCounts.get(group);
    const key = `${tool}|${position}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  units += block.toolOrder.length;
  expected.delete(block.blockId);
}
if (expected.size) fail(`${expected.size} planned blocks are missing`);
if (units !== 1740 || schedule.independentUnitCount !== 1740) fail(`expected 1740 independent units, found ${units}`);
if (schedule.blockCount !== 420) fail(`expected 420 randomized blocks, found ${schedule.blockCount}`);
for (const [group, counts] of positionCounts) {
  const values = [...counts.values()];
  if (Math.max(...values) - Math.min(...values) > 1) fail(`tool positions are imbalanced in ${group}`);
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
console.log(JSON.stringify({
  validDraft: true,
  protocol: protocol.id,
  protocolSha256: sha256(protocolBytes),
  scheduleSha256: sha256(scheduleBytes),
  randomizedBlocks: schedule.blockCount,
  independentUnits: schedule.independentUnitCount,
  publicationEligible: false
}, null, 2));
