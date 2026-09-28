import fs from 'node:fs/promises';
import path from 'node:path';

export function splitQuery(id) {
  const marker = id.indexOf('?');
  return marker === -1 ? [id, ''] : [id.slice(0, marker), id.slice(marker + 1)];
}

export function isTextQuery(query) {
  return query.split('&').some((part) => part === 'raw' || part === 'inline');
}

export function isWorkerUrlQuery(query) {
  const parts = new Set(query.split('&'));
  return parts.has('worker') && parts.has('url');
}

export async function loadTextModule(id) {
  const [filename, query] = splitQuery(id);
  if (!isTextQuery(query)) return null;
  return `export default ${JSON.stringify(await fs.readFile(filename, 'utf8'))};`;
}

export const workerAssetPattern = /maplibre-gl-worker\.mjs$/;

export function normalizeWorkerName(filename) {
  return path.posix.join('assets', path.basename(filename));
}
