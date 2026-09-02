#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$WEB_DIR/.." && pwd)"
PAGES_REPO="${PAGES_REPO:-git@sqbu-github-cisco:CBABU/Cisco-live-Eva.git}"
PAGES_ROOT="/pages/CBABU/Cisco-live-Eva"
CHAT_API_URL="${VITE_CHAT_API_URL:-https://cisco-live-eva-llm-proxy.sisun-ai.workers.dev}"
MAX_PUSH_ATTEMPTS=3

usage() {
  cat <<'EOF'
Usage: npm run deploy -- [main|New-MVO|Northstar]

When no target is supplied, the current Git branch name is used. Each target
updates only its own area on gh-pages:

  main       -> /
  New-MVO    -> /New-MVO/
  Northstar  -> /Northstar/
EOF
}

target="${1:-$(git -C "$REPO_DIR" branch --show-current)}"
normalized_target="$(printf '%s' "$target" | tr '[:upper:]' '[:lower:]')"

case "$normalized_target" in
  main)
    target="main"
    publish_dir=""
    base_path="$PAGES_ROOT/"
    direct_routes=()
    ;;
  new-mvo|new_mvo)
    target="New-MVO"
    publish_dir="New-MVO"
    base_path="$PAGES_ROOT/New-MVO/"
    direct_routes=("new-agent")
    ;;
  northstar)
    target="Northstar"
    publish_dir="Northstar"
    base_path="$PAGES_ROOT/Northstar/"
    direct_routes=("new-agent")
    ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    echo "Unsupported Pages target: $target" >&2
    usage >&2
    exit 2
    ;;
esac

for command_name in git npm rsync; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
done

echo "Building $target for $base_path"
(
  cd "$WEB_DIR"
  VITE_BASE_PATH="$base_path" \
    VITE_CHAT_API_URL="$CHAT_API_URL" \
    npm run build
)

if ! grep -Fq "$base_path" "$WEB_DIR/dist/index.html"; then
  echo "Build verification failed: index.html does not contain $base_path" >&2
  exit 1
fi

if [[ "$target" != "main" ]]; then
  for route in "${direct_routes[@]}"; do
    mkdir -p "$WEB_DIR/dist/$route"
    cp "$WEB_DIR/dist/index.html" "$WEB_DIR/dist/$route/index.html"
  done
fi

source_revision="$(git -C "$REPO_DIR" rev-parse --short=8 HEAD)"
temp_root="$(mktemp -d "${TMPDIR:-/tmp}/cisco-live-eva-pages.XXXXXX")"
trap 'rm -rf "$temp_root"' EXIT

stage_target() {
  local site_dir="$1"

  if [[ "$target" == "main" ]]; then
    # Main owns the root, but the demo directories are independently deployed.
    rsync -a --delete \
      --exclude='.git/' \
      --exclude='New-MVO/' \
      --exclude='Northstar/' \
      "$WEB_DIR/dist/" "$site_dir/"
  else
    mkdir -p "$site_dir/$publish_dir"
    rsync -a --delete "$WEB_DIR/dist/" "$site_dir/$publish_dir/"
  fi
}

for attempt in $(seq 1 "$MAX_PUSH_ATTEMPTS"); do
  site_dir="$temp_root/site-$attempt"
  echo "Preparing $target deployment (attempt $attempt/$MAX_PUSH_ATTEMPTS)"
  git clone --quiet --branch gh-pages --single-branch "$PAGES_REPO" "$site_dir"
  stage_target "$site_dir"

  git -C "$site_dir" add -A
  if git -C "$site_dir" diff --cached --quiet; then
    echo "$target is already up to date."
    exit 0
  fi

  git -C "$site_dir" commit --quiet -m "Deploy $target from $source_revision"
  if git -C "$site_dir" push origin gh-pages; then
    deployed_revision="$(git -C "$site_dir" rev-parse --short=8 HEAD)"
    echo "Deployed $target to $base_path ($deployed_revision)"
    exit 0
  fi

  echo "gh-pages changed during deployment; retrying from the latest version." >&2
done

echo "Deployment failed after $MAX_PUSH_ATTEMPTS attempts." >&2
exit 1
