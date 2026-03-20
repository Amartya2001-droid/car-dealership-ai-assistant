#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

printf 'Rebuilding dashboard bundle...\n'
npm run dashboard:build

printf 'Verifying backend-served dashboard route...\n'
npm run dashboard:check

printf 'Dashboard bundle refreshed successfully.\n'
