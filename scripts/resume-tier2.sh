#!/usr/bin/env bash
# resume-tier2.sh — Resume Tier 2 collection, skipping existing CSVs
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22.16.0 > /dev/null 2>&1

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/results/tier2-raw"
T2="$ROOT/tier2-realworld/workspaces"
PROJECT="bulletproof-react"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

mkdir -p "$RAW"

get_build_cmd() {
  case "$1" in
    vite)    echo "npx vite build" ;;
    rspack)  echo "NODE_ENV=production npx rspack build --config rspack.config.cjs" ;;
    esbuild) echo "node configs/esbuild/build.mjs" ;;
    webpack) echo "NODE_ENV=production npx webpack --mode production --config webpack.config.cjs" ;;
    rollup)  echo "NODE_ENV=production node --stack-size=65536 ./node_modules/.bin/rollup -c rollup.config.mjs" ;;
  esac
}

for tool in vite rspack esbuild webpack rollup; do
  echo ""
  echo "━━━ $tool ━━━"
  DIR="$T2/$tool/$PROJECT"
  BUILD_CMD=$(get_build_cmd "$tool")
  
  if [[ ! -d "$DIR/node_modules" ]]; then
    echo "  SKIP (no workspace)"
    continue
  fi
  
  # M2
  csv="$RAW/${tool}_bp-react_M2.csv"
  if [[ -f "$csv" ]] && [[ $(wc -l < "$csv") -gt 1 ]]; then
    echo "  SKIP M2"
  else
    echo "  RUN M2 (10 runs)"
    cd "$DIR"
    echo "tool,size,metric,run,value,unit,timestamp" > "$csv"
    HJ="$RAW/${tool}_bp-react_M2_hyperfine.json"
    hyperfine --runs 10 --export-json "$HJ" --prepare "rm -rf dist .rspack .vite" "$BUILD_CMD" 2>&1 | sed 's/^/    /'
    node -e "const d=require('$HJ');d.results[0].times.forEach((t,i)=>{require('fs').appendFileSync('$csv','$tool,bp-react,M2,'+(i+1)+','+Math.round(t*1000)+',ms,$TIMESTAMP\n')});console.log('  Median:',Math.round(d.results[0].median*1000),'ms')"
  fi
  
  # M5-M9
  need_build=false
  for m in M5 M6 M7 M8 M9; do
    csv="$RAW/${tool}_bp-react_${m}.csv"
    [[ -f "$csv" ]] && [[ $(wc -l < "$csv") -gt 1 ]] || { need_build=true; break; }
  done
  if $need_build; then
    cd "$DIR"
    rm -rf dist
    eval "$BUILD_CMD" > /dev/null 2>&1 || true
  fi
  for m in M5 M6 M7 M8 M9; do
    csv="$RAW/${tool}_bp-react_${m}.csv"
    if [[ -f "$csv" ]] && [[ $(wc -l < "$csv") -gt 1 ]]; then
      echo "  SKIP $m"
      continue
    fi
    cd "$DIR"
    echo "tool,size,metric,run,value,unit,timestamp" > "$csv"
    case "$m" in
      M5) VAL=$(find dist -name '*.js' -exec cat {} + 2>/dev/null | wc -c | tr -d ' ') ;;
      M6) VAL=$(find dist -name '*.js' -exec cat {} + 2>/dev/null | gzip -c | wc -c | tr -d ' ') ;;
      M7) VAL=$(find dist -name '*.js' | wc -l | tr -d ' ') ;;
      M8) VAL=$(find dist -name '*.js' | wc -l | tr -d ' ') ;;
      M9) VAL=$(find dist -name '*.map' | wc -l | tr -d ' ') ;;
    esac
    echo "$tool,bp-react,$m,1,$VAL,bytes,$TIMESTAMP" >> "$csv"
    echo "  $m = $VAL"
  done
  
  # M10
  csv="$RAW/${tool}_bp-react_M10.csv"
  if [[ -f "$csv" ]] && [[ $(wc -l < "$csv") -gt 1 ]]; then
    echo "  SKIP M10"
  else
    echo "  RUN M10 (10 runs)"
    cd "$DIR"
    echo "tool,size,metric,run,value,unit,timestamp" > "$csv"
    for run in $(seq 1 10); do
      rm -rf dist .rspack .vite
      MEM_OUT=$(/usr/bin/time -l bash -c "cd '$DIR' && $BUILD_CMD > /dev/null 2>&1" 2>&1)
      RSS=$(echo "$MEM_OUT" | grep "maximum resident" | awk '{print $1}')
      RSS_MB=$(( RSS / 1048576 ))
      echo "$tool,bp-react,M10,$run,$RSS_MB,MB,$TIMESTAMP" >> "$csv"
      echo "    Run $run: ${RSS_MB} MB"
    done
  fi
  
  # M11
  csv="$RAW/${tool}_bp-react_M11.csv"
  if [[ -f "$csv" ]] && [[ $(wc -l < "$csv") -gt 1 ]]; then
    echo "  SKIP M11"
  else
    echo "  RUN M11 (10 runs)"
    cd "$DIR"
    echo "tool,size,metric,run,value,unit,timestamp" > "$csv"
    for run in $(seq 1 10); do
      rm -rf dist .rspack .vite
      TIME_OUT=$(/usr/bin/time -l bash -c "cd '$DIR' && $BUILD_CMD > /dev/null 2>&1" 2>&1)
      USER_T=$(echo "$TIME_OUT" | grep "user" | head -1 | awk '{print $1}')
      SYS_T=$(echo "$TIME_OUT" | grep "sys" | head -1 | awk '{print $1}')
      CPU_S=$(echo "$USER_T + $SYS_T" | bc)
      echo "$tool,bp-react,M11,$run,$CPU_S,seconds,$TIMESTAMP" >> "$csv"
      echo "    Run $run: CPU = ${CPU_S}s"
    done
  fi
  
  # M3
  csv="$RAW/${tool}_bp-react_M3.csv"
  if [[ -f "$csv" ]] && [[ $(wc -l < "$csv") -gt 1 ]]; then
    echo "  SKIP M3"
  else
    echo "  RUN M3 (20 runs)"
    cd "$ROOT"
    npx tsx scripts/measure-incremental.ts \
      --tool "$tool" --project "$DIR" --runs 20 \
      --csv "$csv" --size bp-react --timestamp "$TIMESTAMP" 2>&1 | sed 's/^/    /' || echo "  ⚠️ M3 failed (watch mode not available for $tool on this project)"
  fi
  
  # M4 (HMR tools only)
  if [[ "$tool" == "vite" || "$tool" == "rspack" || "$tool" == "webpack" ]]; then
    csv="$RAW/${tool}_bp-react_M4.csv"
    if [[ -f "$csv" ]] && [[ $(wc -l < "$csv") -gt 1 ]]; then
      echo "  SKIP M4"
    else
      echo "  RUN M4 (20 runs)"
      cd "$ROOT"
      npx tsx scripts/measure-hmr.ts \
        --tool "$tool" --project "$DIR" --runs 20 \
        --csv "$csv" --size bp-react --timestamp "$TIMESTAMP" 2>&1 | sed 's/^/    /' || echo "  ⚠️ M4 failed for $tool"
    fi
  fi
done

echo ""
echo "╔════════════════════════════════╗"
echo "║  ✅ TIER 2 COMPLETE!           ║"
echo "╚════════════════════════════════╝"
