# Replication Package: Benchmarking JavaScript Bundlers at Scale

Replication data and scripts for the empirical study:

> **Benchmarking JavaScript Bundlers at Scale: A Two-Tier Empirical Study of Vite, Rspack, esbuild, Webpack, and Rollup**
>
> Submitted to the *Journal of Systems and Software* (Elsevier)

## Overview

This repository contains 1,534 data points collected from benchmarking five production-ready JavaScript bundlers across 11 metrics and five project scales (50–5,000 modules), plus a real-world validation on Bulletproof React (102 components).

| Tool | Version | Language |
|------|---------|----------|
| Vite | 8.3.0 | Rust (Rolldown) |
| Rspack | 2.2.3 | Rust |
| esbuild | 0.28.2 | Go |
| Webpack | 5.110.3 | JS + SWC |
| Rollup | 4.63.1 | JavaScript |

## Repository Structure

```
├── results/
│   ├── tier1-raw/          # Raw CSV measurements (277 files)
│   ├── tier2-raw/          # Bulletproof React measurements
│   ├── analysis/           # Statistical analysis output
│   │   ├── descriptive_stats.csv
│   │   ├── normality_tests.csv
│   │   ├── kruskal_wallis.csv
│   │   ├── pairwise_tests.csv
│   │   ├── effect_sizes.csv
│   │   └── scaling_regression.csv
│   └── machine-env.yaml    # Hardware/software environment
├── analysis/
│   ├── analysis.ts         # Statistical analysis pipeline (TypeScript)
│   └── analysis.py         # Alternative Python analysis
├── scripts/
│   ├── run-all.sh          # Main measurement harness
│   ├── run-single.sh       # Single tool×size measurement
│   ├── measure-hmr.ts      # HMR latency via Puppeteer + CDP
│   ├── measure-incremental.ts  # Watch-mode rebuild timing
│   ├── clear-cache.sh      # Cache clearing between runs
│   └── setup-*.sh          # Workspace setup scripts
├── configs/                # Bundler configurations (one per tool)
│   ├── esbuild/
│   ├── vite/
│   ├── rspack/
│   ├── webpack/
│   └── rollup/
└── tier2-realworld/        # Bulletproof React adaptations
```

## Environment

All measurements were collected on:
- **Hardware:** Apple M2 Pro (12-core, 32 GB RAM)
- **OS:** macOS 16.5
- **Node.js:** v22.16.0
- **npm:** 10.9.2

## Reproducing the Analysis

```bash
npm install
npx tsx analysis/analysis.ts
```

This reads the raw CSVs from `results/tier1-raw/` and `results/tier2-raw/`, runs the full statistical pipeline (Shapiro–Wilk, Kruskal–Wallis, Mann–Whitney U with Bonferroni correction, Cliff's delta), and writes results to `results/analysis/`.

## Metrics

| ID | Metric | Unit | Runs |
|----|--------|------|------|
| M1 | Dev cold start | ms | 20 |
| M2 | Production build time | ms | 10 |
| M3 | Incremental rebuild | ms | 20 |
| M4 | HMR latency | ms | 20 |
| M5 | Bundle size (raw) | bytes | 1 |
| M6 | Bundle size (gzip) | bytes | 1 |
| M7 | Tree-shaking effectiveness | count | 1 |
| M8 | Code-splitting granularity | count | 1 |
| M9 | Sourcemap accuracy | ratio | 1 |
| M10 | Peak memory (RSS) | MB | 10 |
| M11 | CPU time | s | 10 |
| M12 | Scaling regression | derived | — |

## License

Data and scripts are provided for academic replication purposes.
