import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const root='profiles/production-v1',errors=[],inventory={};
for(const kind of ['synthetic','realworld']){
 inventory[kind]={};let expected,expectedClosure;
 for(const tool of ['vite','rspack','esbuild','webpack','rollup']){
  const dir=`${root}/${kind}/${tool}`,p=JSON.parse(fs.readFileSync(`${dir}/package.json`)),l=JSON.parse(fs.readFileSync(`${dir}/package-lock.json`));
  for(const section of ['dependencies','devDependencies'])for(const [name,version] of Object.entries(p[section]??{})){
   if(!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version))errors.push(`${kind}/${tool}: unpinned ${name}`);
   if(l.packages[`node_modules/${name}`]?.version!==version)errors.push(`${kind}/${tool}: lock mismatch ${name}`);
  }
  const sorted=Object.fromEntries(Object.entries(p.dependencies).sort());const serialized=JSON.stringify(sorted);if(expected&&expected!==serialized)errors.push(`${kind}/${tool}: different direct application dependencies`);expected=serialized;
  const nodes=new Set(),edges=new Set(),seen=new Set();
  function resolve(from,name){let current=from;while(true){const key=path.posix.join(current,'node_modules',name);if(l.packages[key])return key;if(!current)return null;current=path.posix.dirname(current);if(current==='.')current='';}}
  function visit(key){if(seen.has(key))return;seen.add(key);const data=l.packages[key],label=key.split('node_modules/').at(-1)+'@'+data.version;nodes.add(label);
   for(const name of new Set([...Object.keys(data.dependencies??{}),...Object.keys(data.optionalDependencies??{}),...Object.keys(data.peerDependencies??{})])){const dest=resolve(key,name);if(dest){edges.add(label+' -> '+name+'@'+l.packages[dest].version);visit(dest);}else if(data.dependencies?.[name]&&!data.optionalDependencies?.[name])errors.push(`${kind}/${tool}: unresolved runtime dependency ${name}`);}
  }
  for(const name of Object.keys(p.dependencies))visit(resolve('',name));
  const closure={nodes:[...nodes].sort(),edges:[...edges].sort()};const closureText=JSON.stringify(closure);if(expectedClosure&&expectedClosure!==closureText)errors.push(`${kind}/${tool}: application dependency closure differs`);expectedClosure??=closureText;
  inventory[kind][tool]={application:sorted,closure,resolved:Object.fromEntries(Object.entries(l.packages).filter(([k])=>k).map(([k,v])=>[k,{version:v.version,integrity:v.integrity}]))};
 }
}
const hashes={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='node_modules')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else hashes[p]=createHash('sha256').update(fs.readFileSync(p)).digest('hex');}}walk(root);
const report={profile:'production-v1',passed:!errors.length,errors,inventory,fileHashes:hashes,scope:'Checks exact direct versions, matching application declarations, and equal reachable dependency-version nodes and edges including installed optional/peer dependencies. Full lock inventories retained; build-only dependencies may differ by toolchain.'};
const out=process.argv[2];if(!out||fs.existsSync(out))throw Error('Choose a new audit report');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,errors}));process.exitCode=report.passed?0:1;
