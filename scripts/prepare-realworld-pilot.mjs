import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, `.submission-pilot/bulletproof-corrected-${process.env.PILOT_REVISION ?? 'v1'}`);
if (fs.existsSync(destination)) throw new Error('Refusing to overwrite a real-world pilot');
const common = path.join(root, 'tier2-realworld/workspaces/vite/bulletproof-react');
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const receipt = { kind: 'scoped-bulletproof-react-correctness-pilot', commonSource: path.relative(root, common), adaptations: ['Retains the recovered no-op MSW entry', 'Uses a deterministic local test API for browser acceptance, not the upstream production API', 'All tools receive identical application sources and /api environment', 'External Inter stylesheet omitted; system font fallback is identical across tools'], files: {} };
for (const tool of ['vite', 'rspack', 'esbuild', 'webpack', 'rollup']) {
  const target = path.join(destination, tool);
  fs.cpSync(common, target, { recursive: true, filter: file => !['node_modules', '.git', 'dist'].includes(path.basename(file)) });
  const html = path.join(target, 'index.html');
  fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace(/<link[^>]*href="https:\/\/rsms\.me\/inter\/inter\.css"[^>]*>/g, ''));
  const recovered = path.join(root, 'tier2-realworld/workspaces', tool, 'bulletproof-react');
  for (const file of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(recovered, file), path.join(target, file));
  fs.writeFileSync(path.join(target, '.env.production'), 'VITE_APP_API_URL=/api\nVITE_APP_ENABLE_API_MOCKING=false\n');
  const configs = path.join(root, 'configs/realworld', tool);
  for (const name of fs.readdirSync(configs)) {
    const output = tool === 'esbuild' ? path.join(target, 'configs/esbuild', name) : path.join(target, name);
    fs.mkdirSync(path.dirname(output), { recursive: true });fs.copyFileSync(path.join(configs, name), output);
  }
  receipt.files[tool] = { recoveredPackageSha256: sha(path.join(target, 'package.json')), recoveredLockSha256: sha(path.join(target, 'package-lock.json')), configHashes: Object.fromEntries(fs.readdirSync(configs).map(name => [name, sha(path.join(configs, name))])) };
}
fs.writeFileSync(path.join(destination, 'preparation.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(destination);
