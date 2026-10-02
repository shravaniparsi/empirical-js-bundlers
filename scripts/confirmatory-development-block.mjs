#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { beginBlock, inspectHost, loadCampaign, recordCell } from './confirmatory-campaign.mjs';
import { collectDevelopmentReadinessCell } from './confirmatory-development-cell.mjs';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith('--') || argv[index + 1] === undefined) throw new Error('arguments must be --name value pairs');
    options[argv[index].slice(2)] = argv[index + 1];
  }
  return options;
}

export async function runDevelopmentBlock({ campaignDir, workspaceRoot, memosBackend }) {
  const loaded = await loadCampaign(campaignDir);
  if (loaded.state.active) throw new Error(`campaign already has active block ${loaded.state.active.block.blockId}; audit the interrupted attempt before continuing`);
  const block = loaded.schedule.blocks.find(candidate => !loaded.state.completedBlocks.has(candidate.blockId));
  if (!block) throw new Error('campaign is complete');
  if (block.metric !== 'M1') throw new Error(`next frozen block is ${block.blockId}; M1 executor cannot run metric ${block.metric}`);
  const repositoryCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (repositoryCommit !== loaded.manifest.repositoryCommit) throw new Error(`campaign commit is ${loaded.manifest.repositoryCommit}; checkout is ${repositoryCommit}`);
  const attempt = (loaded.state.attempts.get(block.blockId) ?? 0) + 1;
  const attemptDir = path.join(campaignDir, 'evidence', block.blockId.replaceAll('|', '__'), `attempt-${String(attempt).padStart(2, '0')}`);
  fs.mkdirSync(path.dirname(attemptDir), { recursive: true });
  fs.mkdirSync(attemptDir);
  const hostGatePath = path.join(attemptDir, 'pre-block-host.json');
  const host = await inspectHost(workspaceRoot, loaded.protocol.environmentGate.loadGateObservationSeconds);
  fs.writeFileSync(hostGatePath, `${JSON.stringify(host, null, 2)}\n`, { flag: 'wx' });
  if (!host.pass) throw new Error(`pre-block host gate failed; block ${block.blockId} was not started`);
  await beginBlock(campaignDir, block.blockId);
  for (const tool of block.toolOrder) {
    const cellDir = path.join(attemptDir, tool);
    const cellEvidence = path.join(cellDir, 'cell.json');
    try {
      await collectDevelopmentReadinessCell({
        workspaceRoot, evidenceDir: cellDir, workload: block.workload, tool,
        memosBackend, hostGatePath,
        timeoutMs: loaded.protocol.timeoutsSeconds.M1Readiness * 1000,
      });
      await recordCell(campaignDir, tool, 'passed', cellEvidence);
    } catch (error) {
      if (!fs.existsSync(cellEvidence)) {
        fs.mkdirSync(cellDir, { recursive: true });
        fs.writeFileSync(cellEvidence, `${JSON.stringify({
          schemaVersion: 1, kind: 'confirmatory-development-readiness-cell', publicationEligible: false,
          metric: 'M1', workload: block.workload, tool, accepted: false, error: error.message,
        }, null, 2)}\n`, { flag: 'wx' });
      }
      await recordCell(campaignDir, tool, 'failed', cellEvidence, error.message);
      throw error;
    }
  }
  const finished = await loadCampaign(campaignDir);
  return { blockId: block.blockId, attempt, completed: finished.state.completedBlocks.has(block.blockId) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args['campaign-dir'] || !args['workspace-root']) throw new Error('usage: confirmatory-development-block.mjs --campaign-dir DIR --workspace-root DIR [--memos-backend FILE]');
  console.log(JSON.stringify(await runDevelopmentBlock({
    campaignDir: path.resolve(args['campaign-dir']), workspaceRoot: path.resolve(args['workspace-root']),
    memosBackend: args['memos-backend'] ? path.resolve(args['memos-backend']) : undefined,
  }), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(`ERROR: ${error.message}`); process.exit(1); });
