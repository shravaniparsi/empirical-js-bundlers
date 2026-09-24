#!/usr/bin/env bash
#
# Runs repaired metrics into a staging batch. Existing canonical CSVs are never
# overwritten by this script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PHASE="${1:-all}"
BATCH_ID="${BATCH_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
BATCH="$ROOT/results/validated-reruns/$BATCH_ID"
TIER1="$BATCH/tier1"
TIER2="$BATCH/tier2"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "$TIER1" "$TIER2"
touch "$BATCH/.incomplete"

CAMPAIGN_LOCK="$ROOT/.validated-campaign.lock"
if ! mkdir "$CAMPAIGN_LOCK" 2>/dev/null; then
  LOCK_PID="$(cat "$CAMPAIGN_LOCK/pid" 2>/dev/null || true)"
  if [[ "$LOCK_PID" =~ ^[0-9]+$ ]] && kill -0 "$LOCK_PID" 2>/dev/null; then
    echo "Refusing to start: campaign lock is owned by PID $LOCK_PID." >&2
    exit 1
  fi
  rm -rf "$CAMPAIGN_LOCK"
  mkdir "$CAMPAIGN_LOCK"
fi
echo "$$" > "$CAMPAIGN_LOCK/pid"
cleanup_campaign_lock() {
  local status=$?
  trap - EXIT INT TERM
  while IFS= read -r child; do
    kill -TERM "$child" 2>/dev/null || true
  done < <(pgrep -P $$ 2>/dev/null || true)
  wait 2>/dev/null || true
  rm -rf "$CAMPAIGN_LOCK"
  exit "$status"
}
trap cleanup_campaign_lock EXIT INT TERM

if pgrep -f "measure-(incremental|hmr|output-quality|tree-shaking|build-resources)|configs/esbuild/watch|rspack.*(serve|--watch)|webpack.*(serve|--watch)|rollup.*-w|vite.*(--port|--watch)" >/dev/null 2>&1; then
  echo "Refusing to start: another benchmark workspace process is running." >&2
  exit 1
fi
node -e "
const os=require('os');
const [oneMinute,fiveMinute]=os.loadavg(), cpus=os.cpus().length;
if(process.version!=='v22.16.0'){console.error('Refusing to start: expected Node v22.16.0, got '+process.version);process.exit(1)}
if(oneMinute>cpus||fiveMinute>cpus*1.5){
  console.error('Refusing to start: load averages '+oneMinute.toFixed(2)+'/'+fiveMinute.toFixed(2)+' exceed limits '+cpus.toFixed(2)+'/'+(cpus*1.5).toFixed(2));
  process.exit(1)
}
"

cd "$ROOT"
./node_modules/.bin/tsx scripts/verify-workspace-sources.ts

node -e "
const fs=require('fs'),os=require('os'),cp=require('child_process');
const file='$BATCH/manifest.json';
const existing=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
const attempt={
  startedAt:'$TIMESTAMP', phase:'$PHASE', loadAverageAtStart:os.loadavg()
};
fs.writeFileSync(file, JSON.stringify({
  ...existing,
  batchId:'$BATCH_ID', phase:'$PHASE', status:'incomplete', startedAt:existing.startedAt||'$TIMESTAMP',
  sourceVerification:'passed',
  gitCommit:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  node:process.version, platform:process.platform, release:os.release(),
  cpus:os.cpus().length, totalMemoryBytes:os.totalmem(), loadAverageAtStart:os.loadavg(),
  attempts:[...(existing.attempts||[]),attempt]
},null,2)+'\n');
"

csv_complete() {
  local file="$1" expected_rows="$2"
  [[ -f "$file" ]] || return 1
  [[ "$(wc -l < "$file" | tr -d ' ')" -eq $((expected_rows + 1)) ]] || return 1
  ! grep -q ',-1,' "$file"
}

session_complete() {
  local file="$1" session="$2"
  [[ -f "$file" ]] || return 1
  [[ "$(awk -F, -v session="$session" 'NR>1 && $8==session && $5>=0 {count++} END {print count+0}' "$file")" -eq 4 ]]
}

run_complete() {
  local file="$1" run="$2"
  [[ -f "$file" ]] || return 1
  [[ "$(awk -F, -v run="$run" 'NR>1 && $4==run && $5>=0 {count++} END {print count+0}' "$file")" -eq 1 ]]
}

output_complete() {
  local dir="$1" tool="$2" size="$3" metadata
  metadata="$dir/${tool}_${size}_output.meta.json"
  csv_complete "$dir/${tool}_${size}_M5.csv" 1 &&
  csv_complete "$dir/${tool}_${size}_M6.csv" 1 &&
  csv_complete "$dir/${tool}_${size}_M8.csv" 1 &&
  csv_complete "$dir/${tool}_${size}_M9.csv" 1 &&
  [[ -f "$metadata" ]] &&
  node -e "const m=require('$metadata');process.exit(m.metricsAccepted===true&&typeof m.byteForByteDeterministic==='boolean'&&m.sourceRestoration?.probeRestored?0:1)"
}

run_m3() {
  local size tool round position index
  for size in xs-50 s-200 m-500 l-2000 xl-5000; do
    case "$size" in
      xs-50) tools=(vite rspack esbuild webpack rollup) ;;
      s-200) tools=(rspack esbuild webpack rollup vite) ;;
      m-500) tools=(esbuild webpack rollup vite rspack) ;;
      l-2000) tools=(webpack rollup vite rspack esbuild) ;;
      xl-5000) tools=(rollup vite rspack esbuild webpack) ;;
    esac
    for round in 0 1 2 3 4; do
      for position in 0 1 2 3 4; do
        index=$(( (position + round) % 5 ))
        tool="${tools[$index]}"
        if session_complete "$TIER1/${tool}_${size}_M3.csv" $((round + 1)); then
          echo "Skipping complete M3 session: $tool $size session $((round + 1))"
          continue
        fi
        ./node_modules/.bin/tsx scripts/measure-incremental-validated.ts \
          --tool "$tool" --project "tier1-synthetic/workspaces/$tool/$size" \
          --runs 4 --sessions 1 --sessionOffset "$round" --runOffset $((round * 4)) --append true \
          --csv "$TIER1/${tool}_${size}_M3.csv" --size "$size" --timestamp "$TIMESTAMP"
      done
    done
  done
}

run_m4() {
  local size tool round position index
  for size in xs-50 m-500 xl-5000; do
    tools=(vite rspack webpack)
    for round in 0 1 2 3 4; do
      for position in 0 1 2; do
        index=$(( (position + round) % 3 ))
        tool="${tools[$index]}"
        if session_complete "$TIER1/${tool}_${size}_M4.csv" $((round + 1)); then
          echo "Skipping complete M4 session: $tool $size session $((round + 1))"
          continue
        fi
        ./node_modules/.bin/tsx scripts/measure-hmr-validated.ts \
          --tool "$tool" --project "tier1-synthetic/workspaces/$tool/$size" \
          --runs 4 --sessions 1 --sessionOffset "$round" --runOffset $((round * 4)) --append true \
          --csv "$TIER1/${tool}_${size}_M4.csv" --size "$size" --timestamp "$TIMESTAMP"
      done
    done
  done
  tools=(vite rspack webpack)
  for round in 0 1 2 3 4; do
    for position in 0 1 2; do
      index=$(( (position + round) % 3 ))
      tool="${tools[$index]}"
      if session_complete "$TIER2/${tool}_bp-react_M4.csv" $((round + 1)); then
        echo "Skipping complete M4 session: $tool bp-react session $((round + 1))"
        continue
      fi
      ./node_modules/.bin/tsx scripts/measure-hmr-validated.ts \
        --tool "$tool" --project "tier2-realworld/workspaces/$tool/bulletproof-react" \
        --runs 4 --sessions 1 --sessionOffset "$round" --runOffset $((round * 4)) --append true \
        --csv "$TIER2/${tool}_bp-react_M4.csv" --size bp-react --timestamp "$TIMESTAMP"
    done
  done
}

run_output() {
  local size tool
  for size in xs-50 s-200 m-500 l-2000 xl-5000; do
    for tool in vite rspack esbuild webpack rollup; do
      if output_complete "$TIER1" "$tool" "$size"; then
        echo "Skipping complete output metrics: $tool $size"
        continue
      fi
      ./node_modules/.bin/tsx scripts/measure-output-quality-validated.ts \
        --tool "$tool" --project "tier1-synthetic/workspaces/$tool/$size" \
        --size "$size" --runs 5 --resultsDir "$TIER1" --timestamp "$TIMESTAMP"
    done
  done
  for tool in vite rspack esbuild webpack rollup; do
    if output_complete "$TIER2" "$tool" "bp-react"; then
      echo "Skipping complete output metrics: $tool bp-react"
      continue
    fi
    ./node_modules/.bin/tsx scripts/measure-output-quality-validated.ts \
      --tool "$tool" --project "tier2-realworld/workspaces/$tool/bulletproof-react" \
      --size bp-react --runs 5 --resultsDir "$TIER2" --timestamp "$TIMESTAMP"
  done
}

run_resources() {
  local size tool round position index
  for size in xs-50 s-200 m-500 l-2000 xl-5000; do
    case "$size" in
      xs-50) tools=(vite rspack esbuild webpack rollup) ;;
      s-200) tools=(rspack esbuild webpack rollup vite) ;;
      m-500) tools=(esbuild webpack rollup vite rspack) ;;
      l-2000) tools=(webpack rollup vite rspack esbuild) ;;
      xl-5000) tools=(rollup vite rspack esbuild webpack) ;;
    esac
    for round in 0 1 2 3 4 5 6 7 8 9; do
      for position in 0 1 2 3 4; do
        index=$(( (position + round) % 5 ))
        tool="${tools[$index]}"
        if run_complete "$TIER1/${tool}_${size}_M2.csv" $((round + 1)); then
          echo "Skipping complete resource run: $tool $size run $((round + 1))"
          continue
        fi
        ./node_modules/.bin/tsx scripts/measure-build-resources-validated.ts \
          --tool "$tool" --project "tier1-synthetic/workspaces/$tool/$size" \
          --size "$size" --runs 1 --runOffset "$round" --append true \
          --resultsDir "$TIER1" --timestamp "$TIMESTAMP"
      done
    done
  done
  tools=(vite rspack esbuild webpack rollup)
  for round in 0 1 2 3 4 5 6 7 8 9; do
    for position in 0 1 2 3 4; do
      index=$(( (position + round) % 5 ))
      tool="${tools[$index]}"
      if run_complete "$TIER2/${tool}_bp-react_M2.csv" $((round + 1)); then
        echo "Skipping complete resource run: $tool bp-react run $((round + 1))"
        continue
      fi
      ./node_modules/.bin/tsx scripts/measure-build-resources-validated.ts \
        --tool "$tool" --project "tier2-realworld/workspaces/$tool/bulletproof-react" \
        --size bp-react --runs 1 --runOffset "$round" --append true \
        --resultsDir "$TIER2" --timestamp "$TIMESTAMP"
    done
  done
}

run_m7() {
  local tool
  for tool in vite rspack esbuild webpack rollup; do
    if csv_complete "$TIER1/${tool}_tree-shake_M7.csv" 1; then
      echo "Skipping complete M7: $tool"
      continue
    fi
    ./node_modules/.bin/tsx scripts/measure-tree-shaking-validated.ts \
      --tool "$tool" --project "tier1-synthetic/workspaces/$tool/xs-50" \
      --resultsDir "$TIER1" --timestamp "$TIMESTAMP"
  done
}

case "$PHASE" in
  M3) run_m3 ;;
  M4) run_m4 ;;
  output) run_output ;;
  resources) run_resources ;;
  M7) run_m7 ;;
  all) run_m3; run_m4; run_output; run_resources; run_m7 ;;
  *) echo "Usage: $0 [M3|M4|output|resources|M7|all]" >&2; exit 2 ;;
esac

./node_modules/.bin/tsx scripts/validate-measurement-batch.ts "$BATCH"

node -e "
const fs=require('fs');
const p='$BATCH/manifest.json',m=JSON.parse(fs.readFileSync(p));
m.status='validated';
fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
"
./node_modules/.bin/tsx analysis/validated-analysis.ts "$BATCH"
node -e "
const fs=require('fs'),os=require('os');
const p='$BATCH/manifest.json',m=JSON.parse(fs.readFileSync(p));
m.status='complete';m.completedAt=new Date().toISOString();m.loadAverageAtEnd=os.loadavg();
fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
"
rm "$BATCH/.incomplete"
echo "Validated batch complete: $BATCH"
