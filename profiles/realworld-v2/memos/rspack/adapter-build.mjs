import fs from 'node:fs';
import path from 'node:path';
import rspack from '@rspack/core';
import config from './rspack.config.cjs';

await new Promise((resolve, reject) => {
  rspack.rspack(config, (error, stats) => {
    if (error) return reject(error);
    if (stats.hasErrors()) return reject(new Error(stats.toString({ colors: false, errors: true, warnings: true })));
    console.log(stats.toString({ colors: false, assets: true, chunks: false, modules: false }));
    resolve();
  });
});
const source = path.resolve('public');
if (fs.existsSync(source)) fs.cpSync(source, path.resolve('dist'), { recursive: true });
