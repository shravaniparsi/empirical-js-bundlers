import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();
const pkg = require(path.join(root, 'package.json'));
if (process.version !== `v${pkg.engines.node}`) {
  throw new Error(`Memos adapter requires Node ${pkg.engines.node}; found ${process.version}`);
}

const protobufRoot = path.resolve(path.dirname(require.resolve('@bufbuild/protobuf')), '../..');
const files = ['dist/cjs/create.js', 'dist/cjs/reflect/reflect.js', 'dist/esm/create.js', 'dist/esm/reflect/reflect.js'];
for (const relative of files) {
  const filename = path.join(protobufRoot, relative);
  const source = fs.readFileSync(filename, 'utf8');
  if (!source.includes('Object.defineProperty') || !source.includes('"__proto__"')) {
    throw new Error(`protobuf safety patch is absent from ${filename}`);
  }
}

const sourceHash = crypto.createHash('sha256');
for (const relative of ['index.html', 'package.json']) sourceHash.update(fs.readFileSync(path.join(root, relative)));
console.log(JSON.stringify({ node: process.version, protobufPatchVerified: true, profileHash: sourceHash.digest('hex') }));
