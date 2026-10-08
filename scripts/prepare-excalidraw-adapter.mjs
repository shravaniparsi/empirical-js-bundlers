import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const [sourceArg, destinationArg, tool] = process.argv.slice(2);
const tools = new Set(['vite', 'rspack', 'esbuild', 'webpack', 'rollup']);
if (!sourceArg || !destinationArg || !tools.has(tool)) {
  throw new Error('Usage: prepare-excalidraw-adapter.mjs <pinned-excalidraw> <NEW-destination> <vite|rspack|esbuild|webpack|rollup>');
}
const source = fs.realpathSync(sourceArg);
const destination = path.resolve(destinationArg);
if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite ${destination}`);
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profile = path.join(repository, 'profiles/realworld-v2/excalidraw');

fs.cpSync(source, destination, {
  recursive: true,
  filter: (filename) => !['.git', 'node_modules', 'build', 'dist'].includes(path.basename(filename)),
});
for (const name of fs.readdirSync(path.join(profile, 'common'))) {
  fs.copyFileSync(path.join(profile, 'common', name), path.join(destination, name));
}
for (const name of fs.readdirSync(path.join(profile, tool))) {
  if (name === 'profile.json') fs.copyFileSync(path.join(profile, tool, name), path.join(destination, 'benchmark-profile.json'));
  else fs.copyFileSync(path.join(profile, tool, name), path.join(destination, name));
}

// The original variable locale import is a Vite feature. Expand it into literal
// imports once, identically for every adapter, while preserving lazy loading.
const localeDirectory = path.join(destination, 'packages/excalidraw/locales');
const localeNames = fs.readdirSync(localeDirectory)
  .filter((name) => name.endsWith('.json') && name !== 'percentages.json')
  .map((name) => name.slice(0, -5))
  .sort();
const localeFile = path.join(destination, 'packages/excalidraw/i18n.ts');
let localeSource = fs.readFileSync(localeFile, 'utf8');
const anchor = 'import percentages from "./locales/percentages.json";';
const target = 'await import(`./locales/${currentLang.code}.json`)';
if (!localeSource.includes(anchor) || !localeSource.includes(target)) throw new Error('Pinned locale source no longer matches the reviewed adapter transform');
const loaders = localeNames.map((name) => `  ${JSON.stringify(name)}: () => import(${JSON.stringify(`./locales/${name}.json`)}),`).join('\n');
localeSource = localeSource
  .replace(anchor, `${anchor}\n\nconst BENCHMARK_LOCALE_LOADERS: Record<string, () => Promise<unknown>> = {\n${loaders}\n};`)
  .replace(target, 'BENCHMARK_LOCALE_LOADERS[currentLang.code]()');
fs.writeFileSync(localeFile, localeSource);

const entryFile = path.join(destination, 'excalidraw-app/index.tsx');
let entrySource = fs.readFileSync(entryFile, 'utf8');
const pwaImport = 'from "virtual:pwa-register"';
if (!entrySource.includes(pwaImport)) throw new Error('Pinned PWA registration import no longer matches the reviewed adapter transform');
entrySource = entrySource.replace(pwaImport, 'from "../benchmark-pwa-register.mjs"');
fs.writeFileSync(entryFile, entrySource);

function hash(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}
const report = {
  application: 'excalidraw',
  applicationCommit: '5db42c3ddbbdc44d10120ab2f18e0864d083e268',
  tool,
  publicationEligible: false,
  sharedTransforms: ['literal-lazy-locale-imports', 'no-op-service-worker-registration'],
  localeModules: localeNames.length,
  transformedLocaleSha256: hash(localeFile),
  transformedEntrySha256: hash(entryFile),
};
fs.writeFileSync(path.join(destination, 'adapter-preparation.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
