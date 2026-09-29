#!/usr/bin/env bash
# ==============================================================================
# RexOne Web — Production Container & Nginx Preview Runner
# ==============================================================================
# Builds and runs the exact production multi-stage Docker image locally to test
# Nginx SPA fallback routing, gzip compression, and HTTP security headers.
#
# Usage:
#   ./scripts/test_prod.sh              # Runs production Docker container on port 8080
#   ./scripts/test_prod.sh -p 3030      # Custom port
#   ./scripts/test_prod.sh --preview    # Fast local preview via 'npm run preview'
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

PORT="${PORT:-8080}"
MODE="docker"
CONTAINER_NAME="rexone-web-prod-test"
IMAGE_NAME="rexone-web-prod-local"

# Parse CLI arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    --preview|-v)
      MODE="preview"
      shift
      ;;
    -h|--help)
      echo "RexOne Web — Production Testing Runner"
      echo ""
      echo "Usage:"
      echo "  $0                  Builds and runs production Nginx container on port 8080"
      echo "  $0 -p, --port PORT  Specify custom host port (default: 8080)"
      echo "  $0 --preview, -v    Run lightweight 'npm run preview' instead of Docker"
      echo "  $0 -h, --help       Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ "$MODE" = "preview" ]; then
  echo "🚀 Building production bundle for Vite preview..."
  npm run build
  echo "✨ Starting Vite preview on port ${PORT}..."
  exec npx vite preview --port "${PORT}" --host 0.0.0.0
fi

# Verify Docker daemon is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker daemon is not running. Please start Docker and retry."
  exit 1
fi

# Clean up any existing test container on exit
cleanup() {
  echo ""
  echo "🛑 Stopping production test container..."
  docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Remove stale container if present
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

echo "===================================================================="
echo "🏗️  Building production Docker image (Node build + Nginx runtime)..."
echo "===================================================================="
docker build -t "$IMAGE_NAME" -f Dockerfile .

echo ""
echo "===================================================================="
echo "🚀 Starting production Nginx container on http://localhost:${PORT}"
echo "===================================================================="
echo "   Container Name : $CONTAINER_NAME"
echo "   Host Port      : $PORT (mapped to Nginx port 80)"
echo "   Healthcheck    : http://localhost:${PORT}/health"
echo "   Press Ctrl+C to stop the test container."
echo "===================================================================="
echo ""

docker run --rm --name "$CONTAINER_NAME" -p "${PORT}:80" "$IMAGE_NAME"
