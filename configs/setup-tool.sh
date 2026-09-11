#!/usr/bin/env bash
#
# setup-tool.sh — Apply a bundler config to a benchmark project
#
# Usage:
#   ./configs/setup-tool.sh <tool> <project-dir>
#
# Examples:
#   ./configs/setup-tool.sh vite tier1-synthetic/projects/xs-50
#   ./configs/setup-tool.sh webpack tier1-synthetic/projects/m-500
#
# Tools: vite, rspack, esbuild, webpack, rollup

set -euo pipefail

TOOL="${1:?Usage: setup-tool.sh <tool> <project-dir>}"
PROJECT_DIR="${2:?Usage: setup-tool.sh <tool> <project-dir>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$SCRIPT_DIR/$TOOL"

if [ ! -d "$CONFIG_DIR" ]; then
  echo "❌ Unknown tool: $TOOL"
  echo "   Available: vite, rspack, esbuild, webpack, rollup"
  exit 1
fi

if [ ! -d "$ROOT_DIR/$PROJECT_DIR" ]; then
  echo "❌ Project directory not found: $PROJECT_DIR"
  exit 1
fi

TARGET="$ROOT_DIR/$PROJECT_DIR"
echo "🔧 Setting up $TOOL for $PROJECT_DIR"

# Step 1: Read deps.json and merge into project's package.json
DEPS_FILE="$CONFIG_DIR/deps.json"
if [ -f "$DEPS_FILE" ]; then
  echo "  [1/3] Merging dependencies..."

  # Use Node.js to merge package.json (portable, no jq dependency)
  node -e "
    const fs = require('fs');
    const pkgPath = '$TARGET/package.json';
    const depsPath = '$DEPS_FILE';
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const extra = JSON.parse(fs.readFileSync(depsPath, 'utf-8'));

    // Merge devDependencies
    if (extra.devDependencies) {
      pkg.devDependencies = { ...pkg.devDependencies, ...extra.devDependencies };
    }

    // Merge scripts
    if (extra.scripts) {
      pkg.scripts = { ...pkg.scripts, ...extra.scripts };
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('    ✓ package.json updated');
  "
fi

# Step 2: Copy config file(s)
echo "  [2/3] Copying config files..."
case "$TOOL" in
  vite)
    cp "$CONFIG_DIR/vite.config.ts" "$TARGET/"
    echo "    ✓ vite.config.ts"
    ;;
  rspack)
    cp "$CONFIG_DIR/rspack.config.cjs" "$TARGET/"
    echo "    ✓ rspack.config.cjs"
    ;;
  esbuild)
    mkdir -p "$TARGET/configs/esbuild"
    cp "$CONFIG_DIR/build.mjs" "$TARGET/configs/esbuild/"
    cp "$CONFIG_DIR/watch.mjs" "$TARGET/configs/esbuild/"
    # Update scripts to reference the correct path
    node -e "
      const fs = require('fs');
      const pkgPath = '$TARGET/package.json';
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      pkg.scripts.dev = 'node configs/esbuild/watch.mjs';
      pkg.scripts.build = 'node configs/esbuild/build.mjs';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    "
    echo "    ✓ configs/esbuild/build.mjs + watch.mjs"
    ;;
  webpack)
    cp "$CONFIG_DIR/webpack.config.cjs" "$TARGET/"
    echo "    ✓ webpack.config.cjs"
    ;;
  rollup)
    cp "$CONFIG_DIR/rollup.config.mjs" "$TARGET/"
    echo "    ✓ rollup.config.mjs"
    ;;
esac

# Step 3: Install dependencies
echo "  [3/3] Installing dependencies..."
cd "$TARGET"
npm install --prefer-offline 2>&1 | tail -1

echo ""
echo "✅ $TOOL configured for $PROJECT_DIR"
echo "   Run:  cd $PROJECT_DIR && npm run build"
