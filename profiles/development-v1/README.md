# Development profile v1

This candidate profile adds SPA history fallback to Rspack and Webpack development servers. It also disables Rspack serve-mode lazy compilation so dynamic-route JavaScript cannot race SPA fallback. Vite retains its production-v1 development configuration. Each overlay imports a preserved copy of the canonical configuration from the fresh workspace.

Prepare synthetic workspaces with `node scripts/prepare-development-profile.mjs <tool> <fresh-production-v1-tool-workspace>` and Bulletproof React with the final `realworld` argument. `DEVELOPMENT_PROFILE.json` records the workload kind and base and effective configuration hashes. Sources and lockfiles are untouched. Overlaid Rspack and Webpack workspaces intentionally differ from production-v1 and must not be reused for production timing; the production configuration verifier should reject them. The frozen production profile and its older validation evidence remain unchanged.

The fixed 200/5000-module HMR matrix uses identical routes and state fields across all tools. These are correctness sessions, not latency observations.
