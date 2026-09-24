#!/usr/bin/env npx tsx
/**
 * Statistical analysis for corrected, provenance-bearing measurement batches.
 *
 * M3/M4 inference uses independent session medians (not repeated updates from
 * one watcher). Omnibus tests include tie correction; post-hoc tests are Dunn
 * tests with Bonferroni correction. Cliff's delta includes seeded bootstrap CIs.
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ss from 'simple-statistics';

const require = createRequire(import.meta.url);
const { jStat } = require('jstat') as {
  jStat: {
    chisquare: { cdf: (value: number, degreesOfFreedom: number) => number };
    normal: { cdf: (value: number, mean: number, standardDeviation: number) => number };
  };
};

interface Row {
  tier: string;
  tool: string;
  size: string;
  metric: string;
  run: number;
  value: number;
  unit: string;
  timestamp: string;
  session?: number;
}

interface Ranked {
  value: number;
  group: number;
  rank: number;
}

const batch = path.resolve(process.argv[2] ?? '');
const verifySources = process.argv.slice(3).includes('--verify-sources');
if (!batch || !fs.existsSync(batch)) {
  throw new Error('Usage: npx tsx analysis/validated-analysis.ts <validated-batch-dir> [--verify-sources]');
}
const batchManifest = JSON.parse(fs.readFileSync(path.join(batch, 'manifest.json'), 'utf8'));
if (!['validated', 'complete'].includes(batchManifest.status) ||
    batchManifest.status === 'invalid' || fs.existsSync(path.join(batch, 'INVALID.md')) ||
    fs.existsSync(path.join(batch, '.incomplete')) ||
    (batchManifest.kind === 'consolidated-validated-analysis-input' &&
      batchManifest.coverageValidation !== 'passed')) {
  throw new Error(`Refusing to analyze batch with status ${batchManifest.status}`);
}
const inputManifestSha256 = createHash('sha256')
  .update(fs.readFileSync(path.join(batch, 'manifest.json')))
  .digest('hex');
const outputDir = path.join(batch, 'analysis');
fs.mkdirSync(outputDir, { recursive: true });

function csvFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'analysis' && entry.name !== 'logs') return csvFiles(full);
    return entry.isFile() && entry.name.endsWith('.csv') ? [full] : [];
  });
}

function fileHash(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function validateConsolidatedInput(): void {
  if (batchManifest.kind !== 'consolidated-validated-analysis-input') return;
  if (!Array.isArray(batchManifest.files) ||
      batchManifest.files.length !== batchManifest.csvFileCount ||
      !Array.isArray(batchManifest.sourceBatches) ||
      !Array.isArray(batchManifest.supplementalFiles)) {
    throw new Error('Consolidated manifest structure is incomplete');
  }
  const listed = new Set<string>();
  let observations = 0;
  for (const entry of batchManifest.files) {
    const file = path.resolve(batch, entry.file);
    if (!file.startsWith(`${batch}${path.sep}`) || path.extname(file) !== '.csv') {
      throw new Error(`Unsafe consolidated file path: ${entry.file}`);
    }
    if (!fs.existsSync(file) || fileHash(file) !== entry.sha256) {
      throw new Error(`Consolidated CSV hash mismatch: ${entry.file}`);
    }
    if (typeof entry.source !== 'string') {
      throw new Error(`Missing source provenance: ${entry.file}`);
    }
    if (verifySources) {
      const sourceFile = path.resolve(entry.source);
      if (!fs.existsSync(sourceFile) || fileHash(sourceFile) !== entry.sha256) {
        throw new Error(`Original source CSV hash mismatch: ${entry.source}`);
      }
    }
    const rowCount = Math.max(0, fs.readFileSync(file, 'utf8').trim().split('\n').length - 1);
    if (rowCount !== entry.observations) throw new Error(`Observation count mismatch: ${entry.file}`);
    observations += rowCount;
    listed.add(path.relative(batch, file));
  }
  const actual = csvFiles(batch).map(file => path.relative(batch, file));
  if (actual.length !== listed.size || actual.some(file => !listed.has(file))) {
    throw new Error('Consolidated CSV inventory differs from its manifest');
  }
  if (observations !== batchManifest.rawObservations) {
    throw new Error(`Consolidated observation total mismatch: ${observations} vs ${batchManifest.rawObservations}`);
  }
  if (verifySources) {
    for (const source of batchManifest.sourceBatches) {
      const manifest = path.resolve(source.batch, 'manifest.json');
      if (!fs.existsSync(manifest) || fileHash(manifest) !== source.manifestSha256) {
        throw new Error(`Source batch manifest hash mismatch: ${source.batch}`);
      }
    }
    for (const source of batchManifest.supplementalFiles) {
      const supplementalFile = path.resolve(source.file);
      if (!fs.existsSync(supplementalFile) || fileHash(supplementalFile) !== source.sha256) {
        throw new Error(`Supplemental CSV hash mismatch: ${source.file}`);
      }
    }
  }
}

validateConsolidatedInput();

function loadRows(): Row[] {
  const rows: Row[] = [];
  for (const file of csvFiles(batch)) {
    const tier = file.includes(`${path.sep}tier2${path.sep}`) ? 'tier2' : 'tier1';
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    const header = lines.shift()?.split(',') ?? [];
    for (const line of lines) {
      const values = line.split(',');
      const record = Object.fromEntries(header.map((key, index) => [key, values[index]]));
      const row: Row = {
        tier,
        tool: record.tool,
        size: record.size,
        metric: record.metric,
        run: Number(record.run),
        value: Number(record.value),
        unit: record.unit,
        timestamp: record.timestamp,
        ...(record.session ? { session: Number(record.session) } : {}),
      };
      if (!Number.isFinite(row.value) || row.value < 0) throw new Error(`Invalid value in ${file}: ${line}`);
      rows.push(row);
    }
  }
  return rows;
}

function groupBy<T>(values: T[], key: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const value of values) {
    const groupKey = key(value);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), value]);
  }
  return groups;
}

function analysisUnits(rows: Row[]): Row[] {
  const repeated = rows.filter(row => row.metric === 'M3' || row.metric === 'M4');
  const independent = rows.filter(row => row.metric !== 'M3' && row.metric !== 'M4');
  const sessions = groupBy(
    repeated,
    row => `${row.tier}|${row.tool}|${row.size}|${row.metric}|${row.session}`,
  );
  for (const values of sessions.values()) {
    if (values.length !== 4 || values[0].session === undefined) {
      throw new Error(`Invalid session structure: ${JSON.stringify(values)}`);
    }
    independent.push({
      ...values[0],
      run: values[0].session,
      value: ss.median(values.map(value => value.value)),
    });
  }
  return independent;
}

function assignRanks(groups: number[][]): { ranked: Ranked[]; tieSum: number } {
  const values = groups.flatMap((group, groupIndex) => group.map(value => ({ value, group: groupIndex })))
    .sort((a, b) => a.value - b.value);
  const ranked: Ranked[] = [];
  let tieSum = 0;
  for (let i = 0; i < values.length;) {
    let end = i + 1;
    while (end < values.length && values[end].value === values[i].value) end++;
    const count = end - i;
    const rank = (i + 1 + end) / 2;
    tieSum += count ** 3 - count;
    for (let index = i; index < end; index++) ranked.push({ ...values[index], rank });
    i = end;
  }
  return { ranked, tieSum };
}

function chiSquareSurvival(statistic: number, degreesOfFreedom: number): number {
  if (degreesOfFreedom > 0 && degreesOfFreedom % 2 === 0) {
    const half = statistic / 2;
    let term = 1;
    let sum = 1;
    for (let index = 1; index < degreesOfFreedom / 2; index++) {
      term *= half / index;
      sum += term;
    }
    return Math.exp(-half) * sum;
  }
  return 1 - jStat.chisquare.cdf(statistic, degreesOfFreedom);
}

function kruskalWallis(groups: number[][]) {
  const { ranked, tieSum } = assignRanks(groups);
  const total = ranked.length;
  const rankSums = groups.map((_, index) =>
    ranked.filter(value => value.group === index).reduce((sum, value) => sum + value.rank, 0),
  );
  const uncorrected = 12 / (total * (total + 1)) *
    rankSums.reduce((sum, rankSum, index) => sum + rankSum ** 2 / groups[index].length, 0) -
    3 * (total + 1);
  const tieCorrection = 1 - tieSum / (total ** 3 - total);
  const statistic = tieCorrection > 0 ? uncorrected / tieCorrection : 0;
  return {
    statistic,
    degreesOfFreedom: groups.length - 1,
    tieCorrection,
    p: chiSquareSurvival(statistic, groups.length - 1),
    ranked,
    tieSum,
  };
}

function dunn(groups: number[][], ranked: Ranked[], tieSum: number) {
  const total = ranked.length;
  const meanRanks = groups.map((_, index) => {
    const values = ranked.filter(value => value.group === index);
    return values.reduce((sum, value) => sum + value.rank, 0) / values.length;
  });
  const rankVariance = total * (total + 1) / 12 - tieSum / (12 * (total - 1));
  const pairs: Array<{ first: number; second: number; z: number; p: number }> = [];
  for (let first = 0; first < groups.length; first++) {
    for (let second = first + 1; second < groups.length; second++) {
      const standardError = Math.sqrt(rankVariance * (1 / groups[first].length + 1 / groups[second].length));
      const z = standardError === 0 ? 0 : (meanRanks[first] - meanRanks[second]) / standardError;
      const p = standardError === 0 ? 1 : 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
      pairs.push({ first, second, z, p });
    }
  }
  return pairs;
}

function cliffsDelta(first: number[], second: number[]): number {
  let greater = 0;
  let less = 0;
  for (const left of first) {
    for (const right of second) {
      if (left > right) greater++;
      else if (left < right) less++;
    }
  }
  return (greater - less) / (first.length * second.length);
}

function random(seedText: string): () => number {
  let state = createHash('sha256').update(seedText).digest().readUInt32LE(0);
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4_294_967_296;
  };
}

function bootstrapDelta(first: number[], second: number[], seed: string) {
  const rng = random(seed);
  const estimates: number[] = [];
  for (let iteration = 0; iteration < 5_000; iteration++) {
    const left = Array.from({ length: first.length }, () => first[Math.floor(rng() * first.length)]);
    const right = Array.from({ length: second.length }, () => second[Math.floor(rng() * second.length)]);
    estimates.push(cliffsDelta(left, right));
  }
  estimates.sort((a, b) => a - b);
  return {
    lower: ss.quantileSorted(estimates, 0.025),
    upper: ss.quantileSorted(estimates, 0.975),
  };
}

function round(value: number, digits = 6): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function formatProbability(value: number): string {
  return value < 1e-6 ? value.toExponential(6) : String(round(value, 12));
}

function magnitude(delta: number): string {
  const absolute = Math.abs(delta);
  return absolute < 0.147 ? 'negligible' : absolute < 0.33 ? 'small' : absolute < 0.474 ? 'medium' : 'large';
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < matrix.length; column++) {
    let pivot = column;
    for (let row = column + 1; row < matrix.length; row++) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    if (Math.abs(augmented[column][column]) < 1e-12) throw new Error('Singular regression design matrix');
    const divisor = augmented[column][column];
    for (let index = column; index <= matrix.length; index++) augmented[column][index] /= divisor;
    for (let row = 0; row < matrix.length; row++) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index <= matrix.length; index++) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }
  return augmented.map(row => row[matrix.length]);
}

function fitLeastSquares(design: number[][], outcome: number[]): number[] {
  const columns = design[0].length;
  const crossProduct = Array.from({ length: columns }, (_, row) =>
    Array.from({ length: columns }, (_, column) =>
      design.reduce((sum, values) => sum + values[row] * values[column], 0),
    ),
  );
  const projected = Array.from({ length: columns }, (_, column) =>
    design.reduce((sum, values, index) => sum + values[column] * outcome[index], 0),
  );
  return solveLinearSystem(crossProduct, projected);
}

function regressionSummary(
  x: number[],
  y: number[],
  features: (value: number) => number[],
): { r2: number; adjustedR2: number; loocvRmse: number; coefficients: number[] } {
  const design = x.map(features);
  const coefficients = fitLeastSquares(design, y);
  const predict = (row: number[]) => row.reduce((sum, value, index) => sum + value * coefficients[index], 0);
  const fitted = design.map(predict);
  const mean = ss.mean(y);
  const totalSquares = y.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  const residualSquares = y.reduce((sum, value, index) => sum + (value - fitted[index]) ** 2, 0);
  const r2 = totalSquares === 0 ? 1 : 1 - residualSquares / totalSquares;
  const predictors = design[0].length - 1;
  const adjustedR2 = 1 - (1 - r2) * (y.length - 1) / (y.length - predictors - 1);
  const heldOutErrors = x.map((value, heldOut) => {
    const trainingX = x.filter((_, index) => index !== heldOut);
    const trainingY = y.filter((_, index) => index !== heldOut);
    const trained = fitLeastSquares(trainingX.map(features), trainingY);
    const prediction = features(value).reduce((sum, feature, index) => sum + feature * trained[index], 0);
    return (y[heldOut] - prediction) ** 2;
  });
  return {
    r2,
    adjustedR2,
    loocvRmse: Math.sqrt(ss.mean(heldOutErrors)),
    coefficients,
  };
}

const rawRows = loadRows();
const units = analysisUnits(rawRows);
const inferentialTestUnits = units.filter(row => !['M5', 'M6', 'M7', 'M8', 'M9'].includes(row.metric));
const analyses = groupBy(units, row => `${row.tier}|${row.metric}|${row.size}`);

const rawDescriptive = ['tier,metric,size,tool,n,mean,median,std,iqr,min,max'];
for (const [key, values] of groupBy(rawRows, row => `${row.tier}|${row.metric}|${row.size}|${row.tool}`)) {
  const [tier, metric, size, tool] = key.split('|');
  const data = values.map(value => value.value);
  rawDescriptive.push([
    tier, metric, size, tool, data.length, round(ss.mean(data)), round(ss.median(data)),
    round(data.length > 1 ? ss.sampleStandardDeviation(data) : 0),
    round(data.length > 1 ? ss.interquartileRange(data) : 0), Math.min(...data), Math.max(...data),
  ].join(','));
}
fs.writeFileSync(path.join(outputDir, 'raw_descriptive_stats.csv'), `${rawDescriptive.join('\n')}\n`);

const descriptive = ['tier,metric,size,tool,unit_of_analysis,n,mean,median,std,iqr,min,max'];
for (const [key, values] of groupBy(units, row => `${row.tier}|${row.metric}|${row.size}|${row.tool}`)) {
  const [tier, metric, size, tool] = key.split('|');
  const data = values.map(value => value.value);
  const unit = metric === 'M3' || metric === 'M4'
    ? 'session_median'
    : ['M5', 'M6', 'M8'].includes(metric)
      ? 'five_build_aggregate'
      : metric === 'M7'
        ? 'fixture_aggregate'
        : metric === 'M9'
          ? 'sourcemap_probe'
      : 'independent_build';
  descriptive.push([
    tier, metric, size, tool, unit, data.length, round(ss.mean(data)), round(ss.median(data)),
    round(data.length > 1 ? ss.sampleStandardDeviation(data) : 0),
    round(data.length > 1 ? ss.interquartileRange(data) : 0), Math.min(...data), Math.max(...data),
  ].join(','));
}
fs.writeFileSync(path.join(outputDir, 'descriptive_stats.csv'), `${descriptive.join('\n')}\n`);

const omnibus = ['tier,metric,size,groups,total_n,H,df,tie_correction,p_value,significant'];
const pairwise = ['tier,metric,size,tool_1,tool_2,z,p_raw,p_bonferroni,significant'];
const effects = ['tier,metric,size,tool_1,tool_2,cliffs_delta,ci_95_low,ci_95_high,magnitude'];
for (const [key, values] of analyses) {
  const metric = key.split('|')[1];
  if (['M5', 'M6', 'M7', 'M8', 'M9'].includes(metric)) continue;
  const byTool = groupBy(values, value => value.tool);
  const names = [...byTool.keys()].sort();
  const groups = names.map(name => byTool.get(name)!.map(value => value.value));
  if (groups.length < 2 || groups.some(group => group.length < 2)) continue;
  const result = kruskalWallis(groups);
  omnibus.push([
    ...key.split('|'), groups.length, groups.flat().length, round(result.statistic), result.degreesOfFreedom,
    round(result.tieCorrection), formatProbability(result.p), result.p < 0.05 ? 'Yes' : 'No',
  ].join(','));
  const comparisons = dunn(groups, result.ranked, result.tieSum);
  for (const comparison of comparisons) {
    const adjusted = Math.min(1, comparison.p * comparisons.length);
    pairwise.push([
      ...key.split('|'), names[comparison.first], names[comparison.second], round(comparison.z),
      formatProbability(comparison.p), formatProbability(adjusted), adjusted < 0.05 ? 'Yes' : 'No',
    ].join(','));
    const delta = cliffsDelta(groups[comparison.first], groups[comparison.second]);
    const interval = bootstrapDelta(
      groups[comparison.first],
      groups[comparison.second],
      `${key}|${names[comparison.first]}|${names[comparison.second]}`,
    );
    effects.push([
      ...key.split('|'), names[comparison.first], names[comparison.second], round(delta),
      round(interval.lower), round(interval.upper), magnitude(delta),
    ].join(','));
  }
}
fs.writeFileSync(path.join(outputDir, 'kruskal_wallis_tie_corrected.csv'), `${omnibus.join('\n')}\n`);
fs.writeFileSync(path.join(outputDir, 'dunn_pairwise_bonferroni.csv'), `${pairwise.join('\n')}\n`);
fs.writeFileSync(path.join(outputDir, 'cliffs_delta_bootstrap.csv'), `${effects.join('\n')}\n`);

const sensitivity = ['tier,metric,size,tool,median_all,median_excluding_first,n_all,n_excluding_first,rank_all,rank_excluding_first'];
for (const [analysisKey, values] of groupBy(rawRows, row => `${row.tier}|${row.metric}|${row.size}`)) {
  const [tier, metric, size] = analysisKey.split('|');
  const byTool = groupBy(values, value => value.tool);
  const summaries = [...byTool.entries()].map(([tool, toolRows]) => {
    let allValues: number[];
    let keptValues: number[];
    if (metric === 'M3' || metric === 'M4') {
      const sessions = [...groupBy(toolRows, row => String(row.session)).values()];
      allValues = sessions.map(sessionRows => ss.median(sessionRows.map(row => row.value)));
      keptValues = sessions.map(sessionRows =>
        ss.median([...sessionRows].sort((a, b) => a.run - b.run).slice(1).map(row => row.value)),
      );
    } else {
      allValues = toolRows.map(row => row.value);
      keptValues = toolRows.filter(row => row.run !== 1).map(row => row.value);
    }
    return {
      tool,
      all: ss.median(allValues),
      withoutFirst: keptValues.length ? ss.median(keptValues) : NaN,
      nAll: allValues.length,
      nWithoutFirst: keptValues.length,
    };
  });
  if (summaries.some(summary => !Number.isFinite(summary.withoutFirst))) continue;
  const rankAll = [...summaries].sort((a, b) => a.all - b.all).map(summary => summary.tool);
  const rankWithout = [...summaries].sort((a, b) => a.withoutFirst - b.withoutFirst).map(summary => summary.tool);
  for (const summary of summaries) {
    sensitivity.push([
      tier, metric, size, summary.tool, round(summary.all), round(summary.withoutFirst),
      summary.nAll, summary.nWithoutFirst, rankAll.indexOf(summary.tool) + 1, rankWithout.indexOf(summary.tool) + 1,
    ].join(','));
  }
}
fs.writeFileSync(path.join(outputDir, 'first_observation_sensitivity.csv'), `${sensitivity.join('\n')}\n`);

const sizeModules: Record<string, number> = {
  'xs-50': 50,
  's-200': 200,
  'm-500': 500,
  'l-2000': 2_000,
  'xl-5000': 5_000,
};
const scaling = [
  'tier,tool,n_sizes,r2_linear,adjusted_r2_linear,loocv_rmse_linear,r2_log_linear,adjusted_r2_log_linear,loocv_rmse_log_linear,r2_quadratic,adjusted_r2_quadratic,loocv_rmse_quadratic,selected_by_loocv,linear_ms_per_1000_modules',
];
const tier1M2 = rawRows.filter(row => row.tier === 'tier1' && row.metric === 'M2');
for (const [tool, toolRows] of [...groupBy(tier1M2, row => row.tool)].sort(([left], [right]) => left.localeCompare(right))) {
  const points = [...groupBy(toolRows, row => row.size)]
    .map(([size, values]) => ({ size, modules: sizeModules[size], median: ss.median(values.map(row => row.value)) }))
    .filter(point => Number.isFinite(point.modules))
    .sort((left, right) => left.modules - right.modules);
  if (points.length !== 5) throw new Error(`M12 requires all five Tier-1 M2 sizes for ${tool}; found ${points.length}`);
  const x = points.map(point => point.modules / 1_000);
  const y = points.map(point => point.median);
  const linear = regressionSummary(x, y, value => [1, value]);
  const logLinear = regressionSummary(x, y, value => [1, Math.log(value)]);
  const quadratic = regressionSummary(x, y, value => [1, value, value ** 2]);
  const candidates = [
    { name: 'linear', error: linear.loocvRmse },
    { name: 'log-linear', error: logLinear.loocvRmse },
    { name: 'quadratic', error: quadratic.loocvRmse },
  ];
  const selected = candidates.sort((left, right) => left.error - right.error)[0].name;
  scaling.push([
    'tier1', tool, points.length,
    round(linear.r2), round(linear.adjustedR2), round(linear.loocvRmse),
    round(logLinear.r2), round(logLinear.adjustedR2), round(logLinear.loocvRmse),
    round(quadratic.r2), round(quadratic.adjustedR2), round(quadratic.loocvRmse),
    selected, round(linear.coefficients[1]),
  ].join(','));
}
fs.writeFileSync(path.join(outputDir, 'scaling_regression.csv'), `${scaling.join('\n')}\n`);

fs.writeFileSync(path.join(outputDir, 'analysis-manifest.json'), `${JSON.stringify({
  batch: path.relative(process.cwd(), batch),
  inputManifestSha256,
  sourceFilesReverified: verifySources,
  generatedAt: new Date().toISOString(),
  rawObservations: rawRows.length,
  analysisUnits: units.length,
  inferentialTestUnits: inferentialTestUnits.length,
  repeatedMeasuresHandling: 'M3 and M4 reduced to one median per independent watch/dev-server session',
  aggregateMetricsHandling: 'M5-M8 retained as one fixture or five-build aggregate per tool/size; M9 retained as one exact probe result; M5-M9 excluded from inferential tests',
  omnibus: 'Kruskal-Wallis with tie correction',
  postHoc: 'Dunn tests using global ranks and tie-adjusted variance; Bonferroni family correction',
  effectSize: 'Cliffs delta with deterministic 5000-replicate percentile bootstrap confidence intervals; positive delta means tool_1 has larger values; intervals are not multiplicity-adjusted',
  scalingRegression: 'Tier-1 M2 size medians fitted with linear, log-linear, and quadratic models; model selected by leave-one-size-out RMSE',
  normalityTesting: 'omitted; nonparametric methods were selected a priori',
}, null, 2)}\n`);

console.log(
  `Validated analysis complete: ${rawRows.length} observations, ${units.length} analysis units, ` +
  `${inferentialTestUnits.length} inferential-test units.`,
);
