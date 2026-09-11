#!/usr/bin/env bash
#
# setup-tier2-workspaces.sh — Create tool-specific workspaces for Tier 2 projects
#
# Usage:
#   ./scripts/setup-tier2-workspaces.sh bulletproof-react

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PROJECT="${1:?Usage: setup-tier2-workspaces.sh <project-name>}"
SOURCE="$ROOT/tier2-realworld/$PROJECT"
WORKSPACES="$ROOT/tier2-realworld/workspaces"

ALL_TOOLS="vite rspack esbuild webpack rollup"

if [[ ! -d "$SOURCE/src" ]]; then
  echo "❌ $SOURCE/src not found"
  exit 1
fi

echo "Setting up Tier 2 workspaces for: $PROJECT"

for tool in $ALL_TOOLS; do
  TARGET="$WORKSPACES/$tool/$PROJECT"
  echo ""
  echo "[$tool] Setting up..."

  if [[ -d "$TARGET/node_modules" ]]; then
    echo "  ⏭️ Already set up"
    continue
  fi

  # Copy source
  rm -rf "$TARGET"
  mkdir -p "$(dirname "$TARGET")"
  cp -r "$SOURCE" "$TARGET"

  # Remove vite-specific config for non-vite tools
  if [[ "$tool" != "vite" ]]; then
    rm -f "$TARGET/vite.config.ts"
  fi

  # Merge tool-specific deps
  DEPS_FILE="$ROOT/configs/$tool/deps.json"
  if [[ -f "$DEPS_FILE" ]]; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$TARGET/package.json', 'utf-8'));
      const deps = JSON.parse(fs.readFileSync('$DEPS_FILE', 'utf-8'));
      if (deps.devDependencies) pkg.devDependencies = { ...pkg.devDependencies, ...deps.devDependencies };
      if (deps.scripts) pkg.scripts = { ...pkg.scripts, ...deps.scripts };
      fs.writeFileSync('$TARGET/package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
  fi

  # Copy tool-specific config
  case "$tool" in
    vite)
      # Already has vite.config.ts, add sourcemap
      node -e "
        let c = require('fs').readFileSync('$TARGET/vite.config.ts','utf8');
        if (!c.includes('sourcemap')) {
          c = c.replace('build: {', 'build: {\n    sourcemap: true,');
          require('fs').writeFileSync('$TARGET/vite.config.ts', c);
        }
      "
      ;;
    rspack)
      cat > "$TARGET/rspack.config.cjs" << 'RSPACK_EOF'
const path = require('path');
const rspack = require('@rspack/core');
module.exports = {
  mode: 'production',
  entry: './src/main.tsx',
  output: { path: path.resolve(__dirname, 'dist'), filename: '[name].[contenthash:8].js', clean: true },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  module: {
    rules: [
      { test: /\.(tsx?|jsx?)$/, exclude: /node_modules/, loader: 'builtin:swc-loader',
        options: { jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } } } },
      { test: /\.css$/, type: 'javascript/auto', use: [
        rspack.CssExtractRspackPlugin.loader,
        'css-loader',
        'postcss-loader'
      ]},
    ],
  },
  plugins: [
    new rspack.CssExtractRspackPlugin(),
    new rspack.HtmlRspackPlugin({ template: './index.html' }),
    new rspack.DefinePlugin({ 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }) }),
  ],
  devtool: 'source-map',
};
RSPACK_EOF
      ;;
    esbuild)
      mkdir -p "$TARGET/configs/esbuild"
      cat > "$TARGET/configs/esbuild/build.mjs" << 'ESBUILD_EOF'
import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const result = await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'dist',
  splitting: true,
  format: 'esm',
  sourcemap: true,
  metafile: true,
  minify: true,
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css' },
  jsx: 'automatic',
  alias: { '@': './src' },
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': '"production"' },
});

const html = fs.readFileSync('index.html', 'utf-8');
const outputs = Object.keys(result.metafile.outputs);
const jsEntry = outputs.find(o => o.endsWith('.js') && !o.includes('chunk'));
const cssEntry = outputs.find(o => o.endsWith('.css') && !o.includes('chunk'));
let injected = html.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  `${cssEntry ? `<link rel="stylesheet" href="/${cssEntry}">` : ''}
   <script type="module" src="/${jsEntry}"></script>`
);
fs.writeFileSync('dist/index.html', injected);

const analysis = await esbuild.analyzeMetafile(result.metafile, { verbose: false });
console.log(analysis);
ESBUILD_EOF
      ;;
    webpack)
      cat > "$TARGET/webpack.config.cjs" << 'WEBPACK_EOF'
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
module.exports = {
  mode: 'production',
  entry: './src/main.tsx',
  output: { path: path.resolve(__dirname, 'dist'), filename: '[name].[contenthash:8].js', clean: true },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  module: {
    rules: [
      { test: /\.(tsx?|jsx?)$/, exclude: /node_modules/, use: {
        loader: 'swc-loader', options: { jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } } } } },
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index.html' }),
    new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' }),
    new webpack.DefinePlugin({ 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }) }),
  ],
  devtool: 'source-map',
};
WEBPACK_EOF
      ;;
    rollup)
      cat > "$TARGET/rollup.config.mjs" << 'ROLLUP_EOF'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { swc } from 'rollup-plugin-swc3';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import html from '@rollup/plugin-html';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default {
  input: 'src/main.tsx',
  output: { dir: 'dist', format: 'es', sourcemap: true, entryFileNames: '[name]-[hash].js', chunkFileNames: 'chunk-[hash].js' },
  plugins: [
    alias({ entries: [{ find: '@', replacement: path.resolve(__dirname, 'src') }] }),
    replace({ preventAssignment: true, 'process.env.NODE_ENV': JSON.stringify('production'),
      'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': '"production"' }),
    postcss({ extract: true, minimize: true }),
    resolve({ extensions: ['.tsx', '.ts', '.jsx', '.js'], browser: true }),
    commonjs(),
    swc({ jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } }, minify: true }),
    html({ template: ({ files }) => {
      const js = (files.js || []).map(f => `<script type="module" src="${f.fileName}"></script>`).join('');
      const css = (files.css || []).map(f => `<link rel="stylesheet" href="${f.fileName}">`).join('');
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>App</title>${css}</head><body><div id="root"></div>${js}</body></html>`;
    }}),
  ],
};
ROLLUP_EOF
      ;;
  esac

  # Install dependencies
  echo "  npm install..."
  cd "$TARGET" && npm install --prefer-offline 2>&1 | tail -2
  cd "$ROOT"

  echo "  ✅ $tool done"
done

echo ""
echo "All Tier 2 workspaces ready for $PROJECT"
du -sh "$WORKSPACES"/*/"$PROJECT" 2>/dev/null | sed 's/^/  /'
