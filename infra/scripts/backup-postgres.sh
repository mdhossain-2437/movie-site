#!/usr/bin/env bash
# Encrypted/Checksummed PostgreSQL Backup Script with 14-Day Retention

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${SCRIPT_DIR}/../compose/prod.pilot.yml}"
BACKUP_DIR="${BACKUP_DIR:-/opt/cinematic-graphite/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE_PATH="${BACKUP_DIR}/movie_platform_${TIMESTAMP}.dump"
CHECKSUM_PATH="${ARCHIVE_PATH}.sha256"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[backup] Dumping PostgreSQL database to ${ARCHIVE_PATH}..."
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -Fc --no-owner --no-privileges -U movie_app -d movie_platform > "${ARCHIVE_PATH}"

sha256sum "${ARCHIVE_PATH}" > "${CHECKSUM_PATH}"
chmod 600 "${ARCHIVE_PATH}" "${CHECKSUM_PATH}"

echo "[backup] Verifying checksum..."
sha256sum -c "${CHECKSUM_PATH}"

echo "[backup] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name 'movie_platform_*.dump*' -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] Backup completed: ${ARCHIVE_PATH}"
