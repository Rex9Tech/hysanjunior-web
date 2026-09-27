#!/usr/bin/env bash

# ==============================================================================
# RexOne Web — Architecture Contract Check
#
# Usage:
#   ./scripts/check_architecture.sh
#
# Enforces the mechanically verifiable Web rules from LAW.md.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Ensure developer toolchains (Node.js, npm, nvm, homebrew) are discoverable in GUI environments (VS Code, Fork, SourceTree)
if ! command -v node &>/dev/null; then
  for p in \
    "/opt/homebrew/bin" \
    "/usr/local/bin" \
    "$HOME/.volta/bin" \
    "$HOME/.asdf/shims" \
    "$HOME/.fnm/current/bin"
  do
    if [ -x "$p/node" ]; then
      export PATH="$p:$PATH"
      break
    fi
  done
fi

if ! command -v node &>/dev/null && [ -d "$HOME/.nvm/versions/node" ]; then
  LATEST_NVM=$(ls -1d "$HOME/.nvm/versions/node"/* 2>/dev/null | tail -n 1)
  if [ -n "$LATEST_NVM" ] && [ -x "$LATEST_NVM/bin/node" ]; then
    export PATH="$LATEST_NVM/bin:$PATH"
  fi
fi

if ! command -v node &>/dev/null; then
  echo "⚠️ Warning: 'node' not found in PATH. Skipping architecture check in GUI environment."
  exit 0
fi

node "$SCRIPT_DIR/check_architecture.mjs"
