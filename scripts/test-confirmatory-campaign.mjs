#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { appendEvent, deriveCampaignState, hashLedgerEntry, verifyLedgerText } from './confirmatory-campaign.mjs';

function event(sequence, previousHash, type, data) {
  const unsigned = { sequence, previousHash, timestamp: `2026-09-30T00:00:${String(sequence).padStart(2, '0')}.000Z`, type, data };
  return { ...unsigned, entryHash: hashLedgerEntry(unsigned) };
}

const schedule = { blocks: [
  { blockId: 'M1|xs-50|b01', toolOrder: ['vite', 'webpack', 'rspack'] },
  { blockId: 'M1|xs-50|b02', toolOrder: ['webpack', 'rspack', 'vite'] }
] };

const valid = [];
valid.push(event(1, null, 'campaign_initialized', {}));
valid.push(event(2, valid.at(-1).entryHash, 'block_started', { blockId: 'M1|xs-50|b01', attempt: 1, toolOrder: schedule.blocks[0].toolOrder }));
for (const tool of schedule.blocks[0].toolOrder) valid.push(event(valid.length + 1, valid.at(-1).entryHash, 'cell_passed', { blockId: 'M1|xs-50|b01', attempt: 1, tool }));
valid.push(event(valid.length + 1, valid.at(-1).entryHash, 'block_completed', { blockId: 'M1|xs-50|b01', attempt: 1 }));
assert.equal(deriveCampaignState(schedule, valid, 2).completedBlocks.size, 1);
assert.equal(verifyLedgerText(`${valid.map(item => JSON.stringify(item)).join('\n')}\n`).length, valid.length);

const tampered = structuredClone(valid);
tampered[2].data.tool = 'rollup';
assert.throws(() => verifyLedgerText(`${tampered.map(item => JSON.stringify(item)).join('\n')}\n`), /ledger hash error/);

const skipped = valid.slice(0, 2);
skipped.push(event(3, skipped.at(-1).entryHash, 'cell_passed', { blockId: 'M1|xs-50|b01', attempt: 1, tool: 'webpack' }));
assert.throws(() => deriveCampaignState(schedule, skipped, 2), /expected vite/);

const afterFailure = valid.slice(0, 2);
afterFailure.push(event(3, afterFailure.at(-1).entryHash, 'cell_failed', { blockId: 'M1|xs-50|b01', attempt: 1, tool: 'vite' }));
afterFailure.push(event(4, afterFailure.at(-1).entryHash, 'cell_passed', { blockId: 'M1|xs-50|b01', attempt: 1, tool: 'vite' }));
assert.throws(() => deriveCampaignState(schedule, afterFailure, 2), /after the attempt failed/);

const retries = [event(1, null, 'campaign_initialized', {})];
for (let attempt = 1; attempt <= 4; attempt += 1) {
  retries.push(event(retries.length + 1, retries.at(-1).entryHash, 'block_started', { blockId: 'M1|xs-50|b01', attempt, toolOrder: schedule.blocks[0].toolOrder }));
  retries.push(event(retries.length + 1, retries.at(-1).entryHash, 'cell_failed', { blockId: 'M1|xs-50|b01', attempt, tool: 'vite' }));
  retries.push(event(retries.length + 1, retries.at(-1).entryHash, 'block_abandoned', { blockId: 'M1|xs-50|b01', attempt }));
}
assert.throws(() => deriveCampaignState(schedule, retries, 2), /exceeds replacement limit/);

const temporary = await mkdtemp(path.join(os.tmpdir(), 'confirmatory-ledger-test-'));
try {
  await writeFile(path.join(temporary, 'ledger.jsonl'), '');
  await Promise.all(Array.from({ length: 12 }, (_, index) => appendEvent(temporary, 'test', { index })));
  const appended = verifyLedgerText(await readFile(path.join(temporary, 'ledger.jsonl'), 'utf8'));
  assert.equal(appended.length, 12);
  assert.deepEqual(new Set(appended.map(item => item.data.index)).size, 12);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

console.log('confirmatory campaign ledger tests passed');
