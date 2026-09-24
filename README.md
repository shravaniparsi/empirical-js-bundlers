# Replication Package: Benchmarking JavaScript Bundlers at Scale

Replication data and scripts for the empirical study:

> **Benchmarking JavaScript Bundlers at Scale: A Two-Tier Empirical Study of Vite, Rspack, esbuild, Webpack, and Rollup**
>
> Submitted to the *Journal of Systems and Software* (Elsevier)

## Overview

The authoritative consolidated corpus contains 1,945 raw observations, 1,390 analysis units, and 1,265 inferential-test units across five production-ready JavaScript bundlers, 11 measured metrics, five synthetic scales (50–5,000 modules), and one scoped Bulletproof React replication.

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
│   ├── validated-reruns/
│   │   └── 20260915-consolidated-v4/ # Authoritative 261-CSV corpus
│   │       ├── tier1/
│   │       ├── tier2/
│   │       └── analysis/             # Validated statistics and findings
│   ├── tier1-raw/          # Legacy/supplemental source measurements
│   ├── tier2-raw/          # Legacy Bulletproof React measurements
│   ├── analysis/           # Legacy output; not for publication claims
│   └── machine-env.yaml    # Hardware/software environment
├── analysis/
│   ├── validated-analysis.ts # Authoritative fail-closed analysis
│   ├── analysis.ts           # Legacy pipeline
│   └── analysis.py           # Legacy alternative
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
- **OS:** macOS 26.5.1 (build 25F80)
- **Node.js:** v22.16.0
- **npm:** 10.9.2

## Reproducing the Analysis

```bash
npm install
npx tsx analysis/validated-analysis.ts \
  results/validated-reruns/20260915-consolidated-v4
```

This verifies the consolidated input and source hashes, reduces M3/M4 to
independent session medians, and runs tie-corrected Kruskal–Wallis, Dunn
post-hoc tests with Bonferroni correction, Cliff's delta with bootstrap
intervals, first-observation sensitivity analysis, and M12 scaling models.
Outputs are written under the consolidated batch's `analysis/` directory.
The legacy `analysis.ts` and `analysis.py` pipelines read superseded raw data
and must not be used for publication claims.

## Metrics

| ID | Metric | Unit | Runs |
|----|--------|------|------|
| M1 | Dev cold start | ms | 20 |
| M2 | Production build time | ms | 10 |
| M3 | Incremental rebuild | ms | 5 sessions × 4 updates |
| M4 | HMR latency | ms | 5 sessions × 4 updates |
| M5 | Bundle size (raw) | bytes | 5-build aggregate |
| M6 | Bundle size (gzip) | bytes | 5-build aggregate |
| M7 | Tree-shaking effectiveness | percent | verified fixture aggregate |
| M8 | Code-splitting granularity | count | 5-build aggregate |
| M9 | Sourcemap accuracy | percent | 1 exact probe |
| M10 | Peak memory (RSS) | MiB | 10 |
| M11 | CPU time | s | 10 |
| M12 | Scaling regression | derived | — |

## License

Data and scripts are provided for academic replication purposes.
