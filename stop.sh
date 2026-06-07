#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.dev-server.pid"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping Next.js dev server (PID $PID)..."
    kill "$PID" || true
  fi
  rm -f "$PID_FILE"
fi

cd "$ROOT_DIR"
echo "Stopping Postgres container..."
docker compose down

echo "Debate Fact Checker stopped."
