#!/usr/bin/env bash
# ==============================================================================
# RexOne Web — Production Runner
# ==============================================================================
# Runs the local Vite development server targeting the remote Production server.
#
# Usage:
#   ./scripts/prod.sh           # Starts Vite on port 4000 connecting to Prod
#   ./scripts/prod.sh --docker  # Starts Prod via Docker Compose
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Target Production endpoints
export VITE_REACT_APP_SERVER_BASE_URL="${VITE_REACT_APP_SERVER_BASE_URL:-https://api.rexone.me}"
export VITE_REACT_APP_SERVER_WS_BASE_URL="${VITE_REACT_APP_SERVER_WS_BASE_URL:-wss://api.rexone.me}"

echo "===================================================================="
echo "🚨 RexOne Web — Running against PRODUCTION Server"
echo "===================================================================="
echo "   Target API  : $VITE_REACT_APP_SERVER_BASE_URL"
echo "   Target WS   : $VITE_REACT_APP_SERVER_WS_BASE_URL"
echo "   Local Host  : http://localhost:4000"
echo "   CAUTION     : Actions performed here affect real production data!"
echo "===================================================================="
echo ""

if [[ "${1:-}" == "--docker" ]]; then
  shift
  COMPOSE_FILE="docker-compose.dev.yaml"
  exec docker compose -f "$COMPOSE_FILE" up "$@"
fi

if [ -f ".env.prod" ]; then
  exec npx vite --mode prod --host 0.0.0.0 "$@"
else
  exec npx vite --host 0.0.0.0 "$@"
fi
