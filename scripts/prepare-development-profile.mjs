import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const [tool, workspaceArg, kind = 'synthetic'] = process.argv.slice(2);
if (!['vite', 'rspack', 'webpack'].includes(tool) || !workspaceArg || !['synthetic', 'realworld'].includes(kind)) {
  throw new Error('Expected tool, fresh production-v1 workspace, and optional synthetic|realworld kind');
}
const workspace = fs.realpathSync(workspaceArg);
const receiptPath = path.join(workspace, 'DEVELOPMENT_PROFILE.json');
if (fs.existsSync(receiptPath)) throw new Error('Development profile already prepared');
const name = { vite: 'vite.config.ts', rspack: 'rspack.config.cjs', webpack: 'webpack.config.cjs' }[tool];
const config = path.join(workspace, name);
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const canonical = new URL(`../profiles/production-v1/${kind}/${tool}/${name}`, import.meta.url);
if (hash(config) !== hash(canonical)) throw new Error('Workspace does not match canonical production-v1 configuration');
const receipt = { id: 'development-v1', kind, tool, publicationEligible: false, productionBaseSha256: hash(config), changes: [] };
if (tool === 'rspack' || tool === 'webpack') {
  const baseName = `${tool}.production-base.cjs`;
  fs.copyFileSync(config, path.join(workspace, baseName), fs.constants.COPYFILE_EXCL);
  fs.copyFileSync(new URL(`../profiles/development-v1/${tool}.config.cjs`, import.meta.url), config);
  receipt.changes.push('Enable historyApiFallback for direct SPA routes');
  if (tool === 'rspack') receipt.changes.push('Disable serve-mode lazy compilation to avoid dynamic-chunk fallback races');
}
receipt.effectiveConfigSha256 = hash(config);
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(receipt));
