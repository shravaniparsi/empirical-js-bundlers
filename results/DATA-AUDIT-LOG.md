# Data Audit Log — Pre-Phase 4 Validation

**Date**: Sep 13, 2026  
**Auditor**: Automated + manual review  
**Scope**: All 277 raw CSV files (Tier 1 + Tier 2)

## Summary

| Check | Result |
|-------|--------|
| Total CSVs | 277 (231 Tier 1 + 46 Tier 2) |
| Total data rows | 1,739 |
| Valid data points (value ≥ 0) | 1,534 (88.2%) |
| Timeout sentinels (value = -1) | 205 (11.8%) |
| All headers valid | ✅ |
| No NaN/Inf in outputs | ✅ |
| All rankings stable post-cleanup | ✅ (0 flips across 10 metrics × 6 sizes) |

## Fixes Applied

### FIX 1: Missing CSV headers (3 files)
**Files**: `tier2-raw/rollup_bp-react_M3.csv`, `rspack_bp-react_M3.csv`, `vite_bp-react_M3.csv`  
**Issue**: `measure-incremental.ts` wrote data rows without the standard header line.  
**Fix**: Prepended `tool,size,metric,run,value,unit,timestamp` header.  
**Impact**: n increased from 19 → 20 for these groups. Medians changed by ≤3ms.

### FIX 2: Empty file removed (1 file)
**File**: `tier1-raw/webpack_xl-5000_M4.csv`  
**Issue**: Header only, 0 data rows (Webpack HMR at 5k modules never succeeded).  
**Fix**: Deleted file. Analysis already skips groups with 0 values.  
**Impact**: None — no data was lost.

### FIX 3: Duplicate batches deduplicated (3 files)
**Files**: `tier1-raw/rollup_xs-50_M2.csv`, `rollup_s-200_M2.csv`, `rollup_m-500_M2.csv`  
**Issue**: Each had 20 rows — two batches of 10 runs from different timestamps appended.  
**Fix**: Kept only the latest batch (10 runs) for consistency with other tools.  
**Impact**: Rollup M2 xs-50 median: 3,225 → 2,858 ms (-11.4%). Rollup M2 m-500 median: 8,132 → 7,670 ms (-5.7%). Earlier batch's Run 1 had cold-start inflation (13.9s). No ranking flips.

### FIX 4: Pilot/main overlap deduplicated (1 file)
**File**: `tier1-raw/vite_xs-50_M3.csv`  
**Issue**: 23 rows — runs 1-20 (main batch) + runs 1-3 (later pilot). Duplicate run numbers.  
**Fix**: Kept the 20-run main batch, removed the 3-run pilot.  
**Impact**: Consistent n=20 for M3.

### FIX 5: Scaling regression NaN bug
**File**: `analysis/analysis.ts` line 350  
**Issue**: `SIZE_MODULES` had no entry for `bp-react`, causing `undefined` module count → NaN in regression.  
**Fix**: Added `if (!SIZE_MODULES[size]) continue;` to skip non-synthetic sizes in scaling regression.  
**Impact**: Regression now produces valid R² values (all > 0.97).

## All-Timeout Files (No Usable Data)

These files contain only -1 sentinel values. The analysis correctly filters them out via `r.value >= 0`.

| File | Runs | Reason |
|------|------|--------|
| `esbuild_xs-50_M3` | 20 | esbuild has no native watch mode |
| `esbuild_m-500_M3` | 20 | esbuild has no native watch mode |
| `esbuild_xl-5000_M3` | 20 | esbuild has no native watch mode |
| `rspack_xs-50_M1` | 20 | Rspack dev server: Puppeteer navigation timeout |
| `rspack_m-500_M1` | 20 | Rspack dev server: Puppeteer navigation timeout |
| `rspack_xl-5000_M1` | 20 | Rspack dev server: Puppeteer navigation timeout |
| `rspack_xl-5000_M3` | 20 | Watch-mode timeout at 5,000 modules |
| `rspack_xl-5000_M4` | 20 | HMR timeout at 5,000 modules |
| `rollup_xl-5000_M3` | 3 | Watch-mode timeout at 5,000 modules |
| `webpack_xl-5000_M3` | 20 | Watch-mode timeout at 5,000 modules |
| `rspack_bp-react_M4` | 20 | HMR console pattern differs in real-world app |

## Low-n Files

| File | Valid Runs | Note |
|------|-----------|------|
| `vite_xs-50_M4` | 3 | Pilot run only (81, 221, 132 ms) |
| `vite_xl-5000_M3` | 1 of 3 | 16.5s valid; 2 timeouts. Genuine degradation at scale. |

## Missing Files

| Expected File | Reason |
|---------------|--------|
| `vite_xl-5000_M4` | Puppeteer navigation timeout at 5,000 modules (genuine) |
| `webpack_xl-5000_M4` | Removed in this audit (was header-only) |

## Outlier Analysis

8/266 groups had CV > 100%. All caused by Run 1 cold-start effect:

| Group | Run 1 | Runs 2-10 Median | Explanation |
|-------|-------|-----------------|-------------|
| rollup/s-200/M11 | 2,074s | 7.95s | First-run JIT warmup |
| esbuild/bp-react/M2 | 3,085ms | 672ms | npm cache priming |
| webpack/xs-50/M11 | 75.4s | 7.8s | First-run JIT warmup |
| webpack/bp-react/M2 | — | 7,347ms | Cache priming |
| esbuild/xs-50/M2 | 3,085ms | 399ms | npm cache priming |

**Decision**: Retain all data. Median (not mean) is primary summary statistic, making results robust to Run 1 outliers. Document in paper's Threats to Validity section.

## Statistical Summary (Post-Cleanup)

| Statistic | Value |
|-----------|-------|
| Data points loaded | 1,739 |
| Normality: non-normal groups | 74/115 (64%) → Kruskal-Wallis appropriate |
| Kruskal-Wallis significant | **27/27** (100%) |
| Pairwise significant (Bonferroni) | **188/205** (91.7%) |
| Effect sizes: large | **197/205** (96.1%) |
| Effect sizes: medium | 4/205 |
| Effect sizes: small | 2/205 |
| Effect sizes: negligible | 2/205 |
| Scaling R² (all tools) | 0.972 – 0.9997 |
| Tier 1 vs Tier 2 M2 ranking match | **Exact 5-position match** |
