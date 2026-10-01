#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { open, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const protocolDir = path.join(root, 'protocols/confirmatory-v1');
const protocolPath = path.join(protocolDir, 'protocol.json');
const schedulePath = path.join(protocolDir, 'schedule.json');
const freezePath = path.join(protocolDir, 'FREEZE.json');

const sha256 = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value);
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

function command(file, args = []) {
  try {
    return { ok: true, output: execFileSync(file, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() };
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}`.trim(), code: error.status ?? null };
  }
}

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      positional.push(item);
      continue;
    }
    const key = item.slice(2);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) options[key] = true;
    else options[key] = argv[++i];
  }
  return { positional, options };
}

function required(options, key) {
  if (typeof options[key] !== 'string' || options[key].length === 0) throw new Error(`missing --${key}`);
  return options[key];
}

async function diskFreeGiB(location) {
  const result = command('df', ['-k', location]);
  if (!result.ok) return null;
  const lines = result.output.split('\n');
  const columns = lines.at(-1).trim().split(/\s+/);
  const availableKiB = Number(columns[3]);
  return Number.isFinite(availableKiB) ? availableKiB / 1024 / 1024 : null;
}

export async function inspectHost(location = root, observeSeconds = 0) {
  const protocol = await readJson(protocolPath);
  const swvers = command('sw_vers');
  const model = command('sysctl', ['-n', 'hw.model']);
  const cpuBrand = command('sysctl', ['-n', 'machdep.cpu.brand_string']);
  const power = command('pmset', ['-g', 'batt']);
  const thermal = command('pmset', ['-g', 'therm']);
  const memory = command('memory_pressure', ['-Q']);
  const freeDiskGiB = await diskFreeGiB(location);
  const loadSamples = [{ capturedAt: new Date().toISOString(), oneMinuteLoadAverage: os.loadavg()[0] }];
  const sampleEverySeconds = 10;
  for (let elapsed = sampleEverySeconds; elapsed <= observeSeconds; elapsed += sampleEverySeconds) {
    await new Promise(resolve => setTimeout(resolve, sampleEverySeconds * 1000));
    loadSamples.push({ capturedAt: new Date().toISOString(), oneMinuteLoadAverage: os.loadavg()[0] });
  }
  const maximumObservedLoad = Math.max(...loadSamples.map(sample => sample.oneMinuteLoadAverage));
  const identity = {
    arch: os.arch(),
    cpuCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model ?? null,
    cpuBrand: cpuBrand.ok ? cpuBrand.output : null,
    hardwareModel: model.ok ? model.output : null,
    memoryBytes: os.totalmem(),
    osPlatform: os.platform(),
    osRelease: os.release(),
    swvers: swvers.ok ? swvers.output : null
  };
  const memoryFreeMatch = memory.output.match(/System-wide memory free percentage:\s*(\d+)%/);
  const thermalUnavailable = /Failed to get thermal warning level/.test(thermal.output) && /Failed to get performance warning level/.test(thermal.output);
  const thermalZero = thermal.ok && (
    (/CPU_Speed_Limit\s*=\s*100/.test(thermal.output) && /Scheduler_Limit\s*=\s*100/.test(thermal.output)) ||
    (/No thermal warning level/.test(thermal.output) && /No performance warning level/.test(thermal.output))
  );
  const checks = {
    runtime: { pass: process.version === `v${protocol.runtime.node}`, expected: `v${protocol.runtime.node}`, actual: process.version },
    architecture: { pass: os.arch() === 'arm64', expected: 'arm64', actual: os.arch() },
    acPower: { pass: power.ok && /AC Power/.test(power.output), actual: power.output || null },
    freeDisk: { pass: freeDiskGiB !== null && freeDiskGiB >= protocol.environmentGate.minimumFreeDiskGiB, minimumGiB: protocol.environmentGate.minimumFreeDiskGiB, actualGiB: freeDiskGiB },
    load: { pass: observeSeconds >= protocol.environmentGate.loadGateObservationSeconds && maximumObservedLoad <= protocol.environmentGate.maximumOneMinuteLoadAverage, maximum: protocol.environmentGate.maximumOneMinuteLoadAverage, observationSeconds: observeSeconds, samples: loadSamples },
    memoryPressure: { pass: memory.ok && memoryFreeMatch !== null && Number(memoryFreeMatch[1]) >= protocol.environmentGate.minimumMemoryFreePercent, minimumFreePercent: protocol.environmentGate.minimumMemoryFreePercent, actual: memory.output || null },
    thermal: { pass: thermalZero || thermalUnavailable, mode: thermalZero ? 'reported-no-warning' : thermalUnavailable ? 'interface-unavailable-recorded' : 'warning-or-ambiguous', actual: thermal.output || null }
  };
  return {
    capturedAt: new Date().toISOString(),
    identity,
    fingerprintSha256: sha256(json(identity)),
    observations: { freeDiskGiB, loadSamples, power: power.output || null, memoryPressure: memory.output || null, thermal: thermal.output || null },
    checks,
    pass: Object.values(checks).every(check => check.pass)
  };
}

export function hashLedgerEntry(entryWithoutHash) {
  return sha256(`${json(entryWithoutHash)}\n`);
}

export function verifyLedgerText(text) {
  const events = text.length === 0 ? [] : text.trimEnd().split('\n').map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`ledger line ${index + 1} is not valid JSON`); }
  });
  let previousHash = null;
  for (const [index, event] of events.entries()) {
    if (event.sequence !== index + 1) throw new Error(`ledger sequence error at line ${index + 1}`);
    if (event.previousHash !== previousHash) throw new Error(`ledger chain error at line ${index + 1}`);
    const { entryHash, ...unsigned } = event;
    if (entryHash !== hashLedgerEntry(unsigned)) throw new Error(`ledger hash error at line ${index + 1}`);
    previousHash = entryHash;
  }
  return events;
}

async function withLedgerLock(campaignDir, action) {
  const lockPath = path.join(campaignDir, '.ledger.lock');
  let handle;
  try {
    const deadline = Date.now() + 5000;
    while (!handle) {
      try {
        handle = await open(lockPath, 'wx');
      } catch (error) {
        if (error.code !== 'EEXIST' || Date.now() >= deadline) throw error;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    await handle.writeFile(`${process.pid}\n`);
    return await action();
  } finally {
    await handle?.close();
    if (handle) await rm(lockPath, { force: true });
  }
}

export async function appendEvent(campaignDir, type, data, now = new Date().toISOString()) {
  return withLedgerLock(campaignDir, async () => {
    const ledgerPath = path.join(campaignDir, 'ledger.jsonl');
    const text = await readFile(ledgerPath, 'utf8');
    const events = verifyLedgerText(text);
    const unsigned = {
      sequence: events.length + 1,
      previousHash: events.at(-1)?.entryHash ?? null,
      timestamp: now,
      type,
      data
    };
    const event = { ...unsigned, entryHash: hashLedgerEntry(unsigned) };
    const ledger = await open(ledgerPath, 'a');
    try {
      await ledger.writeFile(`${json(event)}\n`);
      await ledger.sync();
    } finally {
      await ledger.close();
    }
    return event;
  });
}

export function deriveCampaignState(schedule, events, maximumReplacementAttempts) {
  const state = { completedBlocks: new Set(), attempts: new Map(), active: null };
  for (const event of events) {
    if (event.type === 'campaign_initialized') continue;
    const block = schedule.blocks.find(item => item.blockId === event.data.blockId);
    if (!block) throw new Error(`event ${event.sequence} names unknown block ${event.data.blockId}`);
    if (event.type === 'block_started') {
      if (state.active) throw new Error(`event ${event.sequence} starts a block while another is active`);
      const next = schedule.blocks.find(item => !state.completedBlocks.has(item.blockId));
      if (next?.blockId !== block.blockId) throw new Error(`event ${event.sequence} starts ${block.blockId}, expected ${next?.blockId}`);
      const expectedAttempt = (state.attempts.get(block.blockId) ?? 0) + 1;
      if (event.data.attempt !== expectedAttempt) throw new Error(`event ${event.sequence} has attempt ${event.data.attempt}, expected ${expectedAttempt}`);
      if (json(event.data.toolOrder) !== json(block.toolOrder)) throw new Error(`event ${event.sequence} tool order differs from frozen schedule`);
      if (expectedAttempt > maximumReplacementAttempts + 1) throw new Error(`event ${event.sequence} exceeds replacement limit`);
      state.attempts.set(block.blockId, expectedAttempt);
      state.active = { block, attempt: expectedAttempt, passedTools: [], failed: false };
    } else if (event.type === 'cell_passed' || event.type === 'cell_failed') {
      if (!state.active || state.active.block.blockId !== block.blockId || state.active.attempt !== event.data.attempt) throw new Error(`event ${event.sequence} does not match the active attempt`);
      if (state.active.failed) throw new Error(`event ${event.sequence} records a cell after the attempt failed`);
      const expectedTool = block.toolOrder[state.active.passedTools.length];
      if (event.data.tool !== expectedTool) throw new Error(`event ${event.sequence} records ${event.data.tool}, expected ${expectedTool}`);
      if (event.type === 'cell_failed') state.active.failed = true;
      else state.active.passedTools.push(event.data.tool);
    } else if (event.type === 'block_abandoned') {
      if (!state.active || !state.active.failed) throw new Error(`event ${event.sequence} abandons a block without a recorded failure`);
      state.active = null;
    } else if (event.type === 'block_completed') {
      if (!state.active || state.active.failed || state.active.passedTools.length !== block.toolOrder.length) throw new Error(`event ${event.sequence} completes an incomplete block`);
      state.completedBlocks.add(block.blockId);
      state.active = null;
    } else throw new Error(`unknown ledger event type ${event.type}`);
  }
  return state;
}

async function loadCampaign(campaignDir) {
  const [manifest, ledgerText, schedule, protocol, freeze] = await Promise.all([
    readJson(path.join(campaignDir, 'campaign.json')),
    readFile(path.join(campaignDir, 'ledger.jsonl'), 'utf8'),
    readJson(schedulePath),
    readJson(protocolPath),
    readJson(freezePath)
  ]);
  const events = verifyLedgerText(ledgerText);
  if (manifest.protocolSha256 !== freeze.files['protocols/confirmatory-v1/protocol.json']) throw new Error('campaign protocol hash differs from freeze manifest');
  if (manifest.scheduleSha256 !== freeze.files['protocols/confirmatory-v1/schedule.json']) throw new Error('campaign schedule hash differs from freeze manifest');
  if (events[0]?.type !== 'campaign_initialized' || events[0].data.campaignManifestSha256 !== sha256(await readFile(path.join(campaignDir, 'campaign.json')))) throw new Error('campaign initialization does not authenticate campaign.json');
  for (const event of events.filter(item => item.type === 'cell_passed' || item.type === 'cell_failed')) {
    const evidencePath = path.resolve(campaignDir, event.data.evidence.path);
    if (!evidencePath.startsWith(`${path.resolve(campaignDir)}${path.sep}`)) throw new Error(`event ${event.sequence} evidence escapes campaign directory`);
    const evidenceBytes = await readFile(evidencePath);
    if (evidenceBytes.length !== event.data.evidence.bytes || sha256(evidenceBytes) !== event.data.evidence.sha256) throw new Error(`event ${event.sequence} evidence hash mismatch`);
  }
  const state = deriveCampaignState(schedule, events, protocol.exclusions.maximumReplacementAttempts);
  return { manifest, events, schedule, protocol, state };
}

export async function auditCampaign(campaignDir) {
  const loaded = await loadCampaign(campaignDir);
  const next = loaded.schedule.blocks.find(block => !loaded.state.completedBlocks.has(block.blockId)) ?? null;
  return {
    valid: true,
    campaignId: loaded.manifest.campaignId,
    ledgerEvents: loaded.events.length,
    ledgerHeadSha256: loaded.events.at(-1)?.entryHash ?? null,
    completedBlocks: loaded.state.completedBlocks.size,
    totalBlocks: loaded.schedule.blocks.length,
    active: loaded.state.active ? { blockId: loaded.state.active.block.blockId, attempt: loaded.state.active.attempt, nextTool: loaded.state.active.block.toolOrder[loaded.state.active.passedTools.length] } : null,
    nextBlock: next?.blockId ?? null,
    publicationEligible: false
  };
}

async function initCampaign(campaignDir, campaignId) {
  try { await stat(campaignDir); throw new Error(`campaign directory already exists: ${campaignDir}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const protocolForGate = await readJson(protocolPath);
  const host = await inspectHost(path.dirname(campaignDir), protocolForGate.environmentGate.loadGateObservationSeconds);
  if (!host.pass) throw new Error(`host gate failed; run inspect-host for details`);
  const [freeze, protocol, schedule] = await Promise.all([readJson(freezePath), readJson(protocolPath), readJson(schedulePath)]);
  const commit = command('git', ['-C', root, 'rev-parse', 'HEAD']);
  if (!commit.ok) throw new Error('cannot resolve repository commit');
  const manifest = {
    schemaVersion: 1,
    campaignId,
    protocol: protocol.id,
    protocolSha256: freeze.files['protocols/confirmatory-v1/protocol.json'],
    scheduleSha256: freeze.files['protocols/confirmatory-v1/schedule.json'],
    repositoryCommit: commit.output,
    createdAt: new Date().toISOString(),
    runtime: process.version,
    host,
    plannedBlocks: schedule.blockCount,
    plannedIndependentUnits: schedule.independentUnitCount,
    publicationEligible: false
  };
  await import('node:fs/promises').then(fs => fs.mkdir(campaignDir, { recursive: false }));
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(path.join(campaignDir, 'campaign.json'), manifestBytes, { flag: 'wx' });
  await writeFile(path.join(campaignDir, 'ledger.jsonl'), '', { flag: 'wx' });
  await appendEvent(campaignDir, 'campaign_initialized', { campaignManifestSha256: sha256(manifestBytes) });
  return auditCampaign(campaignDir);
}

async function beginBlock(campaignDir, requestedBlock) {
  const loaded = await loadCampaign(campaignDir);
  if (loaded.state.active) throw new Error(`block ${loaded.state.active.block.blockId} is already active`);
  const next = loaded.schedule.blocks.find(block => !loaded.state.completedBlocks.has(block.blockId));
  if (!next) throw new Error('campaign is complete');
  if (requestedBlock && requestedBlock !== next.blockId) throw new Error(`requested ${requestedBlock}, next block is ${next.blockId}`);
  const attempt = (loaded.state.attempts.get(next.blockId) ?? 0) + 1;
  await appendEvent(campaignDir, 'block_started', { blockId: next.blockId, attempt, toolOrder: next.toolOrder });
  return auditCampaign(campaignDir);
}

async function recordCell(campaignDir, tool, statusValue, evidencePath, reason) {
  const loaded = await loadCampaign(campaignDir);
  if (!loaded.state.active) throw new Error('no active block');
  const { block, attempt, passedTools } = loaded.state.active;
  const expectedTool = block.toolOrder[passedTools.length];
  if (tool !== expectedTool) throw new Error(`expected tool ${expectedTool}, received ${tool}`);
  if (!['passed', 'failed'].includes(statusValue)) throw new Error('--status must be passed or failed');
  if (statusValue === 'failed' && (!reason || reason.trim().length === 0)) throw new Error('failed cells require --reason');
  const resolvedCampaign = path.resolve(campaignDir);
  const resolvedEvidence = path.resolve(evidencePath);
  if (!resolvedEvidence.startsWith(`${resolvedCampaign}${path.sep}`)) throw new Error('evidence must be stored inside the campaign directory');
  const evidenceBytes = await readFile(resolvedEvidence);
  const evidence = { path: path.relative(resolvedCampaign, resolvedEvidence), sha256: sha256(evidenceBytes), bytes: evidenceBytes.length };
  await appendEvent(campaignDir, statusValue === 'passed' ? 'cell_passed' : 'cell_failed', {
    blockId: block.blockId,
    attempt,
    tool,
    evidence,
    reason: reason ?? null
  });
  if (statusValue === 'failed') await appendEvent(campaignDir, 'block_abandoned', { blockId: block.blockId, attempt, reason: reason ?? 'cell failure' });
  else if (passedTools.length + 1 === block.toolOrder.length) await appendEvent(campaignDir, 'block_completed', { blockId: block.blockId, attempt });
  return auditCampaign(campaignDir);
}

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const action = positional[0];
  if (action === 'inspect-host') console.log(JSON.stringify(await inspectHost(options.path ? path.resolve(options.path) : root, Number(options['observe-seconds'] ?? 0)), null, 2));
  else if (action === 'init') console.log(JSON.stringify(await initCampaign(path.resolve(required(options, 'campaign-dir')), required(options, 'campaign-id')), null, 2));
  else if (action === 'audit' || action === 'status') console.log(JSON.stringify(await auditCampaign(path.resolve(required(options, 'campaign-dir'))), null, 2));
  else if (action === 'begin') console.log(JSON.stringify(await beginBlock(path.resolve(required(options, 'campaign-dir')), options['block-id']), null, 2));
  else if (action === 'record') console.log(JSON.stringify(await recordCell(path.resolve(required(options, 'campaign-dir')), required(options, 'tool'), required(options, 'status'), path.resolve(required(options, 'evidence')), options.reason), null, 2));
  else throw new Error('usage: confirmatory-campaign.mjs inspect-host | init | audit | status | begin | record');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(`ERROR: ${error.message}`); process.exit(1); });
}
