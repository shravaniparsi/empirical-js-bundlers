#!/usr/bin/env bash
#
# clear-cache.sh — Remove all bundler caches before a cold run
#
# Usage: ./scripts/clear-cache.sh <project-dir>

set -euo pipefail
DIR="${1:?Usage: clear-cache.sh <project-dir>}"

rm -rf "$DIR/dist" \
       "$DIR/.vite" \
       "$DIR/node_modules/.cache" \
       "$DIR/node_modules/.vite" \
       "$DIR/node_modules/.rspack" \
       "$DIR/.rspack" \
       "$DIR/.rollup.cache" 2>/dev/null || true

# Drop filesystem caches on macOS (best-effort, needs no sudo)
sync 2>/dev/null || true
