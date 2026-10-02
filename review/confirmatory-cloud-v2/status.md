# Confirmatory cloud v2 status

`confirmatory-v2-cloud-m1` is the active draft path for new primary collection. It replaces the unstarted fixed-physical-host design because no suitable physical Mac is available. Confirmatory v1 remains immutable design history and contributes zero observations.

## Completed controls

- The draft protocol and deterministic schedule audit as 420 position-balanced complete blocks and 1,740 process/session units.
- A fresh `macos-14` standard runner passed the exact pre-block environment gate in run 36951720681: image `20260831.0302.1`, macOS 14.8.9 build 23J631, Apple M1 virtual CPU, 3 cores, 7 GiB memory, arm64, Node 24.14.0, Chrome 154.0.8037.57, more than 20 GiB free disk, and more than 50% free memory.
- The corrected capacity pilot is run 36950096302. Memos passed its pinned-source and output contracts plus ten real-backend/browser/SQLite checks. Excalidraw passed its pinned-source and output contracts plus drawing, moving, reload persistence, font, offline-request, and SVG-export checks.
- The 5,000-module, approximately 796k-line synthetic Rollup profile passed install, build, output contract, and browser acceptance in synthetic-only run 36951823345. The job completed in 19m1s. Its preceding diagnostic in run 36950096302 established an 18m31s build and 83% free memory afterward but then exposed the pilot's omitted output-validator dependency install.
- The accepted three-workload capacity corpus combines only the passing jobs, contains 47 hash-manifested files, and passes `validate-cloud-capacity-evidence.mjs`. It remains capacity/correctness evidence with zero primary observations.
- Per-cell ephemeral workspace sealing and source/dependency restoration controls pass locally. The M1 and M2/M10/M11 collectors support the cloud seal before and after a cell while retaining their existing physical-host path.
- The M3 primary session executor is implemented with one untimed stabilization edit, five measured edit/revert cycles, marker-confirmed output identity, session-median reduction, process cleanup, source restoration, post-session seal verification, and a freeze-manifest lock. Its six-cycle correctness control passes locally and records zero primary measurements.
- Exact-image M3 smoke run 36953454980 passed all five tools on `xs-50`. The 19-file archive revalidates each runner gate, all 30 edit/revert cycles, source and process cleanup, internal evidence hashes, absence of primary outcomes, and zero primary eligibility.
- These controls record no primary performance observations and remain `publicationEligible: false`.

Run 36949697335 is a superseded diagnostic. Its Memos failure exposed a macOS keyboard-modifier assumption, and its Excalidraw failure exposed a Chrome 154 permissions-policy diagnostic. Both functional paths had otherwise succeeded. The harness corrections are explicit and the superseded run was cancelled once the corrected run was active.

## Required before primary collection

1. Integrate the passed cloud cell seal with M4 and immutable per-block artifact manifests.
2. Build the one-block-per-job M1 and M2/M10/M11 cloud orchestrators around the existing collectors.
3. Expand the passing M3 smoke control to the remaining 35 cells; implement M4 primary session execution and its deliberately failing controls.
4. Implement block-artifact validation, replacement-attempt auditing, download registration, and corpus consolidation.
5. Pass the complete executor-control matrix on the exact frozen `macos-14` image.
6. Freeze the protocol, schedule, workflows, executors, profiles, source inventories, and dependency locks before observing a primary outcome.
7. Run all 420 blocks one job at a time, archive every successful and failed attempt, execute the prespecified analysis, and deposit the durable corpus.
