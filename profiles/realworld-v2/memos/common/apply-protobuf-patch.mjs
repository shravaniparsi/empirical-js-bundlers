import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(require.resolve('@bufbuild/protobuf')), '../..');

function replaceExactly(relative, before, after) {
  const filename = path.join(root, relative);
  const source = fs.readFileSync(filename, 'utf8');
  if (source.includes(after)) return;
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`Expected one patch target in ${filename}; found ${occurrences}`);
  fs.writeFileSync(filename, source.replace(before, after));
}

const createBefore = `        ret[entry[0]] = fn(entry[1]);`;
const createAfter = `        const value = fn(entry[1]);
        if (entry[0] === "__proto__") {
            Object.defineProperty(ret, entry[0], {
                value,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        }
        else {
            ret[entry[0]] = value;
        }`;
for (const relative of ['dist/cjs/create.js', 'dist/esm/create.js']) replaceExactly(relative, createBefore, createAfter);

const reflectBefore = `        this.obj[mapKeyToLocal(key)] = mapValueToLocal(this._field, value);`;
const reflectAfter = `        const localKey = mapKeyToLocal(key);
        const localValue = mapValueToLocal(this._field, value);
        if (localKey === "__proto__") {
            Object.defineProperty(this.obj, localKey, {
                value: localValue,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        }
        else {
            this.obj[localKey] = localValue;
        }`;
for (const relative of ['dist/cjs/reflect/reflect.js', 'dist/esm/reflect/reflect.js']) replaceExactly(relative, reflectBefore, reflectAfter);

console.log('Applied and verified the upstream @bufbuild/protobuf 2.12.0 patch.');
