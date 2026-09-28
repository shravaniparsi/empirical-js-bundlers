import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const [sourceArg, destinationArg, tool] = process.argv.slice(2);
const tools = new Set(['vite', 'rspack', 'esbuild', 'webpack', 'rollup']);
if (!sourceArg || !destinationArg || !tools.has(tool)) {
  throw new Error('Usage: prepare-memos-adapter.mjs <pinned-memos-web> <NEW-destination> <vite|rspack|esbuild|webpack|rollup>');
}
const source = fs.realpathSync(sourceArg);
const destination = path.resolve(destinationArg);
if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite ${destination}`);
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profile = path.join(repository, 'profiles/realworld-v2/memos');

fs.cpSync(source, destination, {
  recursive: true,
  filter: (filename) => !['node_modules', 'dist', '.git'].includes(path.basename(filename)),
});
for (const name of fs.readdirSync(path.join(profile, 'common'))) {
  fs.copyFileSync(path.join(profile, 'common', name), path.join(destination, name));
}
for (const name of fs.readdirSync(path.join(profile, tool))) {
  if (name === 'profile.json') fs.copyFileSync(path.join(profile, tool, name), path.join(destination, 'benchmark-profile.json'));
  else fs.copyFileSync(path.join(profile, tool, name), path.join(destination, name));
}

function inventory(directory) {
  const rows = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) walk(filename);
      else if (entry.isFile()) rows.push({
        path: path.relative(destination, filename).split(path.sep).join('/'),
        sha256: crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'),
      });
    }
  };
  walk(directory);
  return rows;
}
const applicationInventory = [
  ...inventory(path.join(destination, 'src')),
  ...(fs.existsSync(path.join(destination, 'public')) ? inventory(path.join(destination, 'public')) : []),
  ...['index.html'].map((name) => ({
    path: name,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(destination, name))).digest('hex'),
  })),
].sort((a, b) => a.path.localeCompare(b.path));
const report = {
  application: 'memos',
  applicationCommit: '05a2c6db7a3e926c9142a635f42f7af0f078c81d',
  tool,
  publicationEligible: false,
  applicationFiles: applicationInventory.length,
  applicationInventorySha256: crypto.createHash('sha256').update(JSON.stringify(applicationInventory)).digest('hex'),
};
fs.writeFileSync(path.join(destination, 'adapter-preparation.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
