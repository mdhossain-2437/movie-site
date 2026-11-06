#!/usr/bin/env bash
# Idempotent Pilot Host Bootstrap for boxd `dark-crow` (Ubuntu 24.04 · fra)
# Run ONLY after human sign-off per AGENTS.md §1.5.

set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/cinematic-graphite}"
QUARANTINE_DIR="${QUARANTINE_DIR:-/var/tmp/cg-quarantine}"

echo "[bootstrap] Checking host architecture & resources..."
uname -a
nproc
free -h
df -h /

if ! command -v docker >/dev/null 2>&1; then
  echo "[bootstrap] ERROR: Docker Engine is required on pilot host." >&2
  exit 1
fi

docker --version
docker compose version

echo "[bootstrap] Creating hardened application directories under ${APP_ROOT}..."
sudo mkdir -p "${APP_ROOT}/backups" "${APP_ROOT}/releases" "${QUARANTINE_DIR}"
sudo chmod 700 "${APP_ROOT}/backups" "${QUARANTINE_DIR}"
sudo chown -R "$(id -u):$(id -g)" "${APP_ROOT}"

if command -v ufw >/dev/null 2>&1; then
  echo "[bootstrap] Ensuring UFW permits SSH (22), HTTP (80), and HTTPS (443) only..."
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  echo "[bootstrap] Review firewall rules with 'sudo ufw status verbose' before enabling."
fi

echo "[bootstrap] Host directories and preflight checks completed cleanly."
