# Confirmatory cloud protocol v2 (draft)

This directory defines the affordable primary-study replacement for `confirmatory-v1`. Version 1 assumed one fixed physical Mac, but no primary observation was collected under it. Version 2 instead targets GitHub's standard `macos-14` Apple Silicon environment. The two protocols must never be pooled.

The protocol remains `draft-premeasurement` and `publicationEligible: false`. Do not run or inspect a primary timing cell until the capacity pilot passes, all four primary executors and deliberately failing controls pass on the target runner, the artifact validator and consolidator pass, and a freeze manifest hashes every measurement-affecting input.

## Blocking and execution

One fresh GitHub-hosted job executes one complete randomized block for one metric and workload. Only one block job runs at a time, and all scheduled tools run serially in the frozen position-balanced order on that VM. The VM is therefore the blocking unit, and inference uses only within-VM paired contrasts. Sequential jobs also avoid load created by this campaign on other hosted VMs that may share provider capacity.

Setup is untimed. Each job checks out pinned sources, verifies source and lock hashes, prepares one tool workspace at a time, runs the scheduled cell, verifies restoration and process cleanup, and removes that tool workspace before preparing the next. This limits storage while preserving the same canonical source and reviewed profile for every tool in the block.

Every block artifact must contain the runner label, `ImageOS`, `ImageVersion`, hardware inventory, macOS and Chrome versions, exact Node version, repository commit, protocol/schedule/executor hashes, source and lock hashes, tool order, pre/post disk and memory observations, process inventories, raw logs, cell evidence, restoration checks, and an artifact SHA-256 manifest. A failed cell retains the job artifact and invalidates the whole attempt. A replacement uses a new attempt ID and a new VM.

## Planned scope

The workload, tool, metric, sample-count, randomization, exclusion, and inferential plans remain those defined in `protocol.json`: 420 complete blocks and 1,740 process/session units across five synthetic sizes and Bulletproof React, Memos, and Excalidraw. M3 and M4 still reduce five measured edits within a restarted session to one median analysis unit.

The claim boundary changes. Results estimate paired tool differences on the frozen GitHub-hosted standard `macos-14` Apple M1 image. They do not represent a consumer Mac or a single fixed physical machine. Every block must match the frozen `ImageOS`, `ImageVersion`, macOS build, Node, and Chrome versions; an image update pauses the campaign before collection continues.

## Evidence lifecycle

GitHub Actions artifacts are temporary transport, not the publication archive. Every completed and failed job artifact must be downloaded, hash-verified, and registered before retention expiry. Primary eligibility remains locked until the complete raw corpus, manifests, analysis code, and environment metadata are deposited in a durable public archive with a persistent identifier.

The current capacity workflow is diagnostic only:

```bash
gh workflow run cloud-macos-capacity-pilot.yml --ref codex/realworld-expansion-v1
```

It records zero primary measurements. A future frozen collection workflow must accept an explicit block ID and attempt, reject unscheduled work, run the whole block inside one job, and upload one immutable artifact.
