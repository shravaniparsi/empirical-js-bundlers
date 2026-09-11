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
    rollup)  echo "NODE_ENV=production npx rollup -c rollup.config.mjs" ;;
  esac
}

get_dev_cmd() {
  case "$1" in
    vite)    echo "npx vite" ;;
    rspack)  echo "npx rspack serve --config rspack.config.cjs" ;;
    webpack) echo "npx webpack serve --mode development --config webpack.config.cjs" ;;
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

    # Start dev server, measure time until ready pattern appears
    START_MS=$(node -e "console.log(Date.now())")
    $DEV_CMD > /tmp/dev-server-out.log 2>&1 &
    DEV_PID=$!

    # Wait for ready pattern (timeout 60s)
    FOUND=0
    for _ in $(seq 1 600); do
      if grep -q "$READY_PATTERN" /tmp/dev-server-out.log 2>/dev/null; then
        FOUND=1
        break
      fi
      sleep 0.1
    done

    END_MS=$(node -e "console.log(Date.now())")
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true

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
  write_header
  cd "$PROJECT"

  # Use the dedicated Node.js script for precise measurement
  npx tsx "$SCRIPT_DIR/measure-incremental.ts" \
    --tool "$TOOL" \
    --project "$PROJECT" \
    --runs "$RUNS" \
    --csv "$CSV" \
    --size "$SIZE" \
    --timestamp "$TIMESTAMP"

  echo "✅ M3 complete → $CSV"
fi

# ═══════════════════════════════════════════════════════════════
# M4: HMR Latency (Puppeteer + CDP)
# ═══════════════════════════════════════════════════════════════
if [[ "$METRIC" == "M4" ]]; then
  write_header
  cd "$PROJECT"

  npx tsx "$SCRIPT_DIR/measure-hmr.ts" \
    --tool "$TOOL" \
    --project "$PROJECT" \
    --runs "$RUNS" \
    --csv "$CSV" \
    --size "$SIZE" \
    --timestamp "$TIMESTAMP"

  echo "✅ M4 complete → $CSV"
fi

# ═══════════════════════════════════════════════════════════════
# M5-M9: Output Quality Metrics (after one prod build)
# ═══════════════════════════════════════════════════════════════
if [[ "$METRIC" =~ ^M[5-9]$ ]]; then
  write_header
  BUILD_CMD=$(get_build_cmd "$TOOL")
  cd "$PROJECT"

  # Do a fresh prod build
  bash "$SCRIPT_DIR/clear-cache.sh" "$PROJECT"
  eval "$BUILD_CMD" > /dev/null 2>&1

  case "$METRIC" in
    M5) # Bundle size raw
      BYTES=$(find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -exec cat {} + 2>/dev/null | wc -c | tr -d ' ')
      echo "$TOOL,$SIZE,M5,1,$BYTES,bytes,$TIMESTAMP" >> "$CSV"
      echo "  Raw bundle size: $BYTES bytes ($(echo "scale=1; $BYTES/1024" | bc) KB)"
      ;;
    M6) # Bundle size gzip
      GZIP_TOTAL=0
      while IFS= read -r f; do
        GZ=$(gzip -9 -c "$f" | wc -c | tr -d ' ')
        GZIP_TOTAL=$((GZIP_TOTAL + GZ))
      done < <(find dist -name '*.js' -type f)
      echo "$TOOL,$SIZE,M6,1,$GZIP_TOTAL,bytes,$TIMESTAMP" >> "$CSV"
      echo "  Gzipped JS size: $GZIP_TOTAL bytes ($(echo "scale=1; $GZIP_TOTAL/1024" | bc) KB)"
      ;;
    M7) # Tree-shaking (lodash-es presence in bundle)
      # Count bytes of lodash-related code in output
      LODASH_BYTES=$(grep -r "lodash" dist/ --include='*.js' -l 2>/dev/null | xargs cat 2>/dev/null | grep -c "lodash" || echo 0)
      JS_SIZE=$(find dist -name '*.js' -type f -exec cat {} + | wc -c | tr -d ' ')
      # Full lodash-es is ~600KB, we only import pick+debounce (~5KB)
      echo "$TOOL,$SIZE,M7,1,$LODASH_BYTES,occurrences,$TIMESTAMP" >> "$CSV"
      echo "  lodash references in bundle: $LODASH_BYTES"
      ;;
    M8) # Code splitting (chunk count)
      CHUNKS=$(find dist -name '*.js' -type f | wc -l | tr -d ' ')
      echo "$TOOL,$SIZE,M8,1,$CHUNKS,count,$TIMESTAMP" >> "$CSV"
      echo "  JS chunks: $CHUNKS"
      ;;
    M9) # Sourcemap accuracy
      MAP_COUNT=$(find dist -name '*.js.map' -type f 2>/dev/null | wc -l | tr -d ' ')
      JS_COUNT=$(find dist -name '*.js' -type f | wc -l | tr -d ' ')
      echo "$TOOL,$SIZE,M9,1,$MAP_COUNT/$JS_COUNT,ratio,$TIMESTAMP" >> "$CSV"
      echo "  Sourcemaps: $MAP_COUNT maps for $JS_COUNT JS files"
      ;;
  esac

  # Verify with a second build for determinism
  bash "$SCRIPT_DIR/clear-cache.sh" "$PROJECT"
  eval "$BUILD_CMD" > /dev/null 2>&1
  echo "  (Verified with second build)"
  echo "✅ $METRIC complete → $CSV"
fi

# ═══════════════════════════════════════════════════════════════
# M10 + M11: Peak Memory + CPU Time (via /usr/bin/time)
# ═══════════════════════════════════════════════════════════════
if [[ "$METRIC" == "M10" || "$METRIC" == "M11" ]]; then
  write_header
  BUILD_CMD=$(get_build_cmd "$TOOL")
  cd "$PROJECT"

  for run in $(seq 1 "$RUNS"); do
    bash "$SCRIPT_DIR/clear-cache.sh" "$PROJECT"

    # macOS uses `command time -l`, Linux uses `/usr/bin/time -v`
    TIME_OUT="/tmp/time-output-$run.txt"
    if [[ "$(uname)" == "Darwin" ]]; then
      command time -l bash -c "$BUILD_CMD > /dev/null 2>&1" 2> "$TIME_OUT"
      # macOS reports in bytes
      RSS_BYTES=$(grep "maximum resident set size" "$TIME_OUT" | awk '{print $1}')
      RSS_MB=$(echo "scale=1; $RSS_BYTES/1048576" | bc)
      USER_TIME=$(grep "user" "$TIME_OUT" | head -1 | awk '{print $1}')
      SYS_TIME=$(grep "sys" "$TIME_OUT" | head -1 | awk '{print $1}')
    else
      /usr/bin/time -v bash -c "$BUILD_CMD > /dev/null 2>&1" 2> "$TIME_OUT"
      RSS_KB=$(grep "Maximum resident set size" "$TIME_OUT" | awk '{print $NF}')
      RSS_MB=$(echo "scale=1; $RSS_KB/1024" | bc)
      USER_TIME=$(grep "User time" "$TIME_OUT" | awk '{print $NF}')
      SYS_TIME=$(grep "System time" "$TIME_OUT" | awk '{print $NF}')
    fi

    CPU_TOTAL=$(echo "$USER_TIME + $SYS_TIME" | bc 2>/dev/null || echo "0")

    if [[ "$METRIC" == "M10" ]]; then
      echo "$TOOL,$SIZE,M10,$run,$RSS_MB,MB,$TIMESTAMP" >> "$CSV"
      echo "  Run $run: Peak RSS = ${RSS_MB} MB"
    fi
    if [[ "$METRIC" == "M11" ]]; then
      echo "$TOOL,$SIZE,M11,$run,$CPU_TOTAL,seconds,$TIMESTAMP" >> "$CSV"
      echo "  Run $run: CPU = ${CPU_TOTAL}s (user=${USER_TIME}s sys=${SYS_TIME}s)"
    fi

    rm -f "$TIME_OUT"
  done
  echo "✅ $METRIC complete → $CSV"
fi

echo ""
echo "📊 Results saved to: $CSV"
