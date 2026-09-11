#!/usr/bin/env bash
#
# setup-all-workspaces.sh — Create all 25 tool × size workspaces
#
# Creates tier1-synthetic/workspaces/<tool>/<size>/ for each combination,
# each with the correct bundler config and node_modules installed.
#
# Usage:
#   ./scripts/setup-all-workspaces.sh              # All 25
#   ./scripts/setup-all-workspaces.sh --tools "vite rspack" --sizes "xs-50"  # Subset

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ALL_TOOLS="vite rspack esbuild webpack rollup"
ALL_SIZES="xs-50 s-200 m-500 l-2000 xl-5000"

TOOLS="$ALL_TOOLS"
SIZES="$ALL_SIZES"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tools) TOOLS="$2"; shift 2 ;;
    --sizes) SIZES="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

WORKSPACES="$ROOT/tier1-synthetic/workspaces"
PROJECTS="$ROOT/tier1-synthetic/projects"

TOTAL=0
for t in $TOOLS; do for s in $SIZES; do TOTAL=$((TOTAL+1)); done; done

echo "╔══════════════════════════════════════════════════╗"
echo "║   Setting up $TOTAL workspaces                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

JOB=0
for tool in $TOOLS; do
  for size in $SIZES; do
    JOB=$((JOB+1))
    TARGET="$WORKSPACES/$tool/$size"
    SOURCE="$PROJECTS/$size"

    echo "[$JOB/$TOTAL] $tool × $size"

    if [[ -d "$TARGET/node_modules" ]]; then
      echo "  ⏭️  Already set up, skipping."
      continue
    fi

    # Step 1: Copy source project
    echo "  [1/4] Copying source..."
    rm -rf "$TARGET"
    mkdir -p "$(dirname "$TARGET")"
    cp -r "$SOURCE" "$TARGET"

    # Step 2: Merge tool dependencies into package.json
    DEPS_FILE="$ROOT/configs/$tool/deps.json"
    echo "  [2/4] Merging $tool dependencies..."
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$TARGET/package.json', 'utf-8'));
      const deps = JSON.parse(fs.readFileSync('$DEPS_FILE', 'utf-8'));
      if (deps.devDependencies) pkg.devDependencies = { ...pkg.devDependencies, ...deps.devDependencies };
      if (deps.scripts) pkg.scripts = { ...pkg.scripts, ...deps.scripts };
      fs.writeFileSync('$TARGET/package.json', JSON.stringify(pkg, null, 2) + '\n');
    "

    # Step 3: Copy config files
    echo "  [3/4] Copying config..."
    case "$tool" in
      vite)
        cp "$ROOT/configs/vite/vite.config.ts" "$TARGET/" ;;
      rspack)
        cp "$ROOT/configs/rspack/rspack.config.cjs" "$TARGET/" ;;
      esbuild)
        mkdir -p "$TARGET/configs/esbuild"
        cp "$ROOT/configs/esbuild/build.mjs" "$TARGET/configs/esbuild/"
        cp "$ROOT/configs/esbuild/watch.mjs" "$TARGET/configs/esbuild/" ;;
      webpack)
        cp "$ROOT/configs/webpack/webpack.config.cjs" "$TARGET/" ;;
      rollup)
        cp "$ROOT/configs/rollup/rollup.config.mjs" "$TARGET/" ;;
    esac

    # Step 4: Install dependencies
    echo "  [4/4] npm install..."
    cd "$TARGET" && npm install --prefer-offline 2>&1 | tail -1
    cd "$ROOT"

    echo "  ✅ Done"
    echo ""
  done
done

echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ All $TOTAL workspaces ready!                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Disk usage:"
du -sh "$WORKSPACES"/*/ 2>/dev/null | sed 's/^/  /'
