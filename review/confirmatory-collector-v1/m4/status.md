# Confirmatory M4 correctness gate

The complete 18-cell matrix required by `confirmatory-v1` has accepted
correctness evidence on Node 24.14.0. These runs validate the measurement
boundary; they contain no HMR latency observations and are not primary study
data.

The nine previously missing cells passed in [GitHub Actions run
36829908004](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36829908004)
at commit `694e054ab2093398ac7f0d468fd118765986daab`. Vite, Rspack, and
Webpack each passed `xs-50`, `m-500`, and Bulletproof React. Every cell
performed three settled edits, preserved the browser document and application
state, detected an intentional reload, restored the edited source byte for
byte, and stopped its development-server process tree.

The remaining protocol cells were already accepted on the same frozen runtime:

- `xl-5000` across all three tools in [run
  36819476193](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36819476193),
  archived under `review/runtime-v1-revalidation/`;
- Memos and Excalidraw across all three tools in [run
  36822789535](https://github.com/shravaniparsi/empirical-js-bundlers/actions/runs/36822789535),
  archived under `review/realworld-hmr-v1/`.

Together these reports cover 18 cells and 54 correctness edits. The new
Bulletproof harness uses a local fixture API, a real registration-form input as
state, a reviewed component edit target, and a deliberate reload control.
Rspack lazy compilation is disabled for development correctness because its
dynamic-route proxy can race SPA fallback; Webpack and Rspack both receive
explicit history fallback overlays. These development overlays are recorded in
`DEVELOPMENT_PROFILE.json` and are excluded from production timing.
