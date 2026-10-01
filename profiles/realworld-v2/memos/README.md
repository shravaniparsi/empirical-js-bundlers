# Memos five-tool adapter profile

This candidate keeps the pinned Memos application at upstream commit `05a2c6db7a3e926c9142a635f42f7af0f078c81d`. It is correctness infrastructure and is not publication timing data.

All tools use one exact application manifest, one lockfile, the Babel React Compiler transform, and Tailwind CSS 4 through its PostCSS plugin. The original `@bufbuild/protobuf` patch is applied after `npm ci` and verified. Application source, generated protobuf files, public assets, and the original HTML are identical across tools.

Bundlers retain their native module graph, chunking, asset emission, CSS integration, and minification stages. Resource-query adapters preserve Memos's three Vite-specific contracts: CSS as text for `?raw` and `?inline`, and a URL for the standalone MapLibre worker file with `?worker&url`. These differences are part of the toolchain adapter and must be described in the paper.

The profile requires Node 24.14.0. Vite, Rspack, and Webpack also expose development adapters for HMR correctness checks. Those checks edit the pinned `SignUp` component, require both credential fields and the browser document to survive three settled updates, exercise a deliberate reload control, and restore the source byte-for-byte. Esbuild and Rollup remain production-build comparators because these adapters do not provide native HMR servers.

Every report produced here is marked `publicationEligible: false`; correctness checks cannot be analyzed as timing observations.
