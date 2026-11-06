#!/usr/bin/env bash
# Staged Pilot Deployment Script for Cinematic Graphite (`dark-crow` control plane)
# Requires explicit human sign-off (CONFIRM_PRODUCTION_DEPLOY=yes) per AGENTS.md §1.5.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/infra/compose/prod.pilot.yml"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env.production}"

if [[ "${CONFIRM_PRODUCTION_DEPLOY:-no}" != "yes" ]]; then
  echo "[deploy] Refusing unapproved live deployment. Set CONFIRM_PRODUCTION_DEPLOY=yes after human sign-off." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[deploy] Missing ${ENV_FILE}. Copy .env.example and populate production secrets first." >&2
  exit 1
fi

export ENV_FILE
export IMAGE_TAG="${IMAGE_TAG:-$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo pilot)}"

echo "[deploy] Building immutable pilot image cinematic-graphite-web:${IMAGE_TAG}..."
docker compose -f "${COMPOSE_FILE}" build web

echo "[deploy] Starting internal database and cache..."
docker compose -f "${COMPOSE_FILE}" up -d postgres redis

echo "[deploy] Applying expand-safe Drizzle PostgreSQL migrations..."
docker compose -f "${COMPOSE_FILE}" run --rm --no-deps web pnpm db:migrate

echo "[deploy] Rolling out web, worker, and Caddy reverse proxy..."
docker compose -f "${COMPOSE_FILE}" up -d web worker caddy

echo "[deploy] Running post-deploy health gate..."
"${SCRIPT_DIR}/healthcheck.sh"

echo "[deploy] Pilot deployment succeeded at tag ${IMAGE_TAG}."
