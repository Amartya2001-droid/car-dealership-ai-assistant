#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

curl -s "$BASE_URL/health"
echo
curl -s -X POST "$BASE_URL/simulate/call" \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"+19025551212",
    "callerName":"Taylor",
    "message":"I need a compact SUV under $40000 and call me in the afternoon",
    "persona":"concierge",
    "optInFollowUp":true
  }'
echo
