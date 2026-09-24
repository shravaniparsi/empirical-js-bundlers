#!/usr/bin/env bash
#
# run-single.sh — Run a single benchmark: one tool × one project size × one metric
#
# Usage:
#   ./scripts/run-single.sh --tool vite --size xs-50 --metric M2 --runs 10
#
# Metrics:
#   M1  = Dev cold start (tools with dev server: vite, rspack, webpack)
#   M2  = Prod build time (all tools)
#   M3  = Incremental rebuild via watch mode (all tools)
#   M4  = HMR latency via Puppeteer (tools with HMR: vite, rspack, webpack)
#   M5  = Bundle size raw
#   M6  = Bundle size gzip
#   M7  = Tree-shaking effectiveness (lodash-es)
#   M8  = Code splitting (chunk count)
#   M9  = Sourcemap validation
#   M10 = Peak memory RSS
#   M11 = CPU time
#
# Output: Appends rows to results/tier1-raw/<tool>_<size>_<metric>.csv

set -euo pipefail

# ─── Parse arguments ───
TOOL="" ; SIZE="" ; METRIC="" ; RUNS=10
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)   TOOL="$2";   shift 2 ;;
    --size)   SIZE="$2";   shift 2 ;;
    --metric) METRIC="$2"; shift 2 ;;
    --runs)   RUNS="$2";   shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$TOOL" || -z "$SIZE" || -z "$METRIC" ]]; then
  echo "Usage: run-single.sh --tool <tool> --size <size> --metric <M1-M11> [--runs N]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT="$ROOT/tier1-synthetic/workspaces/$TOOL/$SIZE"
RESULTS_DIR="$ROOT/results/tier1-raw"
CSV="$RESULTS_DIR/${TOOL}_${SIZE}_${METRIC}.csv"

mkdir -p "$RESULTS_DIR"

# Validate tool has HMR/dev server for M1/M4
HMR_TOOLS="vite rspack webpack"
if [[ "$METRIC" == "M1" || "$METRIC" == "M4" ]]; then
  if [[ ! " $HMR_TOOLS " =~ " $TOOL " ]]; then
    echo "⚠️  $TOOL does not support $METRIC (no dev server/HMR). Skipping."
    exit 0
  fi
fi

# Check project exists and has node_modules
if [[ ! -d "$PROJECT/node_modules" ]]; then
  echo "❌ $PROJECT/node_modules not found. Run setup-tool.sh first."
  exit 1
fi

echo "🔬 Benchmark: $TOOL × $SIZE × $METRIC ($RUNS runs)"
echo "   Output: $CSV"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ─── Build command for each tool ───
get_build_cmd() {
  case "$1" in
    vite)    echo "npx vite build" ;;
    rspack)  echo "NODE_ENV=production npx rspack build --config rspack.config.cjs" ;;
    esbuild) echo "node configs/esbuild/build.mjs" ;;
    webpack) echo "NODE_ENV=production npx webpack --mode production --config webpack.config.cjs" ;;
    rollup)  echo "NODE_ENV=production node --stack-size=65536 ./node_modules/.bin/rollup -c rollup.config.mjs" ;;
  esac
}

get_dev_cmd() {
  # Use unique ports per tool to avoid EADDRINUSE conflicts
  case "$1" in
    vite)    echo "npx vite --port 5199" ;;
    rspack)  echo "npx rspack serve --config rspack.config.cjs --port 5299" ;;
    webpack) echo "npx webpack serve --mode development --config webpack.config.cjs --port 5399" ;;
  esac
}

get_dev_ready_pattern() {
  case "$1" in
    vite)    echo "Local:" ;;
    rspack)  echo "compiled" ;;
    webpack) echo "compiled" ;;
  esac
}

# ─── CSV header ───
write_header() {
  if [[ ! -f "$CSV" ]]; then
    echo "tool,size,metric,run,value,unit,timestamp" > "$CSV"
  fi
}

# ═══════════════════════════════════════════════════════════════
# M2: Prod Build Time (hyperfine)
# ═══════════════════════════════════════════════════════════════
if [[ "$METRIC" == "M2" ]]; then
  write_header
  BUILD_CMD=$(get_build_cmd "$TOOL")
  CACHE_CMD="$SCRIPT_DIR/clear-cache.sh $PROJECT"
  HYPERFINE_JSON="$RESULTS_DIR/${TOOL}_${SIZE}_M2_hyperfine.json"

  cd "$PROJECT"
  hyperfine \
    --warmup 0 \
    --runs "$RUNS" \
    --prepare "$CACHE_CMD" \
    --export-json "$HYPERFINE_JSON" \
    --shell=bash \
    "$BUILD_CMD" 2>&1

  # Parse hyperfine JSON → CSV rows
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$HYPERFINE_JSON', 'utf-8'));
    const times = data.results[0].times;
    times.forEach((t, i) => {
      const ms = Math.round(t * 1000);
      fs.appendFileSync('$CSV', '$TOOL,$SIZE,M2,' + (i+1) + ',' + ms + ',ms,$TIMESTAMP\n');
    });
    console.log('  Median: ' + Math.round(data.results[0].median * 1000) + ' ms');
    console.log('  StdDev: ' + Math.round(data.results[0].stddev * 1000) + ' ms');
  "
  echo "✅ M2 complete → $CSV"
fi

# ═══════════════════════════════════════════════════════════════
# M1: Dev Cold Start (time until "ready" message)
# ═══════════════════════════════════════════════════════════════
if [[ "$METRIC" == "M1" ]]; then
  write_header
  DEV_CMD=$(get_dev_cmd "$TOOL")
  READY_PATTERN=$(get_dev_ready_pattern "$TOOL")

  cd "$PROJECT"
  for run in $(seq 1 "$RUNS"); do
    bash "$SCRIPT_DIR/clear-cache.sh" "$PROJECT"

    # Kill any leftover dev server from a previous run
    lsof -ti:5199 -ti:5299 -ti:5399 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 1

    # Start dev server, measure time until ready pattern appears
    START_MS=$(node -e "console.log(Date.now())")
    $DEV_CMD > /tmp/dev-server-out.log 2>&1 &
    DEV_PID=$!

    # Wait for ready pattern (timeout 120s)
    FOUND=0
    for _ in $(seq 1 1200); do
      if grep -q "$READY_PATTERN" /tmp/dev-server-out.log 2>/dev/null; then
        FOUND=1
        break
      fi
      sleep 0.1
    done

    END_MS=$(node -e "console.log(Date.now())")
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
    sleep 2  # Ensure port is released before next run

    if [[ "$FOUND" -eq 1 ]]; then
      ELAPSED=$((END_MS - START_MS))
      echo "$TOOL,$SIZE,M1,$run,$ELAPSED,ms,$TIMESTAMP" >> "$CSV"
      echo "  Run $run: ${ELAPSED}ms"
    else
      echo "  Run $run: TIMEOUT (60s)"
      echo "$TOOL,$SIZE,M1,$run,-1,ms,$TIMESTAMP" >> "$CSV"
    fi
  done
  echo "✅ M1 complete → $CSV"
fi

# ═══════════════════════════════════════════════════════════════
# M3: Incremental Rebuild (watch mode, file change → rebuild)
# ═══════════════════════════════════════════════════════════════
if [[ "$METRIC" == "M3" ]]; then
  cd "$PROJECT"

  npx tsx "$SCRIPT_DIR/measure-incremental-validated.ts" \
    --tool "$TOOL" \
    --project "$PROJECT" \
    --runs "$RUNS" \
    --sessions 5 \
    --csv "$CSV" \
    --size "$SIZE" \
    --timestamp "$TIMESTAMP"

  echo "✅ M3 complete → $CSV"
fi

# ═══════════════════════════════════════════════════════════════
# M4: HMR Latency (Puppeteer + CDP)
# ═══════════════════════════════════════════════════════════════
if [[ "$METRIC" == "M4" ]]; then
  cd "$PROJECT"

  npx tsx "$SCRIPT_DIR/measure-hmr-validated.ts" \
    --tool "$TOOL" \
    --project "$PROJECT" \
    --runs "$RUNS" \
    --sessions 5 \
    --csv "$CSV" \
    --size "$SIZE" \
    --timestamp "$TIMESTAMP"

  echo "✅ M4 complete → $CSV"
fi

if [[ "$METRIC" =~ ^(M5|M6|M8|M9)$ ]]; then
  npx tsx "$SCRIPT_DIR/measure-output-quality-validated.ts" \
    --tool "$TOOL" --project "$PROJECT" --size "$SIZE" --runs 5 \
    --resultsDir "$RESULTS_DIR" --timestamp "$TIMESTAMP"
  echo "✅ M5/M6/M8/M9 complete → $RESULTS_DIR"
  exit 0
fi

if [[ "$METRIC" == "M7" ]]; then
  npx tsx "$SCRIPT_DIR/measure-tree-shaking-validated.ts" \
    --tool "$TOOL" --project "$PROJECT" \
    --resultsDir "$RESULTS_DIR" --timestamp "$TIMESTAMP"
  echo "✅ M7 controlled fixture complete → $RESULTS_DIR"
  exit 0
fi

if [[ "$METRIC" =~ ^(M10|M11)$ ]]; then
  npx tsx "$SCRIPT_DIR/measure-build-resources-validated.ts" \
    --tool "$TOOL" --project "$PROJECT" --size "$SIZE" --runs "$RUNS" \
    --resultsDir "$RESULTS_DIR" --timestamp "$TIMESTAMP"
  echo "✅ M2/M10/M11 complete → $RESULTS_DIR"
  exit 0
fi

echo ""
echo "📊 Results saved to: $CSV"
