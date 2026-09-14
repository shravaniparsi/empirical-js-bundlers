#!/usr/bin/env npx tsx
/**
 * analysis.ts — Statistical Analysis Pipeline for JS Bundler Benchmark
 *
 * Implements: descriptive stats, Shapiro-Wilk, Kruskal-Wallis,
 * Mann-Whitney U (Bonferroni), Cliff's delta, scaling regression.
 *
 * Usage:
 *   npx tsx analysis/analysis.ts                    # Full analysis
 *   npx tsx analysis/analysis.ts --tier tier1       # Tier 1 only
 *   npx tsx analysis/analysis.ts --metric M2        # Single metric
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ss from 'simple-statistics';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TIER1_DIR = path.join(ROOT, 'results', 'tier1-raw');
const TIER2_DIR = path.join(ROOT, 'results', 'tier2-raw');
const OUTPUT_DIR = path.join(ROOT, 'results', 'analysis');

const TOOLS = ['vite', 'rspack', 'esbuild', 'webpack', 'rollup'];
const SIZES = ['xs-50', 's-200', 'm-500', 'l-2000', 'xl-5000'];
const SIZE_MODULES: Record<string, number> = {
  'xs-50': 50, 's-200': 200, 'm-500': 500, 'l-2000': 2000, 'xl-5000': 5000,
};

const METRIC_NAMES: Record<string, string> = {
  M1: 'Dev Cold Start', M2: 'Prod Build Time', M3: 'Incremental Rebuild',
  M4: 'HMR Latency', M5: 'Bundle Size (raw)', M6: 'Bundle Size (gzip)',
  M7: 'Tree-Shaking', M8: 'Code Splitting', M9: 'Sourcemap Coverage',
  M10: 'Peak Memory (RSS)', M11: 'CPU Time',
};

interface Row {
  tool: string; size: string; metric: string;
  run: number; value: number; unit: string; timestamp: string;
  modules?: number;
}

// ─── Data Loading ───────────────────────────────────────────

function loadAllCSV(dir: string): Row[] {
  if (!fs.existsSync(dir)) return [];
  const rows: Row[] = [];
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.csv'))) {
    const lines = fs.readFileSync(path.join(dir, file), 'utf-8').trim().split('\n');
    const header = lines[0].split(',');
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',');
      const row: Row = {
        tool: vals[0], size: vals[1], metric: vals[2],
        run: parseInt(vals[3]), value: parseFloat(vals[4]),
        unit: vals[5], timestamp: vals[6],
        modules: SIZE_MODULES[vals[1]] || 0,
      };
      if (!isNaN(row.value)) rows.push(row);
    }
  }
  return rows;
}

function filterData(rows: Row[], metric: string, size?: string, tool?: string): number[] {
  return rows
    .filter(r => r.metric === metric && (size ? r.size === size : true) && (tool ? r.tool === tool : true) && r.value >= 0)
    .map(r => r.value);
}

// ─── Statistical Functions ──────────────────────────────────

function iqr(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return ss.quantile(sorted, 0.75) - ss.quantile(sorted, 0.25);
}

function shapiroWilk(arr: number[]): { W: number; p: number } {
  if (arr.length < 3 || arr.length > 5000) return { W: 0, p: 0 };
  const n = arr.length;
  const sorted = [...arr].sort((a, b) => a - b);
  const mean = ss.mean(sorted);
  const ss_val = sorted.reduce((s, x) => s + (x - mean) ** 2, 0);
  if (ss_val === 0) return { W: 1, p: 1 };

  // Simplified Shapiro-Wilk approximation
  const m = sorted.map((_, i) => ss.probit((i + 1 - 0.375) / (n + 0.25)));
  const mSum = m.reduce((s, v) => s + v * v, 0);
  const a = m.map(v => v / Math.sqrt(mSum));
  const b = a.reduce((s, v, i) => s + v * sorted[i], 0);
  const W = (b * b) / ss_val;

  // Approximate p-value using normal approximation
  const mu = 0.0038915 * Math.log(n) ** 3 - 0.083751 * Math.log(n) ** 2 - 0.31082 * Math.log(n) - 1.5861;
  const sigma = Math.exp(0.0030302 * Math.log(n) ** 2 - 0.082676 * Math.log(n) - 0.4803);
  const z = (Math.log(1 - W) - mu) / sigma;
  const p = 1 - normalCDF(z);

  return { W: Math.round(W * 10000) / 10000, p: Math.max(0, Math.min(1, p)) };
}

function normalCDF(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  return 0.5 * (1.0 + sign * y);
}

function kruskalWallis(groups: number[][]): { H: number; p: number } {
  const allValues: { value: number; group: number }[] = [];
  groups.forEach((g, gi) => g.forEach(v => allValues.push({ value: v, group: gi })));
  allValues.sort((a, b) => a.value - b.value);

  // Assign ranks (average for ties)
  const ranks = new Array(allValues.length);
  let i = 0;
  while (i < allValues.length) {
    let j = i;
    while (j < allValues.length && allValues[j].value === allValues[i].value) j++;
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) ranks[k] = avgRank;
    i = j;
  }

  const N = allValues.length;
  const k = groups.length;
  let H = 0;
  let idx = 0;
  for (let gi = 0; gi < k; gi++) {
    const ni = groups[gi].length;
    let rankSum = 0;
    for (let r = 0; r < ranks.length; r++) {
      if (allValues[r].group === gi) rankSum += ranks[r];
    }
    H += (rankSum * rankSum) / ni;
  }
  H = (12 / (N * (N + 1))) * H - 3 * (N + 1);

  // Chi-squared approximation for p-value
  const df = k - 1;
  const p = 1 - chiSquaredCDF(H, df);
  return { H: Math.round(H * 10000) / 10000, p };
}

function chiSquaredCDF(x: number, k: number): number {
  if (x <= 0) return 0;
  return regularizedGammaP(k / 2, x / 2);
}

function regularizedGammaP(a: number, x: number): number {
  if (x === 0) return 0;
  // Series expansion for incomplete gamma function
  let sum = 0, term = 1 / a;
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-12) break;
  }
  return (1 / a + sum) * Math.exp(-x + a * Math.log(x) - lnGamma(a));
}

function lnGamma(z: number): number {
  const c = [76.18009172947146, -86.50532032941678, 24.01409824083091,
    -1.231739572450155, 0.001208650973866179, -0.000005395239384953];
  let x = z, y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function mannWhitneyU(x: number[], y: number[]): { U: number; p: number } {
  const nx = x.length, ny = y.length;
  let U = 0;
  for (const xi of x) for (const yi of y) {
    if (xi > yi) U++;
    else if (xi === yi) U += 0.5;
  }
  const mu = (nx * ny) / 2;
  const sigma = Math.sqrt((nx * ny * (nx + ny + 1)) / 12);
  const z = Math.abs((U - mu) / sigma);
  const p = 2 * (1 - normalCDF(z));
  return { U: Math.round(U * 100) / 100, p };
}

function cliffsDelta(x: number[], y: number[]): { delta: number; magnitude: string } {
  const nx = x.length, ny = y.length;
  if (nx === 0 || ny === 0) return { delta: 0, magnitude: 'negligible' };
  let more = 0, less = 0;
  for (const xi of x) for (const yi of y) {
    if (xi > yi) more++;
    else if (xi < yi) less++;
  }
  const delta = (more - less) / (nx * ny);
  const abs = Math.abs(delta);
  const magnitude = abs < 0.147 ? 'negligible' : abs < 0.33 ? 'small' : abs < 0.474 ? 'medium' : 'large';
  return { delta: Math.round(delta * 10000) / 10000, magnitude };
}

// ─── Analysis Pipeline ──────────────────────────────────────

function runAnalysis(data: Row[], metricFilter?: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const metrics = metricFilter
    ? [metricFilter]
    : [...new Set(data.map(r => r.metric))].sort();

  console.log('═'.repeat(60));
  console.log('  JS Bundler Benchmark — Statistical Analysis');
  const actualSizes = [...new Set(data.map(r => r.size))];
  const actualTools = [...new Set(data.map(r => r.tool))];

  console.log('═'.repeat(60));
  console.log(`\n📂 Loaded ${data.length} data points from ${metrics.length} metrics`);
  console.log(`  Tools: ${actualTools.sort().join(', ')}`);
  console.log(`  Sizes: ${actualSizes.join(', ')}`);

  // ── 1. Descriptive Statistics ──
  console.log('\n📊 Descriptive Statistics...');
  const descRows: string[] = ['metric,tool,size,n,mean,median,std,iqr,min,max,cv'];
  for (const m of metrics) {
    for (const size of actualSizes) {
      for (const tool of actualTools) {
        const vals = filterData(data, m, size, tool);
        if (vals.length === 0) continue;
        const mean = ss.mean(vals);
        descRows.push([
          m, tool, size, vals.length,
          Math.round(mean * 100) / 100,
          Math.round(ss.median(vals) * 100) / 100,
          Math.round(ss.standardDeviation(vals) * 100) / 100,
          Math.round(iqr(vals) * 100) / 100,
          Math.round(ss.min(vals) * 100) / 100,
          Math.round(ss.max(vals) * 100) / 100,
          mean > 0 ? Math.round(ss.standardDeviation(vals) / mean * 10000) / 100 : 0,
        ].join(','));
      }
    }
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'descriptive_stats.csv'), descRows.join('\n') + '\n');
  console.log(`  → ${descRows.length - 1} rows → descriptive_stats.csv`);

  // ── 2. Normality Tests ──
  console.log('\n🔔 Shapiro-Wilk Normality Tests...');
  const normRows: string[] = ['metric,size,tool,W,p_value,normal'];
  let nonNormal = 0, totalNorm = 0;
  for (const m of metrics) {
    for (const size of actualSizes) {
      for (const tool of actualTools) {
        const vals = filterData(data, m, size, tool);
        if (vals.length < 3) continue;
        const { W, p } = shapiroWilk(vals);
        const normal = p > 0.05 ? 'Yes' : 'No';
        if (normal === 'No') nonNormal++;
        totalNorm++;
        normRows.push([m, size, tool, W, Math.round(p * 10000) / 10000, normal].join(','));
      }
    }
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'normality_tests.csv'), normRows.join('\n') + '\n');
  console.log(`  → ${nonNormal}/${totalNorm} groups non-normal → Kruskal-Wallis appropriate`);

  // ── 3. Kruskal-Wallis Omnibus ──
  console.log('\n📈 Kruskal-Wallis Omnibus Tests...');
  const kwRows: string[] = ['metric,size,H,p_value,significant'];
  let sigKW = 0, totalKW = 0;
  for (const m of metrics) {
    for (const size of actualSizes) {
      const groups = actualTools.map(t => filterData(data, m, size, t)).filter(g => g.length >= 2);
      if (groups.length < 2) continue;
      const { H, p } = kruskalWallis(groups);
      const sig = p < 0.05 ? 'Yes' : 'No';
      if (sig === 'Yes') sigKW++;
      totalKW++;
      kwRows.push([m, size, H, Math.round(p * 1000000) / 1000000, sig].join(','));
    }
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'kruskal_wallis.csv'), kwRows.join('\n') + '\n');
  console.log(`  → ${sigKW}/${totalKW} tests show significant differences (p < 0.05)`);

  // ── 4. Pairwise Tests (Mann-Whitney U, Bonferroni) ──
  console.log('\n🔍 Pairwise Tests (Bonferroni)...');
  const pairRows: string[] = ['metric,size,tool_1,tool_2,U,p_raw,p_bonferroni,significant'];
  let sigPairs = 0, totalPairs = 0;
  for (const m of metrics) {
    for (const size of actualSizes) {
      const toolData: Record<string, number[]> = {};
      for (const t of actualTools) {
        const vals = filterData(data, m, size, t);
        if (vals.length >= 2) toolData[t] = vals;
      }
      const toolNames = Object.keys(toolData);
      const nPairs = toolNames.length * (toolNames.length - 1) / 2;
      for (let i = 0; i < toolNames.length; i++) {
        for (let j = i + 1; j < toolNames.length; j++) {
          const { U, p } = mannWhitneyU(toolData[toolNames[i]], toolData[toolNames[j]]);
          const pBonf = Math.min(p * nPairs, 1);
          const sig = pBonf < 0.05 ? 'Yes' : 'No';
          if (sig === 'Yes') sigPairs++;
          totalPairs++;
          pairRows.push([m, size, toolNames[i], toolNames[j], U,
            Math.round(p * 1000000) / 1000000, Math.round(pBonf * 1000000) / 1000000, sig].join(','));
        }
      }
    }
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'pairwise_tests.csv'), pairRows.join('\n') + '\n');
  console.log(`  → ${sigPairs}/${totalPairs} pairs significantly different`);

  // ── 5. Effect Sizes (Cliff's Delta) ──
  console.log('\n📐 Cliff\'s Delta Effect Sizes...');
  const effRows: string[] = ['metric,size,tool_1,tool_2,cliffs_delta,magnitude'];
  let largeFx = 0, totalFx = 0;
  for (const m of metrics) {
    for (const size of actualSizes) {
      const toolData: Record<string, number[]> = {};
      for (const t of actualTools) {
        const vals = filterData(data, m, size, t);
        if (vals.length >= 2) toolData[t] = vals;
      }
      const toolNames = Object.keys(toolData);
      for (let i = 0; i < toolNames.length; i++) {
        for (let j = i + 1; j < toolNames.length; j++) {
          const { delta, magnitude } = cliffsDelta(toolData[toolNames[i]], toolData[toolNames[j]]);
          if (magnitude === 'large') largeFx++;
          totalFx++;
          effRows.push([m, size, toolNames[i], toolNames[j], delta, magnitude].join(','));
        }
      }
    }
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'effect_sizes.csv'), effRows.join('\n') + '\n');
  console.log(`  → ${largeFx}/${totalFx} pairs have LARGE effect size`);

  // ── 6. Scaling Regression (M2) ──
  console.log('\n📉 Scaling Regression (M2)...');
  const regRows: string[] = ['tool,r2_linear,r2_log_linear,best_fit,slope_per_1000_modules'];
  const m2Data = data.filter(r => r.metric === 'M2' && r.value >= 0);
  for (const tool of actualTools) {
    const toolM2 = m2Data.filter(r => r.tool === tool);
    const sizeMedians: { modules: number; median: number }[] = [];
    for (const size of actualSizes) {
      if (!SIZE_MODULES[size]) continue;
      const vals = toolM2.filter(r => r.size === size).map(r => r.value);
      if (vals.length > 0) {
        sizeMedians.push({ modules: SIZE_MODULES[size], median: ss.median(vals) });
      }
    }
    if (sizeMedians.length < 3) continue;

    const x = sizeMedians.map(s => s.modules);
    const y = sizeMedians.map(s => s.median);

    // Linear regression
    const linReg = ss.linearRegression(x.map((xi, i) => [xi, y[i]]));
    const linLine = ss.linearRegressionLine(linReg);
    const r2Lin = ss.rSquared(x.map((xi, i) => [xi, y[i]]), linLine);

    // Log-linear regression
    const logX = x.map(xi => Math.log(xi));
    const logReg = ss.linearRegression(logX.map((xi, i) => [xi, y[i]]));
    const logLine = ss.linearRegressionLine(logReg);
    const r2Log = ss.rSquared(logX.map((xi, i) => [xi, y[i]]), logLine);

    const bestFit = r2Lin >= r2Log ? 'linear' : 'log-linear';
    const slopePer1000 = Math.round(linReg.m * 1000 * 10) / 10;
    regRows.push([tool, Math.round(r2Lin * 10000) / 10000, Math.round(r2Log * 10000) / 10000, bestFit, slopePer1000].join(','));
    console.log(`  ${tool}: best=${bestFit}, R²=${Math.max(r2Lin, r2Log).toFixed(4)}, +${slopePer1000}ms per 1000 modules`);
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'scaling_regression.csv'), regRows.join('\n') + '\n');

  // ── 7. Quick Rankings Summary ──
  console.log('\n📋 TOOL RANKINGS (by median, lower = better for timing metrics)');
  console.log('-'.repeat(50));
  for (const m of ['M2', 'M10', 'M11']) {
    if (!metrics.includes(m)) continue;
    console.log(`\n  ${m} (${METRIC_NAMES[m]}):`);
    for (const size of actualSizes) {
      const medians = actualTools.map(t => {
        const vals = filterData(data, m, size, t);
        return { tool: t, median: vals.length > 0 ? ss.median(vals) : Infinity, n: vals.length };
      }).filter(r => r.n > 0).sort((a, b) => a.median - b.median);
      if (medians.length === 0) continue;
      const ranking = medians.map((r, i) => `${i + 1}. ${r.tool} (${Math.round(r.median)})`).join('  ');
      console.log(`    ${size}: ${ranking}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  ✅ Analysis complete! Output: ${OUTPUT_DIR}`);
  console.log('═'.repeat(60));
}

// ─── Main ───────────────────────────────────────────────────

const args = process.argv.slice(2);
let tier = 'all';
let metricFilter: string | undefined;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tier') tier = args[++i];
  if (args[i] === '--metric') metricFilter = args[++i];
}

let data: Row[] = [];
if (tier === 'all' || tier === 'tier1') data.push(...loadAllCSV(TIER1_DIR));
if (tier === 'all' || tier === 'tier2') data.push(...loadAllCSV(TIER2_DIR));

if (data.length === 0) {
  console.log('❌ No data found! Run benchmarks first.');
  process.exit(1);
}

runAnalysis(data, metricFilter);
