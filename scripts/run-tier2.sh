#!/usr/bin/env bash
# run-tier2.sh — Run Tier 2 (real-world) benchmarks: Bulletproof React × 5 tools
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
T2_BASE="$ROOT/tier2-realworld/workspaces"
RAW="$ROOT/results/tier2-raw"
RUNS=10
M3_RUNS=20
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PROJECT="bulletproof-react"

export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22.16.0 > /dev/null 2>&1

echo "This legacy runner is disabled because it used incompatible metric definitions." >&2
echo "Use scripts/run-validated-campaign.sh instead." >&2
exit 2

mkdir -p "$RAW"

echo "╔══════════════════════════════════════════════════╗"
echo "║   Tier 2: Real-World Benchmark (Bulletproof React)║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

TOOLS="vite rspack esbuild webpack rollup"
HMR_TOOLS="vite rspack webpack"
PROD_METRICS="M2 M5 M6 M7 M8 M9 M10 M11"
JOB=0
START_TIME=$(date +%s)

# Count jobs: 5 tools × 8 prod metrics + 5 tools × M3 + 3 HMR tools × M1 + 3 HMR tools × M4
TOTAL=$(( 5*8 + 5 + 3 + 3 ))
echo "Total jobs: $TOTAL"
echo ""

get_build_cmd() {
  local tool="$1" dir="$2"
  case "$tool" in
    vite)    echo "npx vite build" ;;
    rspack)  echo "NODE_ENV=production npx rspack build --config rspack.config.cjs" ;;
    esbuild) echo "node configs/esbuild/build.mjs" ;;
    webpack) echo "NODE_ENV=production npx webpack --mode production --config webpack.config.cjs" ;;
    rollup)  echo "NODE_ENV=production node --stack-size=65536 ./node_modules/.bin/rollup -c rollup.config.mjs" ;;
  esac
}

write_header() {
  local csv="$1"
  echo "tool,size,metric,run,value,unit,timestamp" > "$csv"
}

for tool in $TOOLS; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Tool: $tool"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  DIR="$T2_BASE/$tool/$PROJECT"
  if [[ ! -d "$DIR/node_modules" ]]; then
    echo "  ⚠️ Workspace not ready: $DIR"
    continue
  fi
  
  BUILD_CMD=$(get_build_cmd "$tool" "$DIR")
  
  # ── M2: Prod Build Time (via hyperfine) ──
  JOB=$((JOB + 1))
  CSV="$RAW/${tool}_bp-react_M2.csv"
  echo "  [$JOB/$TOTAL] $tool × M2 ($RUNS runs)"
  write_header "$CSV"
  
  cd "$DIR"
  HYPERFINE_JSON="$RAW/${tool}_bp-react_M2_hyperfine.json"
  hyperfine --runs "$RUNS" --export-json "$HYPERFINE_JSON" \
    --prepare "rm -rf dist .rspack .vite" \
    "$BUILD_CMD" 2>&1 | sed 's/^/    /'
  
  # Parse hyperfine JSON
  node -e "
    const d = require('$HYPERFINE_JSON');
    const r = d.results[0];
    r.times.forEach((t, i) => {
      const ms = Math.round(t * 1000);
      require('fs').appendFileSync('$CSV',
        '$tool,bp-react,M2,' + (i+1) + ',' + ms + ',ms,$TIMESTAMP\n');
    });
    console.log('    Median: ' + Math.round(r.median * 1000) + ' ms');
  "
  
  # ── M5-M9: Output quality (single build, then measure) ──
  cd "$DIR"
  rm -rf dist
  eval "$BUILD_CMD" > /dev/null 2>&1 || true
  
  if [[ -d dist ]]; then
    for metric in M5 M6 M7 M8 M9; do
      JOB=$((JOB + 1))
      CSV="$RAW/${tool}_bp-react_${metric}.csv"
      echo "  [$JOB/$TOTAL] $tool × $metric"
      write_header "$CSV"
      
      case "$metric" in
        M5) # Raw bundle size
          SIZE_BYTES=$(find dist -name '*.js' -exec cat {} + 2>/dev/null | wc -c | tr -d ' ')
          echo "$tool,bp-react,M5,1,$SIZE_BYTES,bytes,$TIMESTAMP" >> "$CSV"
          echo "    Raw: ${SIZE_BYTES} bytes"
          ;;
        M6) # Gzip size
          GZIP_BYTES=$(find dist -name '*.js' -exec cat {} + 2>/dev/null | gzip -c | wc -c | tr -d ' ')
          echo "$tool,bp-react,M6,1,$GZIP_BYTES,bytes,$TIMESTAMP" >> "$CSV"
          echo "    Gzip: ${GZIP_BYTES} bytes"
          ;;
        M7) # Tree-shaking (count of JS files)
          JS_COUNT=$(find dist -name '*.js' | wc -l | tr -d ' ')
          echo "$tool,bp-react,M7,1,$JS_COUNT,count,$TIMESTAMP" >> "$CSV"
          echo "    JS files: $JS_COUNT"
          ;;
        M8) # Code splitting (count of chunks)
          CHUNKS=$(find dist -name '*.js' | wc -l | tr -d ' ')
          echo "$tool,bp-react,M8,1,$CHUNKS,count,$TIMESTAMP" >> "$CSV"
          echo "    Chunks: $CHUNKS"
          ;;
        M9) # Sourcemap
          SM_COUNT=$(find dist -name '*.map' | wc -l | tr -d ' ')
          echo "$tool,bp-react,M9,1,$SM_COUNT,count,$TIMESTAMP" >> "$CSV"
          echo "    Sourcemaps: $SM_COUNT"
          ;;
      esac
    done
  else
    echo "    ⚠️ No dist/ — skipping M5-M9"
  fi
  
  # ── M10: Peak Memory ──
  JOB=$((JOB + 1))
  CSV="$RAW/${tool}_bp-react_M10.csv"
  echo "  [$JOB/$TOTAL] $tool × M10 ($RUNS runs)"
  write_header "$CSV"
  
  cd "$DIR"
  for run in $(seq 1 $RUNS); do
    rm -rf dist .rspack .vite
    MEM_OUT=$(/usr/bin/time -l bash -c "cd '$DIR' && $BUILD_CMD > /dev/null 2>&1" 2>&1)
    RSS=$(echo "$MEM_OUT" | grep "maximum resident" | awk '{print $1}')
    RSS_MB=$(( RSS / 1048576 ))
    echo "$tool,bp-react,M10,$run,$RSS_MB,MB,$TIMESTAMP" >> "$CSV"
    echo "    Run $run: ${RSS_MB} MB"
  done
  
  # ── M11: CPU Time ──
  JOB=$((JOB + 1))
  CSV="$RAW/${tool}_bp-react_M11.csv"
  echo "  [$JOB/$TOTAL] $tool × M11 ($RUNS runs)"
  write_header "$CSV"
  
  cd "$DIR"
  for run in $(seq 1 $RUNS); do
    rm -rf dist .rspack .vite
    TIME_OUT=$(/usr/bin/time -l bash -c "cd '$DIR' && $BUILD_CMD > /dev/null 2>&1" 2>&1)
    USER_T=$(echo "$TIME_OUT" | awk '{for(i=2;i<=NF;i++) if($i=="user") print $(i-1)}' | head -1)
    SYS_T=$(echo "$TIME_OUT" | awk '{for(i=2;i<=NF;i++) if($i=="sys") print $(i-1)}' | head -1)
    CPU_S=$(echo "$USER_T + $SYS_T" | bc)
    echo "$tool,bp-react,M11,$run,$CPU_S,seconds,$TIMESTAMP" >> "$CSV"
    echo "    Run $run: CPU = ${CPU_S}s"
  done
  
  # ── M3: Incremental Rebuild ──
  JOB=$((JOB + 1))
  CSV="$RAW/${tool}_bp-react_M3.csv"
  echo "  [$JOB/$TOTAL] $tool × M3 ($M3_RUNS runs)"
  
  cd "$ROOT"
  npx tsx scripts/measure-incremental.ts \
    --tool "$tool" --project "$DIR" --runs "$M3_RUNS" \
    --csv "$CSV" --size bp-react --timestamp "$TIMESTAMP" 2>&1 | sed 's/^/    /'
  
  # ── M1: Dev Cold Start (HMR tools only) ──
  if [[ " $HMR_TOOLS " =~ " $tool " ]]; then
    JOB=$((JOB + 1))
    CSV="$RAW/${tool}_bp-react_M1.csv"
    echo "  [$JOB/$TOTAL] $tool × M1 ($M3_RUNS runs)"
    write_header "$CSV"
    
    cd "$DIR"
    case "$tool" in
      vite) DEV_CMD="npx vite"; READY_PAT="Local:" ;;
      rspack) DEV_CMD="npx rspack serve --config rspack.config.cjs"; READY_PAT="compiled" ;;
      webpack) DEV_CMD="npx webpack serve --mode development --config webpack.config.cjs"; READY_PAT="compiled" ;;
    esac
    
    for run in $(seq 1 $M3_RUNS); do
      START_MS=$(node -e "console.log(Date.now())")
      $DEV_CMD > /tmp/dev-out-$$.log 2>&1 &
      DEV_PID=$!
      
      ELAPSED=-1
      for attempt in $(seq 1 120); do
        sleep 0.5
        if grep -q "$READY_PAT" /tmp/dev-out-$$.log 2>/dev/null; then
          END_MS=$(node -e "console.log(Date.now())")
          ELAPSED=$(( END_MS - START_MS ))
          break
        fi
      done
      
      kill $DEV_PID 2>/dev/null; wait $DEV_PID 2>/dev/null
      rm -f /tmp/dev-out-$$.log
      
      echo "$tool,bp-react,M1,$run,$ELAPSED,ms,$TIMESTAMP" >> "$CSV"
      echo "    Run $run: ${ELAPSED}ms"
      sleep 1
    done
    
    # ── M4: HMR Latency ──
    JOB=$((JOB + 1))
    CSV="$RAW/${tool}_bp-react_M4.csv"
    echo "  [$JOB/$TOTAL] $tool × M4 ($M3_RUNS runs)"
    
    cd "$ROOT"
    npx tsx scripts/measure-hmr.ts \
      --tool "$tool" --project "$DIR" --runs "$M3_RUNS" \
      --csv "$CSV" --size bp-react --timestamp "$TIMESTAMP" 2>&1 | sed 's/^/    /'
  fi
  
  ELAPSED=$(( $(date +%s) - START_TIME ))
  echo "  ⏱️  ${ELAPSED}s elapsed"
  echo ""
done

TOTAL_TIME=$(( $(date +%s) - START_TIME ))
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ Tier 2 complete! Time: ${TOTAL_TIME}s       ║"
echo "╚══════════════════════════════════════════════════╝"
