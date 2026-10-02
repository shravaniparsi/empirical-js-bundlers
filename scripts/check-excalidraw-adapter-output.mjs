import fs from 'node:fs';
import path from 'node:path';
import { inspectOutput } from './check-production-contract.mjs';

const [distArg, output] = process.argv.slice(2);
if (!distArg || !output || fs.existsSync(output)) throw new Error('Usage: check-excalidraw-adapter-output.mjs <dist> <NEW-report-path>');
const dist = path.resolve(distArg);
const report = await inspectOutput(dist, { requireEveryJsMap: false, strictVendorMappings: false });
report.kind = 'excalidraw-five-tool-adapter-output-contract';
report.errors = report.errors.filter((error) => error !== 'Application entry is not represented in source maps');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (html.includes('/excalidraw-app/index.tsx')) report.errors.push('HTML retains the TypeScript source entry');
const files = fs.readdirSync(dist, { recursive: true }).map(String);
if (!files.some((name) => name.endsWith('.woff2'))) report.errors.push('No emitted or copied WOFF2 font asset was found');
if (!report.css.length) report.errors.push('No compiled stylesheet was found');
const entryMapped = files.filter((name) => name.endsWith('.js.map')).some((name) => {
  const map = JSON.parse(fs.readFileSync(path.join(dist, name), 'utf8'));
  return map.sources?.some((source) => /excalidraw-app\/index\.tsx(?:$|\?)/.test(source));
});
if (!entryMapped) {
  report.errors.push('Excalidraw application entry is not represented in source maps');
}
report.passed = report.errors.length === 0;
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
