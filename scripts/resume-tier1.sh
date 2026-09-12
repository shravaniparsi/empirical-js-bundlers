#!/usr/bin/env bash
# resume-tier1.sh — Resume data collection from where it stopped
# Fills Vite gaps first, then runs remaining tools
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RAW="$ROOT/results/tier1-raw"

export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22.16.0 > /dev/null 2>&1

echo "╔══════════════════════════════════════════════════╗"
echo "║   Resuming Tier 1 Data Collection                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

JOB=0
TOTAL=0
START_TIME=$(date +%s)

# Helper: run benchmark if CSV doesn't already exist
run_if_missing() {
  local tool="$1" size="$2" metric="$3" runs="$4"
  local csv="$RAW/${tool}_${size}_${metric}.csv"
  TOTAL=$((TOTAL + 1))
  
  if [[ -f "$csv" ]] && [[ $(wc -l < "$csv") -gt 1 ]]; then
    # Check if data has real values (not all timeouts)
    local real_vals
    real_vals=$(awk -F, 'NR>1 && $5 >= 0' "$csv" | wc -l | tr -d ' ')
    if [[ "$real_vals" -gt 0 ]]; then
      JOB=$((JOB + 1))
      echo "  [$JOB] $tool × $size × $metric — SKIP (already collected, $real_vals valid runs)"
      return
    fi
  fi
  
  JOB=$((JOB + 1))
  echo ""
  echo "  [$JOB] $tool × $size × $metric ($runs runs)"
  
  local project="$ROOT/tier1-synthetic/workspaces/$tool/$size"
  if [[ ! -d "$project/node_modules" ]]; then
    echo "    ⚠️ Workspace missing: $project"
    return
  fi
  
  rm -f "$csv"
  bash "$SCRIPT_DIR/run-single.sh" \
    --tool "$tool" --size "$size" --metric "$metric" --runs "$runs" 2>&1 | sed 's/^/    /'
  
  local elapsed=$(( $(date +%s) - START_TIME ))
  echo "    ⏱️  ${elapsed}s elapsed"
}

# ═══════════════════════════════════════════════════════════
# Phase A: Fill Vite gaps
# ═══════════════════════════════════════════════════════════
echo "━━━ Phase A: Vite gaps ━━━"
run_if_missing vite m-500 M4 20
run_if_missing vite xl-5000 M3 20
run_if_missing vite xl-5000 M4 20

# ═══════════════════════════════════════════════════════════
# Phase B: All remaining tools
# ═══════════════════════════════════════════════════════════
PROD_METRICS="M2 M5 M6 M7 M8 M9 M10 M11"
M3_SIZES="xs-50 m-500 xl-5000"
HMR_TOOLS="rspack webpack"
ALL_SIZES="xs-50 s-200 m-500 l-2000 xl-5000"

for tool in rspack esbuild webpack rollup; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Tool: $tool"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Prod metrics: all sizes
  for metric in $PROD_METRICS; do
    for size in $ALL_SIZES; do
      run_if_missing "$tool" "$size" "$metric" 10
    done
  done
  
  # M3: 3 sizes, all tools
  for size in $M3_SIZES; do
    run_if_missing "$tool" "$size" M3 20
  done
  
  # M1/M4: 3 sizes, only HMR tools
  if [[ " $HMR_TOOLS " =~ " $tool " ]]; then
    for size in $M3_SIZES; do
      run_if_missing "$tool" "$size" M1 20
      run_if_missing "$tool" "$size" M4 20
    done
  fi
done

TOTAL_TIME=$(( $(date +%s) - START_TIME ))
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ Resume complete!                            ║"
echo "║   Total time: ${TOTAL_TIME}s                     ║"
echo "║   Results in: results/tier1-raw/                 ║"
echo "╚══════════════════════════════════════════════════╝"
