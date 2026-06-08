#!/usr/bin/env bash
set -euo pipefail
LINES="${1:-80}"
HOST="${EYESENSE_HOST:-eyesense}"
REMOTE_DIR="${EYESENSE_REMOTE_DIR:-debate-fact-checker}"
ssh "$HOST" "cd ~/${REMOTE_DIR} && docker compose -f docker-compose.yml -f docker-compose.prod.yml logs web --tail ${LINES}"
