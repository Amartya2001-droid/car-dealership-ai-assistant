#!/usr/bin/env bash
# Run against a disposable sample database. Build first with npm run demo:setup.
set -euo pipefail
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
run_dir="$(mktemp -d)"
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf "$run_dir"
}
trap cleanup EXIT
export NORTHSTAR_DEMO_DIR="$run_dir/demo"
export E2E_ACCESS_FILE="$NORTHSTAR_DEMO_DIR/access.json"
export PORT="${E2E_PORT:-3198}"
export APP_BASE_URL="http://localhost:$PORT"
# Refuse an occupied port before launching, rather than testing an unrelated instance.
node -e 'const net=require("node:net"); const s=net.createServer(); s.on("error",()=>{console.error("E2E_PORT is occupied; choose another port.");process.exit(1)});s.listen(Number(process.env.PORT),()=>s.close());'
# Prevent accidental reuse of production credentials or Codespaces origin settings.
unset E2E_STAFF_EMAIL E2E_STAFF_PASSWORD
CODESPACE_NAME='' node scripts/demo.mjs start > "$run_dir/server.log" 2>&1 &
server_pid=$!
ready=false
for attempt in {1..100}; do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo 'The disposable demo failed to start. Check the build and selected port; server logs are private.' >&2
    exit 1
  fi
  if curl --silent --fail "$APP_BASE_URL/api/config" > /dev/null; then ready=true; break; fi
  sleep 0.2
done
if [[ "$ready" != true ]]; then echo 'The disposable demo did not become ready.' >&2; exit 1; fi
mvn --batch-mode -f e2e/pom.xml test "$@"
