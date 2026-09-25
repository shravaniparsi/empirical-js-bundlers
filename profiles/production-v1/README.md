# Production profile v1 — candidate

This profile estimates production **toolchain** performance under common functional requirements. It does not isolate bundler internals or establish that implementation language causes a performance difference. Configuration and dependency files are versioned separately from the earlier correctness pilots and the immutable consolidated-v4 corpus.

## Contract

- Identical application source and exact direct application dependency versions within each fixture. React 19.3.0 is used for synthetic fixtures; the recovered real-world application retains React 18.3.1. These are separate workloads.
- ES2022 emitted JavaScript, production mode, automatic React JSX runtime, JS and CSS minification enabled, external JS maps with embedded source content and usable original mappings.
- Dynamic imports retained; automatic tool-specific chunk partitioning. No manually selected vendor group or application-specific chunk-size threshold. Chunk counts need not match.
- Image assets emitted as files. For the adapted real-world app, every tool uses the same public-asset copy poststep and omits the disabled mock-service-worker script. CSS modules and real-world Tailwind processing retained. CSS source-map availability is recorded, not a common requirement: Vite currently does not emit one in the small fixture while other tools do. This is a residual toolchain difference and must be disclosed, not interpreted as identical work.
- Exact direct build-tool versions and independent complete lockfiles. Installation uses `npm ci --include=dev`, with no fallback resolution. Profile locks were newly generated and are not historical reproductions.
- Build timing, when authorized by a frozen study protocol, surrounds the same `npm run build` boundary. Installations and acceptance checks run outside that boundary. No timings from these checks qualify as primary observations.

| Tool | JavaScript minifier | CSS minifier |
|---|---|---|
| Vite 8.3.0 | Oxc, selected explicitly | Lightning CSS |
| Rspack 2.2.3 | SWC, ES2022 | Lightning CSS |
| esbuild 0.28.2 | esbuild | esbuild and its CSS-module pipeline |
| Webpack 5.111.1 | Terser via pinned plugin | cssnano via pinned CSS minimizer plugin |
| Rollup 4.63.1 | SWC plugin | cssnano through PostCSS |

This compares minifying toolchains, not a common minifier algorithm. Vite's current configuration API documents Oxc and Lightning CSS: https://vite.dev/config/build-options . Rspack's explicit minimizers are documented at https://rspack.dev/plugins/swc-js-minimizer-rspack-plugin and https://rspack.dev/plugins/lightning-css-minimizer-rspack-plugin . Webpack's CSS plugin is documented at https://github.com/webpack/css-minimizer-webpack-plugin . All resolved package inventories are recorded by the profile audit.

## Verification and limits

`check-production-contract.mjs` parses every emitted JS file as ES2022 and checks external map paths, original mappings, embedded content and original source bounds. This is stronger than counting map files, but does not prove full mapping accuracy or browser/API compatibility. The browser checks verify actual page behavior using the recorded Chrome version. Chrome 107 is used only for the explicit CSS minifier targets where supported; it is not a tested minimum-browser claim. ES2022 parsing is a syntax check, not a polyfill guarantee.

`audit-production-profile.mjs` checks exact direct pins and equal application dependency declarations and archives full lock inventories. The audit also requires equal reachable application dependency-version nodes and edges, including installed optional and peer dependencies. Build-only toolchain dependencies may differ.

Run `npm ci --prefix profiles/production-v1/validation`, then `node --test scripts/production-contract.test.mjs`. Prepare and run a fresh correctness sweep with `PROFILE_REVISION=<new-name> node scripts/run-production-profile.mjs synthetic xs-50 <new-report-directory>`; use `realworld app` for the recovered application. Historical configurations and prior reports are never overwritten. Before reuse, `verify-production-configuration.mjs` compares the workspace configuration, package, lock and contract hashes with the canonical profile and refuses stale or modified workspaces. This identity check does not replace measurement-time source hashing. The GitHub acceptance workflow expands this to 200, 500, 2,000 and 5,000 components.

This remains a candidate until the acceptance matrix, dependency comparability audit and configuration limitations have been reviewed. No new publication-authoritative data has been collected under it.
