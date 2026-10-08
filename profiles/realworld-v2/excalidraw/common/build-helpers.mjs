import fs from 'node:fs';
import path from 'node:path';

export const root = process.cwd();
export const dist = path.join(root, 'dist');

export function resetDist() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
}

export function copyStatic() {
  if (fs.existsSync(path.join(root, 'public'))) fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
  const fonts = path.join(root, 'packages/excalidraw/fonts');
  if (fs.existsSync(fonts)) fs.cpSync(fonts, path.join(dist, 'fonts'), { recursive: true });
}

export function htmlWithEntry(entry, stylesheet) {
  let html = fs.readFileSync(path.join(root, 'benchmark-index.html'), 'utf8')
    .replace(/<script type="module" src="\/excalidraw-app\/index\.tsx"><\/script>/, `<script type="module" src="${entry}"></script>`);
  if (stylesheet) html = html.replace('</head>', `    <link rel="stylesheet" href="${stylesheet}" />\n  </head>`);
  return html;
}

export function writeHtml(entry, stylesheet) {
  fs.writeFileSync(path.join(dist, 'index.html'), htmlWithEntry(entry, stylesheet));
}
