#!/usr/bin/env bash
# Pilot Health, DiskHeadroom & Container Readiness Verification

set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/v1/health}"
MIN_FREE_DISK_PCT="${MIN_FREE_DISK_PCT:-15}"

echo "[healthcheck] Checking root filesystem free space..."
USED_PCT="$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')"
FREE_PCT=$((100 - USED_PCT))
if (( FREE_PCT < MIN_FREE_DISK_PCT )); then
  echo "[healthcheck] FAIL: Free disk (${FREE_PCT}%) is below safety floor (${MIN_FREE_DISK_PCT}%)." >&2
  exit 1
fi
echo "[healthcheck] Disk headroom OK (${FREE_PCT}% free)."

echo "[healthcheck] Probing ${HEALTH_URL}..."
for attempt in {1..10}; do
  if RESPONSE="$(curl -fsS --max-time 5 "${HEALTH_URL}" 2>/dev/null)"; then
    if echo "${RESPONSE}" | grep -q '"status":"ok"'; then
      echo "[healthcheck] PASS: Application health endpoint reported status=ok."
      exit 0
    fi
  fi
  sleep 2
done

echo "[healthcheck] FAIL: Application did not report healthy within retry window." >&2
exit 1
