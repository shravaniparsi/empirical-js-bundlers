/** Validate emitted ES2022 syntax and useful external JS source maps, outside timing. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require=createRequire(new URL('../profiles/production-v1/validation/package.json',import.meta.url));
const {parse}=require('acorn');const {SourceMapConsumer}=require('source-map');
export async function inspectOutput(dist){
 const report={kind:'production-v1-output-contract',passed:false,errors:[],javascript:[],css:[],publicationEligible:false};
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 for(const file of walk(dist)){
  if(file.endsWith('.css'))report.css.push({file:path.relative(dist,file),sha256:hash(file),mapPresent:fs.existsSync(file+'.map')});
  if(!file.endsWith('.js'))continue;
  const row={file:path.relative(dist,file),sha256:hash(file),mappedSegments:0,projectSources:[]};report.javascript.push(row);
  try{
   const code=fs.readFileSync(file,'utf8');parse(code,{ecmaVersion:2022,sourceType:'module'});
   const urls=[...code.matchAll(/[#@]\s*sourceMappingURL=([^\s*]+)/g)];
   if(!urls.length)throw Error('No linked external source map');
   const url=urls.at(-1)[1];if(url.startsWith('data:')||url.includes('://'))throw Error('Source map must be local and external');
   const mapPath=url.startsWith("/")?path.resolve(dist,"."+url):path.resolve(path.dirname(file),url);
   if(!mapPath.startsWith(path.resolve(dist)+path.sep))throw Error('Source map escapes dist');
   const raw=JSON.parse(fs.readFileSync(mapPath,'utf8'));
   if(!Array.isArray(raw.sourcesContent)||raw.sourcesContent.length!==raw.sources.length)throw Error('Missing sourcesContent');
   await SourceMapConsumer.with(raw,null,consumer=>{
    const sourceLines=new Map();
    consumer.eachMapping(m=>{
     if(m.originalLine==null||m.source==null)return;
     const content=consumer.sourceContentFor(m.source,true);
     if(typeof content!=='string')throw Error(`Missing mapped source: ${m.source}`);
     if(!sourceLines.has(m.source))sourceLines.set(m.source,content.split('\n'));
     const lines=sourceLines.get(m.source);
     if(m.originalLine<1||m.originalLine>lines.length||m.originalColumn>lines[m.originalLine-1].length)throw Error(`Original mapping outside source bounds: ${m.source}:${m.originalLine}:${m.originalColumn}, line length ${lines[m.originalLine-1]?.length}`);
     row.mappedSegments++;
    });
    row.projectSources=consumer.sources.filter(s=>/(^|\/)src\//.test(s)&&!/node_modules/.test(s));
   });
   if(!row.mappedSegments)throw Error('No usable original mappings');
   row.mapSha256=hash(mapPath);
  }catch(e){report.errors.push(`${row.file}: ${e.message}`);}
 }
 if(!report.javascript.length)report.errors.push('No JavaScript output');
 if(!report.css.length)report.errors.push('No external CSS output');
 if(!report.javascript.some(f=>f.projectSources.some(s=>/src\/main\.tsx(?:$|\?)/.test(s))))report.errors.push('Application entry is not represented in source maps');
 report.passed=report.errors.length===0;return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===new URL(import.meta.url).pathname){
 const [dist,out]=process.argv.slice(2);if(!dist||!out||fs.existsSync(out))throw Error('Specify dist and a NEW report path');
 const report=await inspectOutput(path.resolve(dist));fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,errors:report.errors}));process.exitCode=report.passed?0:1;
}
