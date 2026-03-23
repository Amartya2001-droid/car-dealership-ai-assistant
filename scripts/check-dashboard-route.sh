#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

printf 'Checking backend health at %s/health\n' "$BASE_URL"
curl -fsS "$BASE_URL/health" >/dev/null

printf 'Checking dashboard readiness at %s/admin/dashboard-readiness\n' "$BASE_URL"
curl -fsS "$BASE_URL/admin/dashboard-readiness" >/dev/null

printf 'Checking built dashboard route at %s/ops-dashboard/\n' "$BASE_URL"
curl -fsSI "$BASE_URL/ops-dashboard/" >/dev/null

printf 'Dashboard route check passed for %s\n' "$BASE_URL"
