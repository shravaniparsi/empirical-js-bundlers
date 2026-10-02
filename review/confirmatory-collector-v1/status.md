# Confirmatory collector readiness

This is infrastructure evidence, not performance data. It is marked `publicationEligible: false` and contains no timing observations from the planned study.

## Campaign state and provenance

`scripts/confirmatory-campaign.mjs` implements the frozen schedule as a fail-closed state machine. It authenticates the protocol, schedule, immutable campaign manifest, evidence files, and every hash-chained ledger event. It refuses skipped blocks, out-of-order tools, reuse of successful cells from an abandoned block, concurrent ledger corruption, and attempts beyond the two-replacement limit. Evidence must reside inside the campaign directory and is rehashed on every audit.

The host gate checks exact Node 24.14.0, arm64 architecture, AC power, free disk, a 60-second load window, memory pressure, and the available macOS thermal interface. This Mac does not expose thermal/performance state through `pmset`; the protocol records that limitation explicitly. A verified Node 24.14.0 arm64 runtime is installed in the local Codex runtime cache. Disposable cache removal raised free disk above the 15 GiB gate.

## Incremental completion boundary

`scripts/incremental-completion-gate.mjs` is a candidate M3 primitive. A measurement can close only after both:

1. the selected tool emits a new success event after the edit; and
2. emitted output contains that edit's unique marker.

The negative controls confirm that a stale pre-edit success, a post-edit success for the wrong output, a failed compilation, an unreadable output, and a timeout cannot produce an accepted completion. Split stdout chunks are also covered.

The complete 25-cell synthetic matrix passed in [GitHub Actions run 36824749919](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36824749919) at commit `23dd28348477db4eb8abd63a8eb191a58f863208`. All five tools passed at all five scales. Each cell performed three edit/revert cycles, required the unique edit marker in emitted JavaScript, rejected completion for stale output, restored the source byte-for-byte, and terminated its process tree. The 25 reports cover 75 accepted correctness edits and contain no harness latency fields.

The five-cell Bulletproof React matrix passed in [run 36826015073](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36826015073) at commit `c814928f65ef1157ec62484de16b8ef86ff36569`. An earlier diagnostic run correctly exposed that Rollup retained orphaned content-hashed chunks. The final gate follows the JavaScript graph referenced by the current `index.html`, so stale unreferenced files cannot satisfy or block marker checks. All five final cells passed three edit/revert cycles.

The 10-cell Memos and Excalidraw matrix passed in [run
36829734054](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36829734054)
at commit `5b52dc84240df365af256cd5b6c5d2bed031ea27`. Together with the
accepted synthetic and Bulletproof React runs, M3 now has passing correctness
evidence for all 40 planned cells and 120 edit/revert cycles. The reports retain
source, runtime, dependency-lock, adapter, process-log, and acceptance evidence
and contain no harness latency fields.

The complete 18-cell M4 matrix also passes on Node 24.14.0. The nine missing
`xs-50`, `m-500`, and Bulletproof React cells passed in [run
36829908004](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36829908004).
The earlier runtime revalidation supplies the three `xl-5000` cells, and the
accepted real-world HMR run supplies the six Memos and Excalidraw cells. Across
54 correctness edits, the browser document and application state were
preserved, intentional reload controls were detected, sources were restored,
and process trees stopped. Details and the nine new reports are under `m4/`.

## Primary-host Actions controller

`.github/workflows/confirmatory-primary-host.yml` provides serialized
`inspect`, `initialize`, `status`, `audit`, production-workspace validation,
and one-block production measurement operations for a dedicated
self-hosted macOS arm64 runner labeled `bundler-primary`. It requires durable
campaign storage outside the Actions checkout, repeats the 60-second frozen
host gate before initialization, and uploads authenticated controller
snapshots. Setup and operating instructions are in
`review/confirmatory-primary-host.md`. The production operation refuses to run
unless M2/M10/M11 is the next frozen block, so the current M1-first schedule
cannot be bypassed.

## Production build executor

`scripts/confirmatory-production-cell.mjs` implements the shared M2/M10/M11
process boundary. A single `/usr/bin/time -l` invocation yields wall time,
peak RSS, and user-plus-system CPU time. The cell is accepted only after exact
runtime and sealed-workspace checks, source restoration, process-group
termination, strict timing parsing, the workload-specific output contract, and
the browser behavior gate all pass. Cache clearing and every correctness check
are outside the timed interval.

The durable workspace seal covers all 40 workload/tool trees and npm's
installed dependency locks. The seal is copied into every cell's evidence.
Local controls reject malformed timing, failed builds, stale completion,
source drift, descendant processes, and failed or invalid correctness reports.
No primary timing observation has been collected.

## Reproduction

Run with the frozen runtime:

```bash
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/test-confirmatory-campaign.mjs
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/incremental-completion-gate.test.mjs
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/audit-confirmatory-protocol.mjs
```

The full-process negative-control suite passed in [run
36830947918](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36830947918)
at commit `1818750bd6a65a4a952b8098f50dde8042523e38`. A valid real child
process and emitted marker were accepted. Stale completion, wrong output,
source drift, a live process group, malformed or ambiguous macOS timing output,
full-page reload, application-state loss, and a failed reload control were each
rejected. The shared finalizer is `scripts/confirmatory-cell-acceptance.mjs`.

The next implementation step is the M1 primary cell executor, followed by the
M3 and M4 session executors. After they pass integration controls, the fixed
macOS arm64 runner
must pass the 60-second environment gate before campaign initialization. The
full campaign then contains 1,740 scheduled processes or sessions; no hosted
correctness result can replace them.
