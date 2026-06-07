#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT_DIR/web"
PID_FILE="$ROOT_DIR/.dev-server.pid"
LOG_FILE="$ROOT_DIR/.dev-server.log"

read_env_value() {
  local key="$1"
  local file="$2"
  local default="$3"
  if [[ -f "$file" ]]; then
    local line
    line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
    if [[ -n "$line" ]]; then
      echo "${line#*=}" | tr -d ' "' | tr -d "'"
      return
    fi
  fi
  echo "$default"
}

cd "$ROOT_DIR"

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "$HOME/.nvm/nvm.sh"
  nvm use 20 >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || nvm use 23 >/dev/null 2>&1 || true
fi

if [[ -f "$ROOT_DIR/.env" ]]; then
  cp "$ROOT_DIR/.env" "$WEB_DIR/.env"
elif [[ ! -f "$WEB_DIR/.env" ]]; then
  cp "$ROOT_DIR/.env.example" "$WEB_DIR/.env"
  echo "Created web/.env from .env.example"
fi

DFC_APP_PORT="$(read_env_value DFC_APP_PORT "$WEB_DIR/.env" 3847)"
DFC_POSTGRES_PORT="$(read_env_value DFC_POSTGRES_PORT "$WEB_DIR/.env" 5487)"
export PORT="$(read_env_value PORT "$WEB_DIR/.env" "$DFC_APP_PORT")"
export DFC_POSTGRES_PORT

echo "Starting Postgres on localhost:${DFC_POSTGRES_PORT}..."
docker compose up -d postgres

echo "Waiting for Postgres to become healthy..."
for _ in {1..30}; do
  if docker compose exec -T postgres pg_isready -U dfc -d debate_fact_checker >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

cd "$WEB_DIR"
npm install
npx prisma generate
npx prisma db push

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Next.js dev server already running (PID $(cat "$PID_FILE"))."
else
  echo "Starting Next.js dev server on http://localhost:${PORT}"
  nohup npm run dev >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
fi

OPENAI_KEY="$(read_env_value OPENAI_API_KEY "$WEB_DIR/.env" "")"
TAVILY_KEY="$(read_env_value TAVILY_API_KEY "$WEB_DIR/.env" "")"

echo ""
echo "Debate Fact Checker is up."
echo "  App:      http://localhost:${PORT}"
echo "  Postgres: localhost:${DFC_POSTGRES_PORT}"
echo "  Logs:     $LOG_FILE"
echo ""
echo "  Quick scan:  http://localhost:${PORT}  (no API keys needed)"
echo "  Agent mode:  http://localhost:${PORT}/agent"

if [[ -z "$OPENAI_KEY" || "$OPENAI_KEY" == "sk-..." ]]; then
  echo ""
  echo "  ⚠ OPENAI_API_KEY not set — agent mode disabled."
  echo "    Get a key: https://platform.openai.com/api-keys"
fi
if [[ -z "$TAVILY_KEY" || "$TAVILY_KEY" == "tvly-..." ]]; then
  echo ""
  echo "  ⚠ TAVILY_API_KEY not set — agent web search/read disabled."
  echo "    Get a key: https://tavily.com"
fi
if [[ (-z "$OPENAI_KEY" || "$OPENAI_KEY" == "sk-...") || (-z "$TAVILY_KEY" || "$TAVILY_KEY" == "tvly-...") ]]; then
  echo ""
  echo "  Add both keys to .env, then: ./stop.sh && ./start.sh"
fi

echo ""
echo "Run ./stop.sh to shut down."
