import fs from 'node:fs';
import path from 'node:path';
import webpack from 'webpack';
import config from './webpack.config.cjs';

await new Promise((resolve, reject) => {
  webpack(config, (error, stats) => {
    if (error) return reject(error);
    if (stats.hasErrors()) return reject(new Error(stats.toString({ colors: false, errors: true, warnings: true })));
    console.log(stats.toString({ colors: false, assets: true, chunks: false, modules: false }));
    resolve();
  });
});
const source = path.resolve('public');
if (fs.existsSync(source)) fs.cpSync(source, path.resolve('dist'), { recursive: true });
