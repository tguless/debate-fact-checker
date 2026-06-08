#!/usr/bin/env bash
# Deploy Debate Fact Checker on the eyesense home server.
#
# Run ON eyesense after the repo is cloned:
#   ssh eyesense 'cd ~/debate-fact-checker && ./scripts/deploy-eyesense.sh'
#
# One-time server setup:
#   git clone git@github.com:tguless/debate-fact-checker.git ~/debate-fact-checker
#   cd ~/debate-fact-checker && cp .env.example .env.local   # edit keys on server
#
# Prerequisites:
#   - Docker + docker compose
#   - Home router forwards external TCP 8912 (CloudFront origin for debate.paperiq.ai)

set -euo pipefail
cd "$(dirname "$0")/.."

GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
DB_URL="postgresql://dfc:dfc_dev_password@postgres:5432/debate_fact_checker?schema=public"

bootstrap_env() {
  if [ -f .env.local ]; then
    return 0
  fi
  if [ -f "$HOME/patent-researcher/.env.local" ]; then
    echo "Creating .env.local from patent-researcher OpenAI keys..."
    {
      grep -E '^(OPENAI_API_KEY|OPENAI_MODEL|TAVILY_API_KEY|SERPER_API_KEY)=' "$HOME/patent-researcher/.env.local" || true
      echo 'NEXT_PUBLIC_APP_URL=https://debate.paperiq.ai'
      echo 'AGENT_MAX_STEPS=50'
    } > .env.local
    echo "Created .env.local (add TAVILY_API_KEY if missing — required for /agent)."
    return 0
  fi
  echo "Missing .env.local on server." >&2
  echo "  cp .env.example .env.local   # then edit keys on eyesense" >&2
  exit 1
}

bootstrap_env

if [ "${DEPLOY_SKIP_GIT_PULL:-}" != "1" ]; then
  echo "Pulling latest from ${GIT_REMOTE}/${GIT_BRANCH} ..."
  git fetch "$GIT_REMOTE" "$GIT_BRANCH"
  git checkout "$GIT_BRANCH"
  git pull --ff-only "$GIT_REMOTE" "$GIT_BRANCH"
fi

echo "Deploying at $(pwd) @ $(git rev-parse --short HEAD) — $(git log -1 --format=%s)"

export NEXT_PUBLIC_APP_URL="$(grep '^NEXT_PUBLIC_APP_URL=' .env.local | cut -d= -f2- | tr -d '"' || echo 'https://debate.paperiq.ai')"

${COMPOSE} up -d postgres

echo "Waiting for Postgres..."
for _ in $(seq 1 30); do
  if ${COMPOSE} exec -T postgres pg_isready -U dfc -d debate_fact_checker >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Syncing database schema (prisma db push)..."
docker run --rm --network debate-fact-checker_default \
  -v "$PWD/web:/app" -w /app \
  -e DATABASE_URL="$DB_URL" \
  node:20-alpine sh -c "npm ci --ignore-scripts && npx prisma db push"

${COMPOSE} up -d --build web

echo "Waiting for web on :8912..."
for _ in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8912/ >/dev/null 2>&1; then
    echo "Debate Fact Checker is up on http://127.0.0.1:8912"
    echo "Public URL (after CloudFront): https://debate.paperiq.ai"
    exit 0
  fi
  sleep 2
done

echo "WARNING: web did not respond on :8912 — check: ${COMPOSE} logs web --tail 50"
exit 1
