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
