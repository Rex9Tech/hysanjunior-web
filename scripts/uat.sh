#!/usr/bin/env bash
# ==============================================================================
# RexOne Web — UAT Staging Runner
# ==============================================================================
# Runs the local Vite development server targeting the remote UAT server.
#
# Usage:
#   ./scripts/uat.sh            # Starts Vite on port 4000 connecting to UAT
#   ./scripts/uat.sh --docker   # Starts UAT via Docker Compose
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Target UAT endpoints
export VITE_REACT_APP_SERVER_BASE_URL="${VITE_REACT_APP_SERVER_BASE_URL:-https://uat.api.rexone.com}"
export VITE_REACT_APP_SERVER_WS_BASE_URL="${VITE_REACT_APP_SERVER_WS_BASE_URL:-wss://uat.api.rexone.com}"

echo "===================================================================="
echo "🌐 RexOne Web — Running against UAT STAGING Server"
echo "===================================================================="
echo "   Target API  : $VITE_REACT_APP_SERVER_BASE_URL"
echo "   Target WS   : $VITE_REACT_APP_SERVER_WS_BASE_URL"
echo "   Local Host  : http://localhost:4000"
echo "   Notice      : Ensure UAT backend has CORS_ALLOW_LOCALHOST=true"
echo "===================================================================="
echo ""

if [[ "${1:-}" == "--docker" ]]; then
  shift
  COMPOSE_FILE="docker-compose.dev.yaml"
  exec docker compose -f "$COMPOSE_FILE" up "$@"
fi

if [ -f ".env.uat" ]; then
  exec npx vite --mode uat --host 0.0.0.0 "$@"
else
  exec npx vite --host 0.0.0.0 "$@"
fi
