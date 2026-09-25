/** Serial correctness only. No timing claims; strict npm ci, no dependency fallback. */
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const kind=process.argv[2],size=process.argv[3]??'xs-50',output=process.argv[4],only=process.argv[5];
if(!['synthetic','realworld'].includes(kind)||!output||fs.existsSync(output))throw Error('Usage: run-production-profile.mjs <synthetic|realworld> <size|app> <new-report-dir> [tool]');
const tools=['vite','rspack','esbuild','webpack','rollup'];if(only&&!tools.includes(only))throw Error('Unknown tool');
fs.mkdirSync(output,{recursive:true});const revision=process.env.PROFILE_REVISION??'profile-v1';
const root=path.resolve('.submission-pilot',kind==='synthetic'?`${size}-corrected-${revision}`:`bulletproof-corrected-${revision}`);
if(!fs.existsSync(root)){
 const r=spawnSync(process.execPath,['scripts/prepare-production-profile.mjs',kind,size],{stdio:'inherit'});if(r.status!==0)throw Error('Preparation failed');
}
fs.copyFileSync(path.join(root,'profile.json'),path.join(output,'profile.json'));
const rows=[];
for(const tool of only?[only]:tools){
 const workspace=path.join(root,tool),row={tool,kind,size,passed:false};rows.push(row);
 const steps=[['install','npm',['ci','--include=dev','--no-audit','--no-fund'],workspace],['build','npm',['run','build'],workspace],['contract',process.execPath,['scripts/check-production-contract.mjs',path.join(workspace,'dist'),path.join(output,`${tool}-contract.json`)],process.cwd()],['browser',process.execPath,[`scripts/check-${kind==='synthetic'?'production':'realworld'}-browser.mjs`,path.join(workspace,'dist'),path.join(output,`${tool}-browser.json`)],process.cwd()]];
 for(const [name,cmd,args,cwd] of steps){
  const log=fs.openSync(path.join(output,`${tool}-${name}.log`),'wx');const r=spawnSync(cmd,args,{cwd,env:{...process.env,NODE_ENV:name==='install'?'development':'production'},stdio:['ignore',log,log],timeout:name==='build'?1800000:300000});fs.closeSync(log);row[name]={exitCode:r.status,error:r.error?.message};
  if(r.status!==0)break;
 }
 row.passed=steps.every(([name])=>row[name]?.exitCode===0);fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(rows,null,2)+'\n');console.log(`${kind} ${size} ${tool}: ${row.passed?'PASS':'FAIL'}`);
 if(row.passed&&process.env.PROFILE_RELEASE_DEPENDENCIES==='1')fs.rmSync(path.join(workspace,'node_modules'),{recursive:true,force:true});
}
process.exitCode=rows.every(r=>r.passed)?0:1;
