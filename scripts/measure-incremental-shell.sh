#!/usr/bin/env bash
#
# measure-incremental-shell.sh - M3 via shell (avoids Node.js spawn issues at large scale)
#
# Usage:
#   ./scripts/measure-incremental-shell.sh --tool esbuild --size xl-5000 --runs 20
#
set -euo pipefail

TOOL="" ; SIZE="" ; RUNS=20
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)  TOOL="$2"; shift 2 ;;
    --size)  SIZE="$2"; shift 2 ;;
    --runs)  RUNS="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT="$ROOT/tier1-synthetic/workspaces/$TOOL/$SIZE"
CSV="$ROOT/results/tier1-raw/${TOOL}_${SIZE}_M3.csv"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOGFILE="/tmp/m3-watch-${TOOL}-${SIZE}.log"

# Determine watch command, ready pattern, and rebuild pattern
case "$TOOL" in
  vite)
    WATCH_CMD="npx vite build --watch"
    READY_PATTERN="watching for file changes"
    REBUILD_PATTERN="built in"
    ;;
  rspack)
    WATCH_CMD="npx rspack build --watch --config rspack.config.cjs"
    READY_PATTERN="compiled"
    REBUILD_PATTERN="compiled"
    ;;
  webpack)
    WATCH_CMD="npx webpack --watch --config webpack.config.cjs"
    READY_PATTERN="compiled successfully"
    REBUILD_PATTERN="compiled successfully"
    ;;
  esbuild)
    WATCH_CMD="node configs/esbuild/watch.mjs"
    READY_PATTERN="initial build finished"
    REBUILD_PATTERN="build finished"
    ;;
  rollup)
    WATCH_CMD="node --stack-size=65536 ./node_modules/.bin/rollup -c rollup.config.mjs -w"
    READY_PATTERN="waiting for changes"
    REBUILD_PATTERN="created dist"
    ;;
  *) echo "Unknown tool: $TOOL"; exit 1 ;;
esac

# Find target file
TARGET=$(find "$PROJECT/src/features" -name '*.tsx' 2>/dev/null | head -1)
if [[ -z "$TARGET" ]]; then
  TARGET=$(find "$PROJECT/src" -name '*.tsx' ! -name 'main.tsx' ! -name 'index.tsx' ! -path '*test*' | head -1)
fi
if [[ -z "$TARGET" ]]; then
  echo "❌ No .tsx target file found in $PROJECT/src"
  exit 1
fi

ORIG=$(cat "$TARGET")
echo "🔬 M3: $TOOL × $SIZE × $RUNS runs"
echo "   Target: $(basename "$TARGET")"
echo "   Watch: $WATCH_CMD"
echo "   Ready: '$READY_PATTERN'"
echo "   Rebuild: '$REBUILD_PATTERN'"

# Write CSV header
echo "tool,size,metric,run,value,unit,timestamp" > "$CSV"

# Determine cooldown based on size
case "$SIZE" in
  xl-*) COOLDOWN=15 ;;
  l-*)  COOLDOWN=5 ;;
  *)    COOLDOWN=2 ;;
esac

# Start watch mode
cd "$PROJECT"
> "$LOGFILE"
$WATCH_CMD >> "$LOGFILE" 2>&1 &
WATCH_PID=$!

echo "   Watch PID: $WATCH_PID"

# Wait for ready pattern (max 300s)
echo -n "   Waiting for ready..."
READY=0
for i in $(seq 1 3000); do
  if grep -q "$READY_PATTERN" "$LOGFILE" 2>/dev/null; then
    READY=1
    break
  fi
  sleep 0.1
done

if [[ "$READY" -eq 0 ]]; then
  echo " TIMEOUT (300s)"
  kill "$WATCH_PID" 2>/dev/null || true
  exit 1
fi
echo " ready at $(echo "scale=1; $i/10" | bc)s"

# Wait extra cooldown after ready
sleep "$COOLDOWN"

# Count how many times the rebuild pattern has appeared so far (from initial build)
BASELINE=$(grep -c "$REBUILD_PATTERN" "$LOGFILE" 2>/dev/null || echo 0)
echo "   Baseline rebuild count: $BASELINE"

# Measurement loop
for run in $(seq 1 "$RUNS"); do
  # Snapshot the current count of rebuild pattern
  PRE_COUNT=$(grep -c "$REBUILD_PATTERN" "$LOGFILE" 2>/dev/null || echo 0)

  # Modify file
  MOD_CONTENT="${ORIG}
// benchmark-run-${run}-$(date +%s)
console.log('ping-${run}');
"
  START_MS=$(python3 -c 'import time; print(int(time.time()*1000))')
  echo "$MOD_CONTENT" > "$TARGET"

  # Wait for rebuild pattern count to increase (max 300s)
  FOUND=0
  for j in $(seq 1 3000); do
    CUR_COUNT=$(grep -c "$REBUILD_PATTERN" "$LOGFILE" 2>/dev/null || echo 0)
    if [[ "$CUR_COUNT" -gt "$PRE_COUNT" ]]; then
      FOUND=1
      break
    fi
    sleep 0.1
  done

  END_MS=$(python3 -c 'import time; print(int(time.time()*1000))')

  if [[ "$FOUND" -eq 1 ]]; then
    ELAPSED=$((END_MS - START_MS))
    echo "$TOOL,$SIZE,M3,$run,$ELAPSED,ms,$TIMESTAMP" >> "$CSV"
    echo "  Run $run/$RUNS: ${ELAPSED}ms"
  else
    echo "$TOOL,$SIZE,M3,$run,-1,ms,$TIMESTAMP" >> "$CSV"
    echo "  Run $run/$RUNS: TIMEOUT (300s)"
  fi

  # Revert file
  echo "$ORIG" > "$TARGET"

  # Wait for revert rebuild
  REVERT_PRE=$(grep -c "$REBUILD_PATTERN" "$LOGFILE" 2>/dev/null || echo 0)
  for k in $(seq 1 3000); do
    REVERT_CUR=$(grep -c "$REBUILD_PATTERN" "$LOGFILE" 2>/dev/null || echo 0)
    if [[ "$REVERT_CUR" -gt "$REVERT_PRE" ]]; then
      break
    fi
    sleep 0.1
  done

  # Cooldown
  sleep "$COOLDOWN"
done

# Cleanup
echo "$ORIG" > "$TARGET"
kill "$WATCH_PID" 2>/dev/null || true
wait "$WATCH_PID" 2>/dev/null || true

echo ""
echo "✅ M3 complete → $CSV"

# Validation
TOTAL=$(tail -n +2 "$CSV" | wc -l | tr -d ' ')
BADS=$(grep -c ",-1," "$CSV" || echo 0)
GOODS=$((TOTAL - BADS))
echo "   Total: $TOTAL, Good: $GOODS, Timeouts: $BADS"
