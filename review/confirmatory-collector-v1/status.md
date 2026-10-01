# Confirmatory collector readiness

This is infrastructure evidence, not performance data. It is marked `publicationEligible: false` and contains no timing observations from the planned study.

## Campaign state and provenance

`scripts/confirmatory-campaign.mjs` implements the frozen schedule as a fail-closed state machine. It authenticates the protocol, schedule, immutable campaign manifest, evidence files, and every hash-chained ledger event. It refuses skipped blocks, out-of-order tools, reuse of successful cells from an abandoned block, concurrent ledger corruption, and attempts beyond the two-replacement limit. Evidence must reside inside the campaign directory and is rehashed on every audit.

The host gate checks exact Node 24.14.0, arm64 architecture, AC power, free disk, a 60-second load window, memory pressure, and the available macOS thermal interface. This Mac does not expose thermal/performance state through `pmset`; the protocol records that limitation explicitly. A verified Node 24.14.0 arm64 runtime is installed in the local Codex runtime cache. Disposable cache removal raised free disk above the 15 GiB gate.

## Incremental completion boundary

`scripts/incremental-completion-gate.mjs` is a candidate M3 primitive. A measurement can close only after both:

1. the selected tool emits a new success event after the edit; and
2. emitted output contains that edit's unique marker.

The negative controls confirm that a stale pre-edit success, a post-edit success for the wrong output, a failed compilation, an unreadable output, and a timeout cannot produce an accepted completion. Split stdout chunks are also covered. These tests validate the primitive only; every one of the 40 planned tool/workload M3 cells must still demonstrate its actual success/failure messages, output marker, source restoration, and process cleanup before measurement.

## Reproduction

Run with the frozen runtime:

```bash
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/test-confirmatory-campaign.mjs
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/incremental-completion-gate.test.mjs
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/audit-confirmatory-protocol.mjs
```

The next collector gate is a correctness-only M3 matrix over five tools and eight workloads. It must not emit or retain comparative timing values.
