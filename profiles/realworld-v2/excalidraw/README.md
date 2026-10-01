# Excalidraw five-tool acceptance profile

This quarantined profile tests whether Vite, Rspack, esbuild, Webpack, and Rollup can build the same pinned Excalidraw application graph. It is correctness evidence only: every profile and report sets `publicationEligible` to `false`, and no timings from this workflow may support manuscript claims.

The upstream source is fixed at Excalidraw commit `5db42c3ddbbdc44d10120ab2f18e0864d083e268`. Preparation starts from the hash-inventoried repository, overlays one npm 11.9.0 lockfile and one common dependency closure, and then adds only the selected native adapter.

Two shared compatibility transforms are applied identically before any bundler runs:

- the Vite-specific variable locale import becomes 57 literal lazy imports, preserving language selection and code splitting;
- service-worker registration uses a no-op local module because PWA generation is outside the cross-bundler application contract.

All tools compile the original application entry, internal workspace packages, Sass, JSON locales, fonts, static assets, and lazy modules. Acceptance requires useful application source maps, external CSS, WOFF2 assets, a visible canvas, loaded UI fonts, rectangle drawing and movement, reload persistence, SVG export, and no unexpected external requests or browser errors.

Run the profile audit with:

```sh
node scripts/audit-excalidraw-adapter-profile.mjs /tmp/excalidraw-profile-audit.json
```

The GitHub Actions workflow performs clean source checkout, source verification, npm installation, native build, output validation, and browser acceptance independently for each tool.

Vite, Rspack, and Webpack additionally expose development adapters for HMR correctness checks. The acceptance harness draws a real rectangle, edits the pinned `MainMenu` component three times, verifies the browser document and scene survive after each settle period, exercises a deliberate reload control, and restores the source byte-for-byte. Esbuild and Rollup remain production-build comparators because these adapters do not provide native HMR servers. HMR acceptance reports contain no latency values and are not publication-eligible measurements.
