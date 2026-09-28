import { transformAsync } from '@babel/core';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const options = require('./babel.config.cjs');

export async function transformApplication(code, filename) {
  const result = await transformAsync(code, { ...options, filename });
  if (!result?.code) throw new Error(`Babel emitted no code for ${filename}`);
  return { code: result.code, map: result.map };
}

export function withInlineSourceMap(result) {
  if (!result.map) return result.code;
  const encoded = Buffer.from(JSON.stringify(result.map)).toString('base64');
  return `${result.code}\n//# sourceMappingURL=data:application/json;base64,${encoded}`;
}
