# Confirmatory analysis plan

## Questions and hypotheses

For M1--M4, the question is whether the eligible toolchain changes user-observable development or build latency for a fixed workload on the declared GitHub-hosted `macos-14` Apple M1 environment family. For M10 and M11, it is whether the toolchain changes peak RSS or CPU demand during the same accepted production build.

For each metric, workload, and eligible non-reference tool, the confirmatory null hypothesis is that the paired log outcome has zero location shift relative to Webpack. The two-sided alternative is a nonzero shift. These hypotheses concern the complete configured toolchain; they do not isolate implementation language or bundler core.

## Analysis units

- M1, M2, M10, and M11: one fresh process in one randomized block.
- M3: the median of five measured updates in one independently restarted watch session.
- M4: the median of five measured state-preserving updates in one independently restarted browser/server session.

One fresh GitHub-hosted virtual machine executes one entire randomized block. Every tool in that block runs serially in the frozen order. Independent block jobs may run concurrently because they do not share a virtual machine. The paired comparison therefore controls VM-level variation within a block; virtual machines are never treated as interchangeable unblocked replicates.

The untimed first M3/M4 edit stabilizes the session and is never eligible for later reclassification as a measured observation. Raw update values remain available for distribution and sensitivity plots.

## Primary estimation and testing

Within every complete block, calculate `log(non-reference) - log(Webpack)`. Estimate the paired location shift with the Hodges--Lehmann estimator and exponentiate it. A ratio below 1 favors the non-reference tool for latency, memory, or CPU demand; a ratio above 1 favors Webpack.

Use a two-sided paired Wilcoxon signed-rank test. Apply Holm's step-down adjustment jointly to all planned tool-by-workload contrasts within each of the six metric families: M1, M2, M3, M4, M10, and M11. Do not split a family by synthetic/real-world status or by project size after seeing results.

Construct a 95% interval by resampling complete block IDs with replacement 10,000 times and recomputing the paired estimator. Use a deterministic seed derived from the protocol ID, metric, and workload. If a resample cannot estimate an effect because all paired differences are identical, retain the valid deterministic estimate and disclose the degeneracy.

## Descriptive and secondary analysis

Report medians, IQRs, empirical cumulative distributions, and all raw values. Report failure and replacement rates by tool and workload. M5--M9 use the output-contract evidence from accepted M2 complete blocks 1, 10, and 20; they require no extra build and receive no significance tests. M12 fits `log(M2) = intercept + slope * log(module count)` for each tool over the five synthetic sizes. Its bootstrap independently resamples complete blocks within each size before refitting because a block number does not identify the same VM across sizes. It is a descriptive within-range scaling model and not an extrapolation claim.

All pairwise tool contrasts, alternative estimators, first-observation sensitivity, application-specific subgroup discussion, and comparisons with consolidated-v4 are exploratory. They cannot replace a failed primary result or alter the frozen family correction.

Runner image version is recorded for every block. Report block counts and descriptive outcomes by `ImageVersion`, and repeat primary effect estimation within each image-version stratum that has at least five complete blocks for the applicable workload. This sensitivity analysis can qualify generalizability but cannot change the prespecified pooled-within-environment primary decision rule.

## Missing data and protocol deviations

Primary analysis uses complete randomized blocks. A technical failure causes retention of the failed job artifact and replacement of the entire block on a newly allocated virtual machine, as specified in `protocol.json`; successful tools from that incomplete attempt cannot be combined with later replacements. There is no numerical imputation and no outlier trimming.

Every deviation receives an immutable ID, timestamp, affected cell, evidence paths, decision, and signer before collection resumes. A deviation that changes measurement or inference creates a new protocol version. Operational corrections that do not change either still remain in the audit trail.

## Claim boundaries

Results are conditional on the frozen versions, configurations, workloads, and GitHub-hosted `macos-14` Apple M1 environment during the collection window. They do not estimate performance on a consumer Mac or a fixed physical host. Real-world diversity supports transfer beyond the synthetic generator but does not establish universal bundler rankings. CPU seconds are a CPU-demand proxy, not direct energy consumption. HMR claims cover only accepted native HMR workflows and the frozen edit scenarios.
