/**
 * Fail-closed structural and provenance checks for a validated rerun batch.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const batch = path.resolve(process.argv[2] ?? '');
if (!batch || !fs.existsSync(batch)) throw new Error('Usage: npx tsx scripts/validate-measurement-batch.ts <batch-dir>');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const expectedRuns: Record<string, number> = {
  M2: 10, M3: 20, M4: 20, M5: 1, M6: 1, M7: 1, M8: 1, M9: 1, M10: 10, M11: 10,
};
const expectedUnits: Record<string, string> = {
  M2: 'ms', M3: 'ms', M4: 'ms', M5: 'bytes', M6: 'bytes',
  M7: 'percent', M8: 'count', M9: 'percent', M10: 'MiB', M11: 'seconds',
};
const errors: string[] = [];
const seen = new Set<string>();
const csvFiles = walk(batch).filter(file =>
  file.endsWith('.csv') &&
  !file.includes(`${path.sep}analysis${path.sep}`) &&
  !file.includes(`${path.sep}logs${path.sep}`),
);
const manifestFile = path.join(batch, 'manifest.json');
if (!fs.existsSync(manifestFile)) throw new Error('Batch has no manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')) as { phase?: string; status?: string };
if (!manifest.phase || !['M3', 'M4', 'output', 'resources', 'M7', 'all'].includes(manifest.phase)) {
  throw new Error(`Invalid manifest phase: ${manifest.phase}`);
}
if (manifest.status === 'invalid' || fs.existsSync(path.join(batch, 'INVALID.md'))) {
  throw new Error('Refusing to validate a quarantined batch');
}

const tools = ['vite', 'rspack', 'esbuild', 'webpack', 'rollup'];
const sizes = ['xs-50', 's-200', 'm-500', 'l-2000', 'xl-5000'];
const expectedFiles = new Set<string>();
const addM3 = () => {
  for (const tool of tools) for (const size of sizes) expectedFiles.add(`tier1/${tool}_${size}_M3.csv`);
};
const addM4 = () => {
  for (const tool of ['vite', 'rspack', 'webpack']) {
    for (const size of ['xs-50', 'm-500', 'xl-5000']) expectedFiles.add(`tier1/${tool}_${size}_M4.csv`);
    expectedFiles.add(`tier2/${tool}_bp-react_M4.csv`);
  }
};
const addOutput = () => {
  for (const tool of tools) {
    for (const size of sizes) {
      for (const metric of ['M5', 'M6', 'M8', 'M9']) expectedFiles.add(`tier1/${tool}_${size}_${metric}.csv`);
    }
    for (const metric of ['M5', 'M6', 'M8', 'M9']) expectedFiles.add(`tier2/${tool}_bp-react_${metric}.csv`);
  }
};
const addResources = () => {
  for (const tool of tools) {
    for (const size of sizes) {
      for (const metric of ['M2', 'M10', 'M11']) expectedFiles.add(`tier1/${tool}_${size}_${metric}.csv`);
    }
    for (const metric of ['M2', 'M10', 'M11']) expectedFiles.add(`tier2/${tool}_bp-react_${metric}.csv`);
  }
};
const addM7 = () => {
  for (const tool of tools) expectedFiles.add(`tier1/${tool}_tree-shake_M7.csv`);
};
if (manifest.phase === 'M3' || manifest.phase === 'all') addM3();
if (manifest.phase === 'M4' || manifest.phase === 'all') addM4();
if (manifest.phase === 'output' || manifest.phase === 'all') addOutput();
if (manifest.phase === 'resources' || manifest.phase === 'all') addResources();
if (manifest.phase === 'M7' || manifest.phase === 'all') addM7();

const actualFiles = new Set(csvFiles.map(file => path.relative(batch, file)));
for (const expected of expectedFiles) if (!actualFiles.has(expected)) errors.push(`missing expected CSV ${expected}`);
for (const actual of actualFiles) if (!expectedFiles.has(actual)) errors.push(`unexpected CSV ${actual}`);

for (const csv of csvFiles) {
  const lines = fs.readFileSync(csv, 'utf8').trim().split('\n');
  const header = lines.shift()?.split(',') ?? [];
  if (header.join(',') !== 'tool,size,metric,run,value,unit,timestamp' &&
      header.join(',') !== 'tool,size,metric,run,value,unit,timestamp,session') {
    errors.push(`${csv}: invalid header`);
    continue;
  }
  const rows = lines.map(line => line.split(','));
  const metric = rows[0]?.[2];
  if (!metric || !(metric in expectedRuns)) {
    errors.push(`${csv}: unknown or missing metric`);
    continue;
  }
  if (rows.length !== expectedRuns[metric]) {
    errors.push(`${csv}: expected ${expectedRuns[metric]} rows, got ${rows.length}`);
  }
  const sessions = new Map<string, number>();
  const sessionTimestamps = new Map<string, Set<string>>();
  const runNumbers = new Set<number>();
  const firstIdentity = rows[0]?.slice(0, 3).join(',');
  const expectedBase = metric === 'M7'
    ? `${rows[0]?.[0]}_tree-shake_M7.csv`
    : `${rows[0]?.[0]}_${rows[0]?.[1]}_${metric}.csv`;
  if (path.basename(csv) !== expectedBase) errors.push(`${csv}: filename does not match row identity`);
  for (const row of rows) {
    if (row.length !== header.length) errors.push(`${csv}: malformed row ${row.join(',')}`);
    const [tool, size, rowMetric, run, rawValue, unit, timestamp, session] = row;
    const value = Number(rawValue);
    const runNumber = Number(run);
    const key = `${tool},${size},${rowMetric},${run}`;
    if (seen.has(key)) errors.push(`${csv}: duplicate observation ${key}`);
    seen.add(key);
    if (rowMetric !== metric) errors.push(`${csv}: mixed metrics`);
    if (row.slice(0, 3).join(',') !== firstIdentity) errors.push(`${csv}: mixed tool/size/metric identity`);
    if (!Number.isInteger(runNumber)) errors.push(`${csv}: invalid run ${run}`);
    runNumbers.add(runNumber);
    if (unit !== expectedUnits[metric]) errors.push(`${csv}: expected unit ${expectedUnits[metric]}, got ${unit}`);
    if (!timestamp) errors.push(`${csv}: missing timestamp`);
    if (!Number.isFinite(value) || value < 0) errors.push(`${csv}: invalid value ${rawValue}`);
    if ((metric === 'M7' || metric === 'M9') && value > 100) errors.push(`${csv}: percentage over 100`);
    if (metric === 'M3' || metric === 'M4') {
      if (!session) errors.push(`${csv}: missing session`);
      if (Number(session) !== Math.floor((runNumber - 1) / 4) + 1) {
        errors.push(`${csv}: run ${run} assigned to invalid session ${session}`);
      }
      sessions.set(session, (sessions.get(session) ?? 0) + 1);
      sessionTimestamps.set(session, new Set([...(sessionTimestamps.get(session) ?? []), timestamp]));
    }
  }
  for (let run = 1; run <= expectedRuns[metric]; run++) {
    if (!runNumbers.has(run)) errors.push(`${csv}: missing run ${run}`);
  }
  if ((metric === 'M3' || metric === 'M4') &&
      (sessions.size !== 5 || [...sessions.values()].some(count => count !== 4))) {
    errors.push(`${csv}: expected five sessions with four runs each`);
  }
  if ([...sessionTimestamps.values()].some(timestamps => timestamps.size !== 1)) {
    errors.push(`${csv}: a session contains mixed timestamps`);
  }

  const first = rows[0];
  if (!first) continue;
  const [tool, size] = first;
  let metadata: string;
  if (metric === 'M3' || metric === 'M4') metadata = csv.replace(/\.csv$/, '.meta.json');
  else if (metric === 'M7') metadata = path.join(path.dirname(csv), `${tool}_tree-shake_M7.meta.json`);
  else if (metric === 'M5' || metric === 'M6' || metric === 'M8' || metric === 'M9') {
    metadata = path.join(path.dirname(csv), `${tool}_${size}_output.meta.json`);
  } else {
    metadata = path.join(path.dirname(csv), `${tool}_${size}_M2-M10-M11.meta.json`);
  }
  if (!fs.existsSync(metadata)) errors.push(`${csv}: missing provenance ${metadata}`);
  else {
    try {
      const provenance = JSON.parse(fs.readFileSync(metadata, 'utf8'));
      if (metric === 'M3' || metric === 'M4') {
        if (provenance.metric !== metric || provenance.tool !== tool || provenance.size !== size) {
          errors.push(`${metadata}: identity does not match CSV`);
        }
        if (provenance.targetSha256 !== provenance.targetSha256After) {
          errors.push(`${metadata}: target restoration hash mismatch`);
        }
        if (metric === 'M3' &&
            (!String(provenance.target).endsWith(`${path.sep}src${path.sep}App.tsx`) ||
             provenance.nodeEnv !== 'development')) {
          errors.push(`${metadata}: M3 did not use the active App.tsx development target`);
        }
        if (!Array.isArray(provenance.runSessions) || provenance.runSessions.length !== 20) {
          errors.push(`${metadata}: expected 20 runSessions`);
        } else {
          const csvTriples = rows.map(row => `${row[3]}|${row[7]}|${row[4]}`).sort();
          const metaTriples = provenance.runSessions
            .map((run: { run: number; session: number; value: number }) => `${run.run}|${run.session}|${run.value}`)
            .sort();
          if (JSON.stringify(csvTriples) !== JSON.stringify(metaTriples)) {
            errors.push(`${metadata}: runSessions do not match CSV`);
          }
        }
        if (metric === 'M4' && provenance.probeRestored !== true) {
          errors.push(`${metadata}: HMR probe restoration not proven`);
        }
      } else if (metric === 'M7') {
        if (provenance.tool !== tool || provenance.eliminatedPercent !== Number(rows[0][4])) {
          errors.push(`${metadata}: M7 result does not match CSV`);
        }
        if (JSON.stringify(provenance.firstBuildBytes) !== JSON.stringify(provenance.deterministicSecondBuildBytes)) {
          errors.push(`${metadata}: M7 fixture builds are not deterministic`);
        }
      } else if (metric === 'M5' || metric === 'M6' || metric === 'M8' || metric === 'M9') {
        if (provenance.tool !== tool || provenance.size !== size ||
            !Array.isArray(provenance.outputRuns) || provenance.outputRuns.length !== 5) {
          errors.push(`${metadata}: invalid output provenance`);
        }
        if (provenance.sourceRestoration?.entryHashBefore !== provenance.sourceRestoration?.entryHashAfter ||
            provenance.sourceRestoration?.probeRestored !== true) {
          errors.push(`${metadata}: output probe restoration not proven`);
        }
        if (provenance.metricsAccepted !== true ||
            typeof provenance.byteForByteDeterministic !== 'boolean' ||
            typeof provenance.aggregationReason !== 'string' ||
            provenance.aggregationReason.length === 0) {
          errors.push(`${metadata}: output acceptance or determinism provenance is incomplete`);
        }
        if (metric === 'M9') {
          if (typeof provenance.sourceMapProbe?.valid !== 'boolean' ||
              Number(rows[0][4]) !== (provenance.sourceMapProbe.valid ? 100 : 0)) {
            errors.push(`${metadata}: M9 probe evidence does not match CSV`);
          }
        } else {
          const field = metric === 'M5' ? 'rawBytes' : metric === 'M6' ? 'gzipBytes' : 'jsFiles';
          const values = provenance.outputRuns
            ?.map((run: Record<string, number>) => run[field])
            .sort((left: number, right: number) => left - right);
          const median = values?.length === 5 ? values[2] : NaN;
          if (Number(rows[0][4]) !== median) errors.push(`${metadata}: ${metric} median does not match CSV`);
        }
      } else {
        if (provenance.tool !== tool || provenance.size !== size ||
            !Array.isArray(provenance.runDetails) || provenance.runDetails.length !== 10 ||
            typeof provenance.sourceSha256 !== 'string') {
          errors.push(`${metadata}: invalid resource provenance`);
        } else {
          for (const row of rows) {
            const detail = provenance.runDetails.find((run: { run: number }) => run.run === Number(row[3]));
            const expected = metric === 'M2'
              ? Math.round(detail.realSeconds * 1000)
              : metric === 'M10'
                ? Math.round(detail.rssBytes / 1_048_576 * 100) / 100
                : Math.round((detail.userSeconds + detail.systemSeconds) * 100) / 100;
            if (Number(row[4]) !== expected) errors.push(`${metadata}: ${metric} run ${row[3]} does not match timing detail`);
          }
        }
      }
    }
    catch { errors.push(`${metadata}: invalid JSON`); }
  }
}

if (!csvFiles.length) errors.push('Batch contains no CSV files');
if (errors.length) {
  console.error(`Batch validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Batch validation passed: ${csvFiles.length} CSV files, ${seen.size} observations.`);
}
