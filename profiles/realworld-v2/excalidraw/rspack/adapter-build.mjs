import fs from 'node:fs';
import path from 'node:path';
import rspack from '@rspack/core';
import config from './rspack.config.cjs';

await new Promise((resolve, reject) => rspack.rspack(config, (error, stats) => {
  if (error) return reject(error);
  if (stats.hasErrors()) return reject(new Error(stats.toString({ colors: false, errors: true, warnings: true })));
  console.log(stats.toString({ colors: false, assets: true, chunks: false, modules: false }));
  resolve();
}));
if (fs.existsSync('public')) fs.cpSync('public', 'dist', { recursive: true });
if (fs.existsSync('packages/excalidraw/fonts')) fs.cpSync('packages/excalidraw/fonts', path.join('dist', 'fonts'), { recursive: true });
