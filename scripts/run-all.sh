#!/usr/bin/env bash
#
# run-all.sh — Master orchestrator: runs all tool × size × metric combinations
#
# Usage:
#   ./scripts/run-all.sh                    # Run everything
#   ./scripts/run-all.sh --tools "vite rspack" --sizes "xs-50 m-500"  # Subset
#   ./scripts/run-all.sh --metrics "M2 M10"  # Only specific metrics
#   ./scripts/run-all.sh --dry-run           # Print plan without executing
#
# Prerequisites:
#   1. Node 22+ (nvm use)
#   2. hyperfine installed (brew install hyperfine)
#   3. Each project set up with setup-tool.sh for the target tool

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Defaults ───
ALL_TOOLS="vite rspack esbuild webpack rollup"
ALL_SIZES="xs-50 s-200 m-500 l-2000 xl-5000"
# M3/M4 only on 3 scales (xs, m, xl) per research plan
M3_M4_SIZES="xs-50 m-500 xl-5000"
PROD_METRICS="M2 M5 M6 M7 M8 M9 M10 M11"
DEV_METRICS="M1 M3 M4"
HMR_TOOLS="vite rspack webpack"
COLD_RUNS=10
HMR_RUNS=20
DRY_RUN=false

# ─── Parse args ───
TOOLS="$ALL_TOOLS"
SIZES="$ALL_SIZES"
METRICS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tools)   TOOLS="$2";   shift 2 ;;
    --sizes)   SIZES="$2";   shift 2 ;;
    --metrics) METRICS="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

# If no metrics specified, run all
if [[ -z "$METRICS" ]]; then
  METRICS="$PROD_METRICS $DEV_METRICS"
fi

# ─── Pre-flight checks ───
echo "╔══════════════════════════════════════════════════╗"
echo "║   JS Bundler Benchmark — Master Orchestrator     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Tools:   $TOOLS"
echo "Sizes:   $SIZES"
echo "Metrics: $METRICS"
echo "Runs:    $COLD_RUNS (cold), $HMR_RUNS (M3/M4)"
echo ""

# Check hyperfine
if ! command -v hyperfine &>/dev/null; then
  echo "❌ hyperfine not found. Install: brew install hyperfine"
  exit 1
fi

# Check Node version
NODE_VER=$(node --version)
echo "Node.js: $NODE_VER"
echo ""

# ─── Count total jobs ───
TOTAL=0
for tool in $TOOLS; do
  for metric in $METRICS; do
    case "$metric" in
      M1|M4)
        [[ ! " $HMR_TOOLS " =~ " $tool " ]] && continue
        for size in $M3_M4_SIZES; do
          [[ " $SIZES " =~ " $size " ]] && TOTAL=$((TOTAL + 1))
        done ;;
      M3)
        for size in $M3_M4_SIZES; do
          [[ " $SIZES " =~ " $size " ]] && TOTAL=$((TOTAL + 1))
        done ;;
      *)
        for size in $SIZES; do
          TOTAL=$((TOTAL + 1))
        done ;;
    esac
  done
done
echo "Total benchmark jobs: $TOTAL"
echo ""

if $DRY_RUN; then
  echo "──── DRY RUN ────"
fi

# ─── Execute ───
JOB=0
START_TIME=$(date +%s)

for tool in $TOOLS; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Tool: $tool"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  for metric in $METRICS; do
    # Determine which sizes for this metric
    METRIC_SIZES="$SIZES"
    METRIC_RUNS="$COLD_RUNS"
    case "$metric" in
      M1|M4)
        [[ ! " $HMR_TOOLS " =~ " $tool " ]] && continue
        METRIC_SIZES="$M3_M4_SIZES"
        METRIC_RUNS="$HMR_RUNS"
        ;;
      M3)
        METRIC_SIZES="$M3_M4_SIZES"
        METRIC_RUNS="$HMR_RUNS"
        ;;
    esac

    for size in $METRIC_SIZES; do
      # Skip sizes not in our target list
      [[ ! " $SIZES " =~ " $size " ]] && continue

      JOB=$((JOB + 1))
      echo ""
      echo "  [$JOB/$TOTAL] $tool × $size × $metric ($METRIC_RUNS runs)"

      if $DRY_RUN; then
        echo "    → SKIP (dry run)"
        continue
      fi

      # Check project is set up for this tool
      PROJECT="$ROOT/tier1-synthetic/projects/$size"
      if [[ ! -d "$PROJECT/node_modules" ]]; then
        echo "    ⚠️  Project not set up. Setting up $tool for $size..."
        bash "$ROOT/configs/setup-tool.sh" "$tool" "tier1-synthetic/projects/$size" 2>&1 | tail -2
      fi

      # Run the benchmark
      bash "$SCRIPT_DIR/run-single.sh" \
        --tool "$tool" \
        --size "$size" \
        --metric "$metric" \
        --runs "$METRIC_RUNS" 2>&1 | sed 's/^/    /'

      # Progress report
      ELAPSED=$(( $(date +%s) - START_TIME ))
      RATE=$(echo "scale=1; $ELAPSED / $JOB" | bc)
      REMAINING=$(echo "scale=0; ($TOTAL - $JOB) * $RATE" | bc | cut -d. -f1)
      echo "    ⏱️  ${ELAPSED}s elapsed, ~${REMAINING}s remaining"
    done
  done
done

TOTAL_TIME=$(( $(date +%s) - START_TIME ))
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ All benchmarks complete!                    ║"
echo "║   Total time: ${TOTAL_TIME}s                     ║"
echo "║   Results in: results/tier1-raw/                 ║"
echo "╚══════════════════════════════════════════════════╝"
