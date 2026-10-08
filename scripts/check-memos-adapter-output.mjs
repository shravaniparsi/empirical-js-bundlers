import fs from 'node:fs';
import path from 'node:path';
import { inspectOutput } from './check-production-contract.mjs';

const [distArg, output] = process.argv.slice(2);
if (!distArg || !output || fs.existsSync(output)) throw new Error('Usage: check-memos-adapter-output.mjs <dist> <NEW-report-path>');
const dist = path.resolve(distArg);
const report = await inspectOutput(dist, { requireEveryJsMap: false, strictVendorMappings: false });
report.kind = 'memos-five-tool-adapter-output-contract';
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (html.includes('/src/main.tsx')) report.errors.push('HTML retains the upstream Vite source entry');
const forbiddenCss = /@(apply|tailwind|theme|utility)(?:\s|\{|;)/;
for (const row of report.css) {
  const css = fs.readFileSync(path.join(dist, row.file), 'utf8');
  if (forbiddenCss.test(css)) report.errors.push(`${row.file}: contains an uncompiled Tailwind directive`);
}
const files = fs.readdirSync(path.join(dist, 'assets'), { recursive: true }).map(String);
if (!files.some((name) => /maplibre-gl-worker.*\.m?js$/.test(name))) report.errors.push('Standalone MapLibre worker asset is absent');
report.passed = report.errors.length === 0;
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, errors: report.errors }));
process.exitCode = report.passed ? 0 : 1;
