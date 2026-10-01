# Confirmatory protocol v1

This directory freezes the study design before any new performance value is collected. The protocol is intentionally marked `publicationEligible: false`: a frozen plan is a prerequisite for publication evidence, not evidence itself.

## Confirmatory scope

The primary study compares each eligible tool with Webpack within position-balanced randomized complete blocks on one fixed physical host. It covers five synthetic sizes and three independent real-world applications. Vite, Rspack, esbuild, Webpack, and Rollup enter production and watch-build comparisons. Vite, Rspack, and Webpack enter native development-server and HMR comparisons.

The six primary outcome families are M1, M2, M3, M4, M10, and M11. M2, M10, and M11 come from the same process invocation but remain separate multiplicity families. M5--M9 are descriptive output-quality outcomes. M12 uses a prespecified power-law model instead of selecting the best-looking curve after seeing five scale points.

| Collection | Workloads | Tools | Blocks | Independent units | Within-session observations |
|---|---:|---:|---:|---:|---:|
| M1 | 6 | 3 | 20 | 360 processes | none |
| M2/M10/M11 | 8 | 5 | 20 | 800 processes | none |
| M3 | 8 | 5 | 10 | 400 sessions | 1 untimed + 5 measured |
| M4 | 6 | 3 | 10 | 180 sessions | 1 untimed + 5 measured |
| **Total** |  |  |  | **1,740 processes/sessions** | **2,900 measured edits** |

M3 and M4 edits within one session are dependent. Their median is one analysis unit; individual edits must never be presented as independent replicates.

## Required gates before collection

1. Audit the frozen Node 24.14.0 runtime, source hashes, dependency locks, and effective configurations.
2. Pass production output acceptance for every tool and workload in the planned matrix.
3. Pass incremental completion-marker correctness for every M3 cell.
4. Pass browser-observed, state-preserving HMR correctness for every M4 cell, including Bulletproof React on the frozen runtime.
5. Validate collectors with deliberately failing controls: stale completion, full reload, state loss, source drift, orphan process, and malformed timing output.
6. Record the physical host fingerprint and pre-block load/free-disk/power gates.
7. Commit the generated schedule and protocol hashes. No timing value may be inspected before these gates pass.

GitHub-hosted runners can repeat correctness checks, but their results cannot enter the primary performance corpus. A second fixed host is useful as a separately reported replication campaign and must have its own host identifier and complete blocks.

## Execution rules

Run cells strictly in `schedule.json` order, one at a time. A block is complete only when every scheduled tool has a valid observation. Cache removal is limited to declared tool caches and generated outputs; operating-system page cache is uncontrolled and disclosed. Each M3/M4 session receives one untimed stabilization edit followed by five measured edits. Every edit target is predetermined, hash-checked, and restored byte-for-byte.

Failures are evidence. Retain their logs and metadata. A permitted technical failure invalidates that entire incomplete block for primary inference and creates a replacement attempt with a new ID. Two failed replacements pause the affected metric/workload and require a versioned protocol decision. Slow or inconvenient values are never outliers to remove.

## Analysis rules

The primary comparison is paired within block: each non-reference tool versus Webpack for the same metric and workload. Tests are two-sided paired Wilcoxon signed-rank tests. Effects are Hodges--Lehmann shifts on log outcomes, exponentiated to ratios. Confidence intervals use 10,000 paired-block bootstrap resamples. Holm correction covers all confirmatory contrasts in each metric family.

The report will include every raw value, randomized order, technical failure, replacement, median, IQR, effect ratio, confidence interval, raw p value, and adjusted p value. A primary difference claim needs both an adjusted p value below 0.05 and a confidence interval excluding 1. All-pairs rankings and sensitivity analyses are exploratory and labeled as such.

## Change control

Any change to the runtime, dependency graph, workload, effective configuration, collector, readiness/completion definition, sample count, exclusion rule, or analysis method creates `confirmatory-v2` or later. Data from different protocol versions cannot be pooled as one confirmatory campaign. The existing consolidated-v4 corpus remains historical evidence and cannot fill missing v1 cells.

Generate and audit the frozen schedule with:

```bash
npm run protocol:generate
npm run protocol:audit
```
