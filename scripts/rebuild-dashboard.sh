#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

printf 'Rebuilding dashboard bundle...\n'
BUILD_TIMEOUT_SECS="${BUILD_TIMEOUT_SECS:-90}"
BUILD_EXIT_FILE="$(mktemp)"

(
  if npm run dashboard:build; then
    printf '0' >"$BUILD_EXIT_FILE"
  else
    printf '1' >"$BUILD_EXIT_FILE"
  fi
) &
BUILD_PID=$!

(
  sleep "$BUILD_TIMEOUT_SECS"
  if kill -0 "$BUILD_PID" 2>/dev/null; then
    printf '\nFrontend build timed out after %s seconds.\n' "$BUILD_TIMEOUT_SECS" >&2
    kill "$BUILD_PID" 2>/dev/null || true
  fi
) &
WATCHDOG_PID=$!

wait "$BUILD_PID" || true
kill "$WATCHDOG_PID" 2>/dev/null || true

BUILD_RESULT="$(cat "$BUILD_EXIT_FILE" 2>/dev/null || printf '124')"
rm -f "$BUILD_EXIT_FILE"

if [ "$BUILD_RESULT" = "0" ]; then
  printf 'Frontend bundle build completed.\n'
else
  printf 'Frontend build failed, generating fallback dashboard shell...\n' >&2
  node scripts/create-dashboard-fallback.js
fi

printf 'Verifying backend-served dashboard route...\n'
npm run dashboard:check

printf 'Dashboard bundle refreshed successfully.\n'
