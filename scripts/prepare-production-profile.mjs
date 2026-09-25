/** Prepare a NEW profile workspace. Historical workspaces and prior gates remain immutable. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const kind=process.argv[2],size=process.argv[3]??'xs-50';
if(!['synthetic','realworld'].includes(kind))throw Error('Usage: prepare-production-profile.mjs synthetic <size> | realworld');
const revision=process.env.PROFILE_REVISION??'profile-v1';
if(!/^[a-z0-9-]+$/.test(revision))throw Error('Invalid revision');
const dir=path.join(root,'.submission-pilot',kind==='synthetic'?`${size}-corrected-${revision}`:`bulletproof-corrected-${revision}`);
if(fs.existsSync(dir))throw Error('Refusing to overwrite a profile workspace');
const r=spawnSync(process.execPath,[path.join(root,'scripts',kind==='synthetic'?'prepare-submission-pilot.mjs':'prepare-realworld-pilot.mjs'),...(kind==='synthetic'?[size]:[])],{cwd:root,env:{...process.env,PILOT_REVISION:revision},stdio:'inherit'});
if(r.status!==0)throw Error('Source preparation failed');
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const profile=path.join(root,'profiles/production-v1');
const receipt={profile:'production-v1',publicationEligible:false,kind,size:kind==='synthetic'?size:null,contractSha256:hash(path.join(profile,'contract.json')),tools:{}};
for(const tool of ['vite','rspack','esbuild','webpack','rollup']){
 const source=path.join(profile,kind,tool),target=path.join(dir,tool);
 const files={};
 for(const name of fs.readdirSync(source)){
  if(!/\.(json|mjs|cjs|ts)$/.test(name))continue;
  const dest=tool==='esbuild'&&name.endsWith('.mjs')?path.join(target,'configs/esbuild',name):path.join(target,name);
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(source,name),dest);files[name]=hash(dest);
 }
 if(kind==='realworld'){
  // All pipelines deploy the same public assets; MSW is disabled in this scoped application.
  fs.rmSync(path.join(target,'public/mockServiceWorker.js'),{force:true});
  const wrapper=path.join(profile,'realworld/profile-build.mjs');fs.copyFileSync(wrapper,path.join(target,'profile-build.mjs'));files['profile-build.mjs']=hash(wrapper);
 }
 receipt.tools[tool]=files;
}
fs.writeFileSync(path.join(dir,'profile.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(dir);
