const path = require('node:path');

const roots = {
  '@excalidraw/common': 'packages/common/src',
  '@excalidraw/element': 'packages/element/src',
  '@excalidraw/excalidraw': 'packages/excalidraw',
  '@excalidraw/fractional-indexing': 'packages/fractional-indexing/src',
  '@excalidraw/laser-pointer': 'packages/laser-pointer/src',
  '@excalidraw/math': 'packages/math/src',
  '@excalidraw/utils': 'packages/utils/src',
};

const exactEntries = {
  '@excalidraw/common': 'packages/common/src/index.ts',
  '@excalidraw/element': 'packages/element/src/index.ts',
  '@excalidraw/excalidraw': 'packages/excalidraw/index.tsx',
  '@excalidraw/fractional-indexing': 'packages/fractional-indexing/src/index.ts',
  '@excalidraw/laser-pointer': 'packages/laser-pointer/src/index.ts',
  '@excalidraw/math': 'packages/math/src/index.ts',
  '@excalidraw/utils': 'packages/utils/src/index.ts',
};

function webpackAliases(root = process.cwd()) {
  return Object.fromEntries(Object.entries(exactEntries).flatMap(([name, target]) => [
    [`${name}$`, path.resolve(root, target)],
    [name, path.resolve(root, roots[name])],
  ]));
}

function orderedAliases(root = process.cwd()) {
  return Object.entries(roots).flatMap(([name, target]) => [
    { find: new RegExp(`^${name.replace('/', '\\/')}$`), replacement: path.resolve(root, exactEntries[name]) },
    { find: new RegExp(`^${name.replace('/', '\\/')}\\/(.*)$`), replacement: `${path.resolve(root, target)}/$1` },
  ]);
}

function resolveAlias(specifier, root = process.cwd()) {
  for (const [name, target] of Object.entries(roots)) {
    if (specifier === name) return path.resolve(root, exactEntries[name]);
    if (specifier.startsWith(`${name}/`)) return path.resolve(root, target, specifier.slice(name.length + 1));
  }
  return null;
}

module.exports = { webpackAliases, orderedAliases, resolveAlias };
