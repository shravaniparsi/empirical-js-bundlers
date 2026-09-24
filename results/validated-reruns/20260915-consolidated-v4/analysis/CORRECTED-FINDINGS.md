# Consolidated corrected findings

## Analysis basis

- Input: 261 CSV files from five completed validated batches plus nine
  hash-pinned M1 CSVs.
- Raw observations: 1,945.
- Analysis units: 1,390. Of these, 1,265 enter inferential tests; the 125
  M5--M9 aggregates are descriptive only. M3 and M4 use five independent
  session medians per tool/project; individual updates are not treated as
  independent.
- All 30 tie-corrected Kruskal-Wallis tests are significant.
- Kruskal-Wallis p-values use the asymptotic chi-square reference
  distribution. M3/M4 have five session units per tool, so their p-values
  should be interpreted alongside medians and effect estimates rather than
  as high-precision probabilities.
- Dunn tests with within-comparison-family Bonferroni correction are
  significant for 126 of 251 pairs.
- Cliff's delta is large for 250 of 251 pairs. Its bootstrap intervals are
  descriptive and are not multiplicity-adjusted.
- Excluding the first observation from every independent-build series, and
  the first update from every M3/M4 session, changes none of the 136
  within-group tool ranks.

## Corrected findings

### M1: development cold start

In the retained corrected reruns, Rspack completes all 60 starts without a
timeout. Median Rspack starts are 1,144.5 ms at xs-50, 1,826.5 ms at m-500,
and 7,605 ms at xl-5000. Vite is fastest at all three sizes (867.5, 869.5,
and 863 ms), while Webpack is slowest (2,485, 4,513, and 18,924.5 ms). All
nine pairwise comparisons are Bonferroni-significant and have large Cliff's
delta.

The defensible interpretation is that Vite's measured startup is nearly
scale-invariant under this lazy development-server workload; Rspack scales
with project size but remains substantially faster than Webpack. The earlier
timeout-based "prohibitively slow" interpretation is contradicted by the
corrected reruns. Unlike M2--M11, M1 is included as hash-pinned supplemental
CSV data collected in an earlier campaign epoch and does not have a
validated-batch manifest; this provenance limitation must remain explicit.

### M2: production build time

esbuild has the lowest median from xs-50 through l-2000 (320, 465, 860, and
2,705 ms). At xl-5000, Vite has the lowest median (5,560 ms), followed by
Rspack (14,585 ms), esbuild (17,790 ms), Rollup (112,105 ms), and Webpack
(121,520 ms). The Vite--esbuild xl-5000 Dunn comparison narrowly misses the
Bonferroni threshold (adjusted p = 0.0663) despite a large delta, so the
median ordering should not be overstated as a confirmed pairwise difference.

On Bulletproof React, the medians are esbuild 500 ms, Rspack 1,920 ms, Vite
1,980 ms, Rollup 4,215 ms, and Webpack 6,515 ms. Rspack and Vite are
practically close here (small delta; adjusted p = 1).

### M3: incremental watch rebuild

All five tools successfully complete all tested scales. Rspack has the
lowest session-median latency at every scale, from 52.5 ms at xs-50 to
351.5 ms at xl-5000. At xl-5000 the descriptive ordering is Rspack
351.5 ms, Webpack 3,818.5 ms, Vite 4,598.5 ms, esbuild 6,755 ms, and Rollup
15,254 ms.

Every M3 omnibus test is significant, but only 15 of 50 Dunn pairs are
Bonferroni-significant because inference uses five independent sessions per
tool. Claims should distinguish strong descriptive separation and large
effect estimates from the more conservative corrected pairwise tests. The
prior "industry-wide watch-mode failure" claim is false.

### M4: browser-observed HMR

Vite has the lowest median at all three synthetic scales and on Bulletproof
React. At xl-5000 the medians are Vite 80.5 ms, Rspack 376.5 ms, and Webpack
4,323.5 ms. Vite differs significantly from Webpack (adjusted p = 0.00122);
Vite and Rspack do not after correction (adjusted p = 0.231).

On Bulletproof React the medians are Vite 102.5 ms, Rspack 124 ms, and
Webpack 231 ms. Only Vite--Webpack is Bonferroni-significant. These results
measure four no-reload updates after one recorded, untimed synchronization
update per independent dev-server session.

### M10 and M11: resources

esbuild uses the least peak RSS and CPU time in every synthetic and
real-world group. At xl-5000, peak RSS medians are esbuild 272.54 MiB, Vite
1,678.97 MiB, Rspack 2,319.86 MiB, Rollup 3,539.29 MiB, and Webpack
6,512.20 MiB. CPU-time medians at the same scale are 9.16, 10.66, 22.23,
149.74, and 168.33 seconds, respectively.

These are measured associations. The data do not isolate implementation
language, garbage-collection strategy, architecture, or configuration as a
causal mechanism.

### M5--M9: output properties

M5, M6, and M8 are five-build aggregates and M7 is a controlled fixture
aggregate; they have one accepted value per tool/project and therefore no
inferential p-values. Rollup synthetic outputs vary byte-for-byte across
clean builds, so their reported M5/M6/M8 values are the predeclared medians;
that nondeterminism remains recorded in provenance.

Tree-shaking elimination is tightly clustered from 89.67% to 90.27%, a
maximum spread of 0.60 percentage points. Exact sentinel sourcemap mapping
passes for all 25 synthetic combinations and four of five Bulletproof React
combinations. Rollup's Bulletproof React mapping fails the exact probe
(0%); this should be reported as the scoped result, not generalized to all
Rollup sourcemaps.

Chunk count is an output-structure measurement, not an ordinal quality score:
fewer chunks are not automatically better.

### M12: scaling

Five Tier-1 M2 size medians were fitted to linear, log-linear, and quadratic
models. Leave-one-size-out RMSE selects linear models for Vite and Rspack,
and quadratic models for esbuild, Rollup, and Webpack. Linear slopes are
927.82, 2,745.70, 3,505.90, 22,005.82, and 23,934.77 ms per 1,000 modules
for Vite, Rspack, esbuild, Rollup, and Webpack, respectively.

With only five size points, model selection is descriptive evidence of
curvature rather than a general scaling law. The prior claim that every tool
scales linearly with R-squared at least 0.97 is unsupported.

## External-validity boundary

Tier-2 does not exactly reproduce Tier-1 rankings. For example, Bulletproof
React M2 places Rspack just ahead of Vite, whereas the smaller synthetic
projects place Vite ahead of Rspack; M11 shows the reverse adjacent swap.
The real-world run provides one scoped replication workload, not proof of
generalizability across applications. Metrics were collected in separate
phase batches under the same recorded host fingerprint and rotated tool
orders; cross-metric differences in collection time and system load remain a
threat to validity.
