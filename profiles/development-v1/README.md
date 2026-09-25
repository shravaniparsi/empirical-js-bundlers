# Development profile v1

This candidate profile adds SPA history fallback to Rspack's development server. Vite and Webpack retain their existing production-v1 development configuration. The Rspack overlay imports a preserved copy of the canonical configuration from the fresh workspace; only `devServer.historyApiFallback` changes.

Prepare with `node scripts/prepare-development-profile.mjs <tool> <fresh-production-v1-tool-workspace>` before running HMR acceptance. `DEVELOPMENT_PROFILE.json` records base and effective configuration hashes. Sources and lockfiles are untouched. An overlaid Rspack workspace intentionally differs from production-v1 and must not be reused for production timing; the production configuration verifier should reject it. The frozen production profile and its older validation evidence remain unchanged.

The fixed 200/5000-module HMR matrix uses identical routes and state fields across all tools. These are correctness sessions, not latency observations.
