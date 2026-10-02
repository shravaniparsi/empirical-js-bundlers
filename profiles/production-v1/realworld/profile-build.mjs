/** Same real-world command boundary and public-asset poststep for every tool. */
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const r=spawnSync('npm',['run','build:bundler'],{stdio:'inherit',env:{...process.env,NODE_ENV:'production'}});
if(r.status!==0){process.exitCode=r.status??1;}else if(fs.existsSync('public'))fs.cpSync('public','dist',{recursive:true});
