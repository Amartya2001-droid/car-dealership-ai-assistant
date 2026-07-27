#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf 'Git health check for %s\n' "$ROOT_DIR"

if pgrep -f "git (add|status|commit|diff)" >/dev/null 2>&1; then
  echo 'warning: git operation still running:'
  ps -axo pid,etime,command | grep -E 'git (add|status|commit|diff)' | grep -v grep || true
else
  echo 'ok: no long-running git add/status/commit/diff process found'
fi

if [ -f .git/index.lock ]; then
  echo 'warning: .git/index.lock exists'
else
  echo 'ok: no .git/index.lock file present'
fi

for dir in node_modules frontend/node_modules .miniforge .venv .cache coverage dist; do
  if [ -e "$dir" ]; then
    if git check-ignore -q "$dir"; then
      echo "ok: $dir is ignored"
    else
      echo "warning: $dir exists but is not ignored"
    fi
  fi
done
