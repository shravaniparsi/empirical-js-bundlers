import fs from 'node:fs';
import path from 'node:path';

export const root = process.cwd();
export const src = path.join(root, 'src');
export const dist = path.join(root, 'dist');

export function resetDist() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
}

export function copyPublic() {
  const source = path.join(root, 'public');
  if (fs.existsSync(source)) fs.cpSync(source, dist, { recursive: true });
}

export function htmlWithEntry(entry) {
  return fs
    .readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace(/\s*<script type="module" src="\/src\/main\.tsx"><\/script>/, `\n    <script type="module" src="${entry}"></script>`);
}

export function writeHtml(entry) {
  fs.writeFileSync(path.join(dist, 'index.html'), htmlWithEntry(entry));
}

export function relativeAssetName(file) {
  return path.posix.join('assets', path.basename(file));
}
