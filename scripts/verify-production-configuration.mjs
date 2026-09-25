/** Fail closed if a prepared workspace no longer matches the versioned configuration. */
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const canonical=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../profiles/production-v1');
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function verifyConfiguration(workspace,profile=canonical){
 const errors=[];
 try{
  const receipt=JSON.parse(fs.readFileSync(path.join(workspace,'profile.json')));
  if(receipt.profile!=='production-v1'||!['synthetic','realworld'].includes(receipt.kind))throw Error('Unknown profile receipt');
  if(receipt.contractSha256!==hash(path.join(profile,'contract.json')))errors.push('Contract changed since preparation');
  for(const tool of ['vite','rspack','esbuild','webpack','rollup']){
   const source=path.join(profile,receipt.kind,tool);
   const names=fs.readdirSync(source).filter(n=>/\.(json|mjs|cjs|ts)$/.test(n));if(receipt.kind==='realworld')names.push('profile-build.mjs');
   for(const name of names){
    const original=name==='profile-build.mjs'?path.join(profile,'realworld',name):path.join(source,name);
    const prepared=tool==='esbuild'&&name.endsWith('.mjs')&&name!=='profile-build.mjs'?path.join(workspace,tool,'configs/esbuild',name):path.join(workspace,tool,name);
    const expected=hash(original);
    if(receipt.tools?.[tool]?.[name]!==expected)errors.push(`${tool}/${name}: stale preparation receipt`);
    if(hash(prepared)!==expected)errors.push(`${tool}/${name}: workspace differs from profile`);
   }
  }
 }catch(e){errors.push(e.message);}
 return {passed:!errors.length,errors,scope:'Configuration/package/lock identity only; source identity is a separate measurement gate'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){if(!process.argv[2])throw Error('Specify prepared workspace root');const report=verifyConfiguration(path.resolve(process.argv[2]));console.log(JSON.stringify(report));process.exitCode=report.passed?0:1;}
