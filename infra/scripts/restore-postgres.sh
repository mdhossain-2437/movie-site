#!/usr/bin/env bash
# Verified PostgreSQL Restore Drill / Recovery Script
# Requires CONFIRM_DB_RESTORE=yes to prevent accidental data overwrite.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: CONFIRM_DB_RESTORE=yes $0 <path-to-backup.dump>" >&2
  exit 1
fi

ARCHIVE_PATH="$1"
CHECKSUM_PATH="${ARCHIVE_PATH}.sha256"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${SCRIPT_DIR}/../compose/prod.pilot.yml}"
TARGET_DB="${TARGET_DB:-movie_platform}"

if [[ "${CONFIRM_DB_RESTORE:-no}" != "yes" ]]; then
  echo "[restore] Refusing destructive restore without CONFIRM_DB_RESTORE=yes." >&2
  exit 1
fi

if [[ ! -f "${ARCHIVE_PATH}" ]]; then
  echo "[restore] Archive not found: ${ARCHIVE_PATH}" >&2
  exit 1
fi

if [[ -f "${CHECKSUM_PATH}" ]]; then
  echo "[restore] Verifying SHA-256 integrity before restore..."
  sha256sum -c "${CHECKSUM_PATH}"
fi

echo "[restore] Restoring ${ARCHIVE_PATH} into database ${TARGET_DB}..."
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  pg_restore --clean --if-exists --no-owner --no-privileges -U movie_app -d "${TARGET_DB}" < "${ARCHIVE_PATH}"

echo "[restore] Restore completed cleanly into ${TARGET_DB}."
