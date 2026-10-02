#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const protocolPath = path.join(root, 'protocols/confirmatory-v2-cloud/protocol.json');
const outputPath = path.join(root, 'protocols/confirmatory-v2-cloud/schedule.json');
const protocol = JSON.parse(await readFile(protocolPath, 'utf8'));

function score(label) {
  return createHash('sha256').update(`${protocol.randomization.seed}|${label}`).digest('hex');
}

function orderedTools(metric, workload, block, tools) {
  const cycle = Math.floor((block - 1) / tools.length);
  const rotation = (block - 1) % tools.length;
  const base = [...tools].sort((a, b) =>
    score(`${metric}|${workload}|cycle-${cycle}|${a}`).localeCompare(score(`${metric}|${workload}|cycle-${cycle}|${b}`))
  );
  return [...base.slice(rotation), ...base.slice(0, rotation)];
}

const blocks = [];
for (const family of protocol.primaryFamilies) {
  const tools = protocol.tools[family.tools];
  for (const workload of family.workloads) {
    for (let block = 1; block <= family.blocks; block += 1) {
      const blockId = `${family.metric}|${workload}|b${String(block).padStart(2, '0')}`;
      blocks.push({
        blockId,
        metric: family.metric,
        workload,
        block,
        toolOrder: orderedTools(family.metric, workload, block, tools),
        samplingUnit: family.samplingUnit,
        untimedWarmupUpdates: family.untimedWarmupUpdates ?? 0,
        measuredUpdates: family.withinSessionMeasuredUpdates
      });
    }
  }
}

const schedule = {
  schemaVersion: 1,
  protocol: protocol.id,
  seed: protocol.randomization.seed,
  generator: 'scripts/generate-confirmatory-v2-cloud-schedule.mjs',
  ordering: 'metric and workload groups are fixed; SHA-256-ranked base orders are cyclically rotated to balance tool position within each complete cycle',
  blocks,
  blockCount: blocks.length,
  independentUnitCount: blocks.reduce((sum, block) => sum + block.toolOrder.length, 0)
};

await writeFile(outputPath, `${JSON.stringify(schedule, null, 2)}\n`);
console.log(`wrote ${path.relative(root, outputPath)}: ${schedule.blockCount} blocks, ${schedule.independentUnitCount} independent units`);
