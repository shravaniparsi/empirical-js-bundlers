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

The remaining M3 gate is the 10-cell matrix for Memos and Excalidraw.

## Reproduction

Run with the frozen runtime:

```bash
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/test-confirmatory-campaign.mjs
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/incremental-completion-gate.test.mjs
/Users/shravaniparsi/.cache/codex-runtimes/node-v24.14.0-darwin-arm64/bin/node scripts/audit-confirmatory-protocol.mjs
```

The next collector gate is the correctness-only 10-cell Memos and Excalidraw M3 matrix. It must not emit or retain comparative timing values.
