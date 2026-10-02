import { spawn } from 'node:child_process';
import path from 'node:path';
const child = spawn(path.resolve('node_modules/.bin/rspack'), ['serve', '--config', 'rspack.dev.config.cjs', ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exit(code ?? 1); });
