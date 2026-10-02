# Native application and larger HMR acceptance

These are correctness checks, not performance observations. The publication-authoritative consolidated-v4 dataset has not been extended or modified.

## Memos

**Passed** in [36092946515](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36092946515), tested commit `94106c7`, Node 24.14.0, Go 1.27.0, Chrome 153.0.8010.52. All seven checks passed; the server exited normally and all 1,307 source hashes remained intact. The screenshot was visually verified.

The test uses the pinned upstream frontend and the actual Go 1.27.0 backend with read-only dependency resolution, a fresh SQLite database and loopback-only servers. The harness serves the original frontend output and proxies API traffic to the actual backend; it does not construct API responses or alter authentication. A disposable test account is created through the UI.

The acceptance sequence is signup/login, create a Markdown note, edit that same note, reload, inspect successful native writes, then shut down the backend and inspect the persisted SQLite content. The database is deleted after recording hashes because it contains disposable session material. Source hashes are checked before and after the successful scenario. Browser screenshots, request outcomes and server logs are retained.

The initial 401 from RefreshToken is expected for a fresh anonymous browser, only before signup. Aborted ListMemos reads during React Query invalidation are recorded separately; failed writes and unexpected HTTP/console errors fail acceptance. Full backend performance, email, third-party services and all application features are outside this functional scenario.

Calibration failures are retained. Fixes following these failures cover signup synchronization, selecting the modal rather than the background editor, an incorrect Puppeteer API call, and cancelled-read handling. These are harness diagnostics, not findings that Memos is defective.

## Larger synthetic HMR

**Passed 6/6 cells** in [36093638637](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36093638637), tested commit `083ed49`. All three edits, the reload control, byte-exact source restoration and process-group cleanup passed in each cell. Rspack direct-route fallback and asynchronous process cleanup were corrected before this final matrix.

The expanded matrix uses the existing production-v1 development configurations and their pinned locks, Node 22.16.0, 200 and 5,000 modules, and Vite/Rspack/Webpack. The application sources and generator were not altered. The final matrix uses a separately audited development-v1 overlay: Rspack gains `historyApiFallback` for direct SPA URLs, while Vite and Webpack keep their existing development configurations. The canonical production-v1 profile remains intact. A local negative check confirms that the production verifier rejects an overlaid workspace.

Each cell is one development-server session containing three sequential root-component edits. The final probe uses the same declared route/field across tools: `/` and `AuthTextArea-field` at 200 modules; `/dashboard` and `DashboardToggle-field` at 5,000 modules. Earlier adaptive route-selection attempts remain calibration evidence. Lazy route requests must settle before selecting the state control. Stable application field IDs are used across updates; a harness-added DOM attribute is not required to survive a rerender. An intentional reload tests the document-change detector. Exact source restoration and server termination are required.

This does not establish that every component, every edit category or every real-world app supports state-preserving HMR. Three edits within a session are dependent observations and must never be treated as three independent benchmark runs. No latency estimates or tool rankings should be drawn from these checks.

## Next implementation gates

1. Build the five adapters for the complete Memos and Excalidraw source graphs. Preserve the React compiler, Tailwind, workspace aliases, font/SVG/Sass and other application requirements under an explicit common transformation policy.
2. Audit exact application dependency resolution across the five tools for each app, and run the same functional acceptance on every adapter output.
3. Choose one runtime for the confirmatory campaign. Adopting Node 24 requires revalidating the earlier Node 22 synthetic and Bulletproof profile cells.
4. Extend browser acceptance to the real-world HMR scenarios used in the paper, freeze independent-session sampling and analysis, then collect fresh actual measurements.
5. Update inferential analysis, claims and manuscript from accepted new campaigns only.
