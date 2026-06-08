#!/usr/bin/env bash
set -euo pipefail
HOST="${EYESENSE_HOST:-eyesense}"
REMOTE_DIR="${EYESENSE_REMOTE_DIR:-debate-fact-checker}"
ssh "$HOST" bash -s <<EOF
set -euo pipefail
cd "\$HOME/${REMOTE_DIR}" 2>/dev/null || { echo "No ~/debate-fact-checker on eyesense"; exit 1; }
echo "=== docker ps (debate-fact-checker) ==="
docker ps --filter name=debate-fact-checker --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker ps --filter name=dfc-postgres --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo
echo "=== HTTP localhost:8912 ==="
curl -sI -m 5 http://127.0.0.1:8912/ | head -5 || echo "not responding"
echo
echo "=== git ==="
git rev-parse --short HEAD 2>/dev/null; git log -1 --oneline 2>/dev/null || true
EOF
