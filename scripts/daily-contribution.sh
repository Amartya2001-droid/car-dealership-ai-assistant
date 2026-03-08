#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

NOTE="${1:-Daily automation progress update}"
STAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
DAY="$(date +"%Y-%m-%d")"

mkdir -p docs/progress

# Keep a contribution heartbeat so each run has a traceable daily artifact.
echo "${STAMP} | ${NOTE}" >> docs/progress/heartbeat.log

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "chore: daily progress ${DAY}"
else
  git commit --allow-empty -m "chore: daily check-in ${DAY}"
fi

CURRENT_BRANCH="$(git branch --show-current)"
if git remote get-url origin >/dev/null 2>&1; then
  git push origin "$CURRENT_BRANCH"
  echo "Pushed to GitHub: origin/${CURRENT_BRANCH}"
else
  echo "No git remote 'origin' configured yet. Add one with:"
  echo "git remote add origin <your-github-repo-url>"
fi
