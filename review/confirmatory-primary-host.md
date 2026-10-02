# Confirmatory primary-host Actions runner

The primary timing campaign may be orchestrated by GitHub Actions, but every
primary block must execute on the same dedicated physical macOS arm64 host.
The workflow `.github/workflows/confirmatory-primary-host.yml` enforces the
runner labels `self-hosted`, `macOS`, `ARM64`, and `bundler-primary`, and its
concurrency group permits only one primary-host job at a time.

This controller is readiness infrastructure. It does not collect benchmark
latencies and every artifact it emits remains `publicationEligible: false`.

## One-time runner configuration

1. Install one GitHub Actions runner on the approved physical host and give it
   the custom label `bundler-primary`. Do not assign that label to another
   machine during the campaign.
2. Run the service from a dedicated, noninteractive account. Disable other
   scheduled workloads and automatic sleep for the duration of a block.
3. Set the repository Actions variable `CONFIRMATORY_CAMPAIGN_DIR` to an
   absolute durable directory on that host, outside the Actions checkout. For
   example: `/Users/benchmark/empirical-js-bundlers-data/confirmatory-v1-primary`.
4. Ensure the runner account can create the parent directory. Do not place the
   campaign under `_work`, `$RUNNER_TEMP`, or the repository checkout because
   Actions cleanup can delete untracked evidence.

## Required operation order

Dispatch **Confirmatory primary-host controller** from the frozen experiment
commit and run these operations in order:

1. `inspect` records the complete host fingerprint and applies the 60-second
   power, disk, load, memory-pressure, thermal-interface, architecture, and
   exact-runtime gate.
2. `initialize` repeats that gate and creates the immutable campaign manifest
   and authenticated append-only ledger. It refuses an existing campaign path.
3. `status` reports the next frozen block without changing campaign state.
4. `audit` rehashes the manifest, ledger chain, and every recorded evidence
   file.

Each dispatch uploads the controller output plus an authenticated metadata
snapshot for independent retention. The durable host directory remains the
authoritative working copy because later measurement jobs must append evidence
to the same ledger.

The primary campaign must not be initialized until every correctness gate and
full-process negative control required by `protocols/confirmatory-v1` passes.

## Durable production workspaces

Set `CONFIRMATORY_WORKSPACE_DIR` to a second absolute directory outside the
Actions checkout. The production executor expects this immutable layout:

```text
<root>/production/<workload>/<tool>/
<root>/development/<workload>/<tool>/
<root>/_sources/memos/
<root>/_sources/excalidraw/
<root>/_support/memos-server
```

Every workload/tool directory must contain its reviewed `package.json`, exact
`package-lock.json`, and installed `node_modules`. Synthetic sizes and
Bulletproof React come from `prepare-production-profile.mjs`; Memos and
Excalidraw come from their pinned adapter preparation scripts. Development
workspaces are separate because the reviewed Rspack and Webpack development
overlays intentionally differ from production configuration. The two source
directories retain the pinned upstream trees used by the browser gates, and
the Memos server is compiled from its pinned source with `go build
-mod=readonly`.

Run the controller's `validate-workspace` operation after preparing
the directory and sealing it once with
`node scripts/confirmatory-workspace-contract.mjs seal <root>`. The operation
recomputes the seal for all 40 production and 18 development cells without collecting a
measurement. Each seal covers the source and configuration tree, package and
lock files, and npm's installed dependency lock. A production cell then
runs `scripts/confirmatory-production-cell.mjs`; only the reviewed build command
is inside `/usr/bin/time -l`. Profile checks, cache deletion, hashes, output
contract validation, and browser validation remain untimed acceptance gates.

The `measure-production-block` operation executes exactly one next scheduled
M2/M10/M11 block. It refuses a different metric family, a checkout commit that
differs from the campaign manifest, an active interrupted block, a failed host
gate, workspace-seal drift, or a tool-order mismatch. One cell failure is
recorded with its evidence and abandons the complete attempt according to the
frozen replacement rule.

The `measure-development-block` operation applies the same block and ledger
rules to M1. Chrome is started before the clock. Timing begins immediately
before the fresh development-server process and ends only after HTTP succeeds,
the workload-specific application control is visible and usable, fonts settle,
and two browser animation frames complete. Memos' pinned backend and
Bulletproof React's local fixture API start before the clock. The cell then
closes Chrome and all process groups, verifies the sealed workspace did not
drift, and records the single readiness outcome.
