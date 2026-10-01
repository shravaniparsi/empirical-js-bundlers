# Real-world HMR correctness v1

The real-world HMR correctness gate passed all six cells in [GitHub Actions run 36822789535](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36822789535) at commit `e9f452f175a11b5c15667bd106a107a56dea1e2d`. Every job ran on the frozen Node 24.14.0 runtime.

The matrix covers Memos and Excalidraw with Vite, Rspack, and Webpack. Esbuild and Rollup remain production-build comparators because the pinned adapters do not expose native HMR servers. Each accepted cell made three edits to an actual pinned upstream React component. Acceptance required the browser document and application state to survive every edit with zero main-frame navigations, a one-second post-update settle check, a deliberate reload detector control, byte-for-byte source restoration, and clean process shutdown. Memos cells also used the compiled original Go backend and fresh SQLite state.

All 18 settled edits passed. Memos preserved both credential-field values; Excalidraw preserved the drawn rectangle and document. The reports contain no update-duration fields and are marked `publicationEligible: false` because this gate establishes correctness, not performance.

The first diagnostic run exposed Rspack CLI's default lazy compilation for web applications: the Memos locale bootstrap requested a hot-update asset before the lazy proxy completed, and history fallback returned HTML. The final configuration disables the documented top-level `lazyCompilation` option. A profile audit now also rejects missing HMR adapters, a stripped Excalidraw workspace lock, and stale per-tool lock hashes.

Production behavior remained intact. The Memos five-tool regression passed in [run 36822362193](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36822362193), and the Excalidraw five-tool regression passed in [run 36822462163](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36822462163).

The next publication gate is protocol freeze: define the hypotheses, primary outcomes, sampling unit, run count, randomization, warm-up and cache policy, exclusions, multiplicity control, statistical model, effect sizes, uncertainty intervals, and stopping/change-control rules before collecting new timing observations.
