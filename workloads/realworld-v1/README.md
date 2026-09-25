# Independent application expansion, candidate stage

These are complete upstream application candidates, not additional accepted measurements. Their pinned original builds establish feasibility before cross-bundler adaptation. The publication-authoritative consolidated-v4 corpus is unchanged.

Read `SELECTION.md` for criteria recorded before builds. `registry.json` pins upstream commits, Node 24.14.0, package-manager versions, original lockfile hashes and source inventories. Inventories contain every tracked file, including tests, documentation and backend code; `scriptModules` is a repository inventory count, **not a measured reachable bundle-graph size**. MIT licenses are preserved in each candidate directory.

## Reproduction

Use Node 24.14.0 for these original-build checks. This is a separate feasibility environment from the Node 22.16.0 production-v1 comparison candidate. Do not combine their timings.

```sh
node scripts/fetch-realworld-candidate.mjs memos /tmp/memos-pinned
npm install --global pnpm@11.0.1
node scripts/run-realworld-baseline.mjs memos /tmp/memos-pinned /tmp/memos-baseline-report

node scripts/fetch-realworld-candidate.mjs excalidraw /tmp/excalidraw-pinned
npm install --global yarn@1.22.22
node scripts/run-realworld-baseline.mjs excalidraw /tmp/excalidraw-pinned /tmp/excalidraw-baseline-report
```

Every destination/report must be new. The runner checks source hashes and the original revision before installation, after frozen installation and after building. Receipts record commands, exit status, log hashes and runtime version. Output manifests hash emitted files. A build pass alone is explicitly `build-passed-browser-not-validated`. GitHub workflow `realworld-baseline.yml` runs on public, free Ubuntu runners; correctness runs are not suitable for comparative timing.

For Excalidraw, install this repository's root browser-harness dependencies and run:

```sh
node scripts/check-excalidraw-browser.mjs /tmp/excalidraw-pinned/excalidraw-app/build /tmp/excalidraw-browser-report /tmp/excalidraw-pinned
```

The check exercises drawing, movement, reload persistence and SVG export in the original complete app. Unrecognized external requests are blocked and fail acceptance. Exact upstream WOFF2 files are hash-checked and served by local request fixtures, including the production CSS Assistant font paths; the known analytics script receives an empty local response. Native file picking is disabled before application initialization to exercise its existing browser-download fallback. These are declared host/browser harness adaptations, not unmodified offline deployment acceptance. Collaboration, AI, sharing and cloud storage are outside the local interaction scope; their source remains in the upstream build. The Docker build entry disables Sentry, and the harness sets tracking false and disables Husky installation hooks. No application source is edited for the baseline. The upstream HTML independently loads analytics despite the tracking environment flag; the browser harness suppresses that script explicitly.

## Cross-tool adaptation requirements, still open

- **Memos:** Node >=24, React compiler transform, Tailwind 4 plugin, a patched protobuf runtime, and binary Connect RPC. Preserve these dependencies and their semantics. Prefer a locally seeded actual backend for read/create/edit checks; do not silently substitute empty API responses and call that functional acceptance.
- **Excalidraw:** source-level workspace aliases, Sass, SVG components, dynamic locales, font/WOFF2 processing, HTML environment substitutions and PWA virtual modules. Document a shared transformation policy before substituting build plugins. Keep the complete application graph, including features not exercised by the local browser scenario.
- Freeze one Node version for the eventual comparison; adopting Node 24 requires revalidating the earlier synthetic and Bulletproof cells. Existing production-v1 validation cannot automatically cover that runtime change.
- Generate and audit the five adapter lockfiles per app. A newly generated adapter lockfile is not proof of historical dependency versions; retain original upstream locks as provenance.
- All five adapters must satisfy the production output contract, equal application-dependency resolution and the same meaningful browser acceptance before measurements start.
- Extend HMR acceptance beyond the current 50-module fixture, then freeze independent-session sampling, randomized order and analysis rules before the confirmatory campaign.
