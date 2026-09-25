# Real-world expansion status — 2026-09-24

Branch: `codex/realworld-expansion-v1`. These checks are feasibility/correctness evidence, not publication observations.

- Candidate criteria were recorded before running builds. Memos and Excalidraw add independent maintained applications; the existing Bulletproof React fixture is still explicitly a starter/reference workload.
- Memos is pinned to `05a2c6db7a3e926c9142a635f42f7af0f078c81d`; Excalidraw to `5db42c3ddbbdc44d10120ab2f18e0864d083e268`.
- All 1,307 and 1,297 tracked upstream files, respectively, are hash-inventoried. These totals include tests/documentation/backend files, not just reachable frontend modules.
- Both original production builds passed on Ubuntu with Node 24.14.0 and their original frozen package-manager locks. Sources were reverified before installation, after installation and after building. Output manifests contain 297 Memos files and 490 Excalidraw files.
- First build-only run: https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36090540586, benchmark commit `fb34ae0`.
- Four local source-guard checks passed, including intentional source corruption rejection and exact restoration.
- Initial strict offline browser run `36090729080` at `83f96e0` passed rectangle drawing, movement and persistence, but failed on CDN/Assistant font delivery, analytics requests, and native SVG save behavior. This failure is retained under `review/realworld-expansion-v1/attempt-2`.
- Attempt 3 (`36090992056`, `7a99c20`) removed the unexpected requests using local fixtures but still failed SVG export. Attempt 4 (`36091132696`, `a36484f`) adds explicit font-load and console-error checks. Attempt 4 confirmed loaded fonts and identified `window.showSaveFilePicker is not a function`: the harness must disable the open-file capability as well to select the upstream fallback. Both attempts remain diagnostic, not accepted measurements.
- A subsequent harness uses hash-verified upstream fonts as local delivery fixtures, suppresses the known analytics script and disables the native save picker to exercise the application's existing download fallback. It does not change application source. These adaptations limit the claim to local drawing functionality under this controlled delivery environment.
- Final run [36091272714](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36091272714), tested commit `fa6331e`, passed both original frozen builds and all six Excalidraw browser checks: UI fonts, visible canvas, drawing, movement, reload persistence and real SVG download. No browser/console errors or unexpected requests remained under the declared local fixtures. Screenshot and exported SVG are retained; the screenshot was visually inspected.
- Memos backend/browser acceptance remains open.
- Fresh network fetch reproduction of the pinned Memos revision passed all 1,307 file hashes.

The old Node 22.16.0 production-v1 profile and these Node 24.14.0 feasibility builds are different environments. Neither application has passed the five-tool comparison contract. No fresh primary timing data have been collected; consolidated-v4 remains the only publication-authoritative corpus.

Remaining sequence: complete functional acceptance; port full graphs with documented shared transforms; audit five exact locks per app; validate every tool; choose one final runtime and revalidate prior cells; extend HMR; freeze the sampling/analysis protocol; collect new independent sessions; update analysis and manuscript.
