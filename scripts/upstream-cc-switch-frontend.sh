#!/usr/bin/env bash
# Upstream frontend CI commands at pin 479964f2 — copied verbatim from
# .github/workflows/ci.yml (frontend job) at that SHA.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export DISABLE_TELEMETRY="${DISABLE_TELEMETRY:-1}"
export DO_NOT_TRACK="${DO_NOT_TRACK:-1}"
export COREPACK_ENABLE_DOWNLOAD_PROMPT="${COREPACK_ENABLE_DOWNLOAD_PROMPT:-0}"

bash "$ROOT/scripts/vendor-cc-switch.sh"
cd "$ROOT/vendor/cc-switch"

# Verbatim from upstream ci.yml L82–L84, L99, L102, L105, L108, L111
corepack enable
corepack install
pnpm --version
pnpm install --frozen-lockfile
pnpm typecheck
pnpm format:check
pnpm test:unit
pnpm build:renderer
