#!/usr/bin/env bash
# From your laptop: verify git push, then SSH to eyesense and run deploy-eyesense.sh
#
# Usage:
#   git commit … && git push
#   ./scripts/trigger-eyesense-deploy.sh
#
# Options:
#   DEPLOY_SKIP_GIT_CHECK=1
#   DEPLOY_SKIP_SOCIAL_CHECK=1
#   EYESENSE_HOST=eyesense
#   EYESENSE_REMOTE_DIR=debate-fact-checker

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${EYESENSE_HOST:-eyesense}"
REMOTE_DIR="${EYESENSE_REMOTE_DIR:-debate-fact-checker}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"

cd "$ROOT"

if [ "${DEPLOY_SKIP_GIT_CHECK:-}" != "1" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "Uncommitted changes — commit and push first:" >&2
    git status --short >&2
    exit 1
  fi
  git fetch "$GIT_REMOTE" "$GIT_BRANCH"
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse "$GIT_REMOTE/$GIT_BRANCH")" ]; then
    echo "Push to $GIT_REMOTE/$GIT_BRANCH before deploy:" >&2
    echo "  git push $GIT_REMOTE $GIT_BRANCH" >&2
    exit 1
  fi
  echo "Git OK: $(git rev-parse --short HEAD) on $GIT_REMOTE/$GIT_BRANCH"
fi


# Social link-preview + app icon (see llm-ocr/scripts/check-eyesense-social-assets.sh)
_eyesense_social_lib="" _search_dir="$ROOT"
while [ "$_search_dir" != "/" ]; do
  if [ -f "$_search_dir/scripts/lib/eyesense-social-preflight.sh" ]; then
    _eyesense_social_lib="$_search_dir/scripts/lib/eyesense-social-preflight.sh"
    break
  fi
  _search_dir="$(dirname "$_search_dir")"
done
if [ -z "$_eyesense_social_lib" ] && [ -f "$HOME/llm-ocr/scripts/lib/eyesense-social-preflight.sh" ]; then
  _eyesense_social_lib="$HOME/llm-ocr/scripts/lib/eyesense-social-preflight.sh"
fi
if [ -n "$_eyesense_social_lib" ]; then
  # shellcheck source=/dev/null
  source "$_eyesense_social_lib"
  ensure_eyesense_social_assets "$ROOT"
fi

REPO_URL="$(git remote get-url "$GIT_REMOTE")"


ensure_verizon_port_forward() {
  if [ "${DEPLOY_SKIP_PORT_FORWARD:-}" = "1" ]; then
    echo "Skipping Verizon port forward (DEPLOY_SKIP_PORT_FORWARD=1)"
    return 0
  fi
  local forward_helper="" search_dir="$ROOT"
  while [ "$search_dir" != "/" ]; do
    if [ -f "$search_dir/scripts/ensure-verizon-port-forward.sh" ]; then
      forward_helper="$search_dir/scripts/ensure-verizon-port-forward.sh"
      break
    fi
    search_dir="$(dirname "$search_dir")"
  done
  if [ -z "$forward_helper" ] && [ -f "$HOME/llm-ocr/scripts/ensure-verizon-port-forward.sh" ]; then
    forward_helper="$HOME/llm-ocr/scripts/ensure-verizon-port-forward.sh"
  fi
  if [ -z "$forward_helper" ]; then
    echo "Verizon port-forward helper not found. Set DEPLOY_SKIP_PORT_FORWARD=1 to skip." >&2
    exit 1
  fi
  local args=(--name "$REMOTE_DIR")
  if [ -n "${EYESENSE_FORWARD_PORT:-}" ]; then
    args+=(--port "$EYESENSE_FORWARD_PORT")
  fi
  if [ -n "${EYESENSE_FORWARD_DEST_PORT:-}" ]; then
    args+=(--dest-port "$EYESENSE_FORWARD_DEST_PORT")
  fi
  bash "$forward_helper" "${args[@]}"
}

ensure_verizon_port_forward

ssh "$HOST" bash -s <<EOF
set -euo pipefail
REMOTE_DIR="\$HOME/${REMOTE_DIR}"
REPO_URL='$REPO_URL'
GIT_BRANCH='$GIT_BRANCH'

if [ ! -d "\$REMOTE_DIR/.git" ]; then
  echo "First-time setup: cloning \$REPO_URL ..."
  git clone --branch "\$GIT_BRANCH" "\$REPO_URL" "\$REMOTE_DIR"
fi

cd "\$REMOTE_DIR"
chmod +x scripts/deploy-eyesense.sh scripts/eyesense-status.sh scripts/eyesense-logs.sh redeploy.sh 2>/dev/null || true
exec ./scripts/deploy-eyesense.sh
EOF
